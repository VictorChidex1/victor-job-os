#!/usr/bin/env node
/**
 * Backfill partial `atsMetadata` snapshots on jobs and applications.
 *
 * Usage:
 *   node scripts/backfill-application-metadata.mjs --emulator
 *   node scripts/backfill-application-metadata.mjs --production
 *   node scripts/backfill-application-metadata.mjs --emulator --apply --confirm --yes
 *   node scripts/backfill-application-metadata.mjs --production --apply --confirm
 *
 * Existing metadata is never overwritten. The script only adds missing
 * atsMetadata fields and writes a JSON backup before applying changes.
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

function metadataFor(data) {
  const source = typeof data.source === 'string' ? data.source : 'custom'
  const sourceJobId = typeof data.sourceJobId === 'string' ? data.sourceJobId : ''
  const applicationUrl =
    typeof data.applicationUrl === 'string' ? data.applicationUrl : ''
  return {
    source,
    sourceJobId,
    applicationUrl,
    completeness: applicationUrl ? 'partial' : 'unknown',
  }
}

function sameMetadata(a, b) {
  return (
    a &&
    a.source === b.source &&
    a.sourceJobId === b.sourceJobId &&
    a.applicationUrl === b.applicationUrl &&
    a.completeness === b.completeness
  )
}

async function confirm() {
  if (!apply || assumeYes) return
  const rl = createInterface({ input, output })
  const target = emulator ? 'the local emulator' : `production (${projectId})`
  const answer = await rl.question(
    `Write missing atsMetadata to jobs and applications in ${target}? Type "yes" to continue: `,
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
  const file = `${dir}/ats-metadata-${timestamp}.json`
  await mkdir(dir, { recursive: true })
  await writeFile(
    file,
    `${JSON.stringify({ projectId, target: emulator ? 'emulator' : 'production', createdAt: new Date().toISOString(), changes }, null, 2)}\n`,
  )
  return file
}

async function loadEmulator() {
  const { initializeApp } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  initializeApp({ projectId })
  const db = getFirestore()
  const [jobsSnapshot, applicationsSnapshot] = await Promise.all([
    db.collection('jobs').get(),
    db.collection('applications').get(),
  ])

  const jobMetadata = new Map()
  const changes = []
  for (const document of jobsSnapshot.docs) {
    const data = document.data()
    if (data.atsMetadata) continue
    const next = metadataFor(data)
    jobMetadata.set(document.id, next)
    changes.push({
      collection: 'jobs',
      id: document.id,
      ref: document.ref,
      previous: null,
      next,
    })
  }
  for (const document of applicationsSnapshot.docs) {
    const data = document.data()
    if (data.atsMetadata) continue
    const next = jobMetadata.get(data.jobId) ?? metadataFor(data)
    changes.push({
      collection: 'applications',
      id: document.id,
      ref: document.ref,
      previous: null,
      next,
    })
  }
  return {
    changes,
    save: (document, tokens) => document.ref.update({ atsMetadata: tokens }),
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

function fieldString(fields, key) {
  return typeof fields?.[key]?.stringValue === 'string'
    ? fields[key].stringValue
    : ''
}

async function listCollection(collectionName, token) {
  const documents = []
  let pageToken = ''
  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`,
    )
    url.searchParams.set('pageSize', '300')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const body = await curlJson(url, token)
    for (const doc of body.documents ?? []) {
      documents.push(doc)
    }
    pageToken = body.nextPageToken ?? ''
  } while (pageToken)
  return documents
}

async function loadProduction() {
  const token = accessToken()
  const jobs = await listCollection('jobs', token)
  const applications = await listCollection('applications', token)
  const jobMetadata = new Map()
  const changes = []

  for (const doc of jobs) {
    const id = doc.name.split('/').pop()
    const fields = doc.fields ?? {}
    if (fields.atsMetadata) continue
    const next = metadataFor({
      source: fieldString(fields, 'source'),
      sourceJobId: fieldString(fields, 'sourceJobId'),
      applicationUrl: fieldString(fields, 'applicationUrl'),
    })
    jobMetadata.set(id, next)
    changes.push({
      collection: 'jobs',
      id,
      name: doc.name,
      previous: null,
      next,
    })
  }
  for (const doc of applications) {
    const id = doc.name.split('/').pop()
    const fields = doc.fields ?? {}
    if (fields.atsMetadata) continue
    const jobId = fieldString(fields, 'jobId')
    const next =
      jobMetadata.get(jobId) ??
      metadataFor({
        source: fieldString(fields, 'jobSource'),
        sourceJobId: '',
        applicationUrl: fieldString(fields, 'applicationUrl'),
      })
    changes.push({
      collection: 'applications',
      id,
      name: doc.name,
      previous: null,
      next,
    })
  }

  return { changes, token }
}

function metadataFields(metadata) {
  return {
    source: { stringValue: metadata.source },
    sourceJobId: { stringValue: metadata.sourceJobId },
    applicationUrl: { stringValue: metadata.applicationUrl },
    completeness: { stringValue: metadata.completeness },
  }
}

async function saveProduction(document, token) {
  const relative = document.name.split('/documents/')[1]
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${relative}`,
  )
  url.searchParams.set('updateMask.fieldPaths', 'atsMetadata')
  await curlJson(url, token, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { atsMetadata: { mapValue: { fields: metadataFields(document.next) } } } }),
  })
}

const target = emulator
  ? `emulator ${emulatorHost} (project ${projectId})`
  : `production (project ${projectId})`
const loaded = emulator ? await loadEmulator() : await loadProduction()
const changes = loaded.changes.filter((change) => !sameMetadata(change.previous, change.next))

console.log(`Target: ${target}`)
console.log(`Documents needing atsMetadata: ${changes.length}`)
for (const name of ['jobs', 'applications']) {
  console.log(`- ${name}: ${changes.filter((change) => change.collection === name).length}`)
}
for (const change of changes.slice(0, 5)) {
  console.log(
    `  sample ${change.collection}/${change.id}: ${change.next.source} ${change.next.applicationUrl}`,
  )
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
  if (emulator) {
    await loaded.save(change, change.next)
  } else {
    await saveProduction(change, loaded.token)
  }
}
console.log(`Applied atsMetadata to ${changes.length} document(s).`)
