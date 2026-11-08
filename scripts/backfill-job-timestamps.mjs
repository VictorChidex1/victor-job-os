#!/usr/bin/env node
/**
 * Convert legacy string job timestamps to Firestore Timestamp values.
 *
 * Usage:
 *   node scripts/backfill-job-timestamps.mjs --emulator
 *   node scripts/backfill-job-timestamps.mjs --production
 *   node scripts/backfill-job-timestamps.mjs --emulator --apply --confirm --yes
 *   node scripts/backfill-job-timestamps.mjs --production --apply --confirm
 */
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const args = process.argv.slice(2)
const emulator = args.includes('--emulator')
const production = args.includes('--production')
const apply = args.includes('--apply')
const confirmed = args.includes('--confirm')
const assumeYes = args.includes('--yes')
const projectId = process.env.GCLOUD_PROJECT ?? 'victor-job-os'
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
const allowedEmulatorHosts = new Set(['127.0.0.1:8080', 'localhost:8080'])

if (emulator === production) {
  console.error('Choose exactly one target: --emulator or --production.')
  process.exit(1)
}
if (emulator && !allowedEmulatorHosts.has(emulatorHost)) {
  console.error(`Refusing emulator run against "${emulatorHost}".`)
  process.exit(1)
}
if (apply && !confirmed) {
  console.error('Refusing to write without --confirm.')
  process.exit(1)
}
if (emulator) {
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost
  process.env.GCLOUD_PROJECT = projectId
}

function millis(value) {
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function needsConversion(value) {
  return typeof value === 'string' && millis(value) !== null
}

async function confirm() {
  if (!apply || assumeYes) return
  const rl = createInterface({ input, output })
  const target = emulator ? 'the local emulator' : `production (${projectId})`
  const answer = await rl.question(
    `Convert legacy job timestamps in ${target}? Type "yes" to continue: `,
  )
  rl.close()
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Cancelled.')
    process.exit(0)
  }
}

async function writeBackup(changes) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = '.firebase/backups'
  const file = `${dir}/job-timestamps-${timestamp}.json`
  await mkdir(dir, { recursive: true })
  await writeFile(
    file,
    `${JSON.stringify({ projectId, target: emulator ? 'emulator' : 'production', createdAt: new Date().toISOString(), changes }, null, 2)}\n`,
  )
  return file
}

async function loadEmulator() {
  const { initializeApp } = await import('firebase-admin/app')
  const { getFirestore, Timestamp } = await import('firebase-admin/firestore')
  initializeApp({ projectId })
  const db = getFirestore()
  const snapshot = await db.collection('jobs').get()
  const changes = []
  for (const document of snapshot.docs) {
    const data = document.data()
    const next = {}
    if (needsConversion(data.discoveredAt)) {
      next.discoveredAt = Timestamp.fromMillis(millis(data.discoveredAt))
    }
    if (needsConversion(data.postedAt)) {
      next.postedAt = Timestamp.fromMillis(millis(data.postedAt))
    }
    if (Object.keys(next).length === 0) continue
    changes.push({
      id: document.id,
      ref: document.ref,
      before: {
        discoveredAt: data.discoveredAt ?? null,
        postedAt: data.postedAt ?? null,
      },
      after: next,
    })
  }
  return {
    changes,
    save: (change) => change.ref.update(change.after),
  }
}

function accessToken() {
  try {
    return execFileSync('gcloud', ['auth', 'print-access-token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    throw new Error('Unable to get a gcloud access token. Run `gcloud auth login`.')
  }
}

async function curlJson(url, token, options = {}) {
  const method = options.method ?? 'GET'
  const curlArgs = [
    '-sS',
    '-X',
    method,
    '-H',
    `Authorization: Bearer ${token}`,
    '-H',
    `x-goog-user-project: ${projectId}`,
    '-H',
    'Content-Type: application/json',
    '-w',
    '\n%{http_code}',
  ]
  if (options.body) curlArgs.push('--data-binary', options.body)
  curlArgs.push(url)
  const raw = execFileSync('curl', curlArgs, { encoding: 'utf8' })
  const marker = raw.lastIndexOf('\n')
  const status = Number(raw.slice(marker + 1).trim())
  const body = raw.slice(0, marker)
  if (status >= 400) {
    throw new Error(`${method} ${url} failed (${status}): ${body.slice(0, 500)}`)
  }
  return body ? JSON.parse(body) : {}
}

async function listJobs(token) {
  const documents = []
  let pageToken = ''
  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/jobs`,
    )
    url.searchParams.set('pageSize', '300')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const body = await curlJson(url, token)
    documents.push(...(body.documents ?? []))
    pageToken = body.nextPageToken ?? ''
  } while (pageToken)
  return documents
}

async function loadProduction() {
  const token = accessToken()
  const documents = await listJobs(token)
  const changes = []
  for (const document of documents) {
    const fields = document.fields ?? {}
    const discovered = fields.discoveredAt?.stringValue
    const posted = fields.postedAt?.stringValue
    const next = {}
    if (discovered && millis(discovered) !== null) {
      next.discoveredAt = new Date(discovered).toISOString()
    }
    if (posted && millis(posted) !== null) {
      next.postedAt = new Date(posted).toISOString()
    }
    if (Object.keys(next).length === 0) continue
    changes.push({
      id: document.name.split('/').pop(),
      name: document.name,
      before: { discoveredAt: discovered ?? null, postedAt: posted ?? null },
      after: next,
    })
  }
  return { changes, token }
}

async function saveProduction(change, token) {
  const relative = change.name.split('/documents/')[1]
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${relative}`,
  )
  const mask = Object.keys(change.after)
    .map((field) => `updateMask.fieldPaths=${field}`)
    .join('&')
  const fields = {}
  for (const [key, value] of Object.entries(change.after)) {
    fields[key] = { timestampValue: value }
  }
  await curlJson(`${url}?${mask}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
}

const target = emulator
  ? `emulator ${emulatorHost} (project ${projectId})`
  : `production (project ${projectId})`
const loaded = emulator ? await loadEmulator() : await loadProduction()
const changes = loaded.changes

console.log(`Target: ${target}`)
console.log(`Jobs needing timestamp conversion: ${changes.length}`)
for (const change of changes.slice(0, 5)) {
  console.log(`  sample jobs/${change.id}:`, change.after)
}

if (!apply) {
  console.log('')
  console.log('DRY RUN — no changes written.')
  console.log('Review the samples, then run again with --apply --confirm.')
  process.exit(0)
}

await confirm()
if (changes.length === 0) {
  console.log('Nothing to backfill.')
  process.exit(0)
}

const backup = await writeBackup(changes)
console.log(`Backup written to ${backup}`)

for (const change of changes) {
  if (emulator) await loaded.save(change)
  else await saveProduction(change, loaded.token)
}
console.log(`Applied timestamp conversion to ${changes.length} job(s).`)
