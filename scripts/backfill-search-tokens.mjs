#!/usr/bin/env node
/**
 * Backfill bounded `searchTokens` arrays on companies, applications, outreach,
 * and resume variants.
 *
 * Dry run first (default):
 *   node scripts/backfill-search-tokens.mjs --emulator
 *   node scripts/backfill-search-tokens.mjs --production
 *
 * Apply after reviewing the dry run:
 *   node scripts/backfill-search-tokens.mjs --emulator --apply --confirm
 *   node scripts/backfill-search-tokens.mjs --production --apply --confirm
 *
 * The script only writes `searchTokens`. It never changes message bodies,
 * notes, statuses, ownership, or any other field. A JSON backup of every
 * previous token value is written to .firebase/backups before any write is
 * attempted. Re-running is safe: documents whose tokens already match are skipped.
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
  console.error(
    'Choose exactly one target: --emulator or --production. Dry run is the default; add --apply --confirm to write.',
  )
  process.exit(1)
}

if (emulator && !allowedEmulatorHosts.has(emulatorHost)) {
  console.error(
    `Refusing emulator run against "${emulatorHost}". Expected 127.0.0.1:8080 or localhost:8080.`,
  )
  process.exit(1)
}

if (apply && !confirmed) {
  console.error(
    'Refusing to write without --confirm. Run the dry run first, then repeat with --apply --confirm.',
  )
  process.exit(1)
}

if (!/^[a-z0-9-]+$/.test(projectId)) {
  console.error(`Invalid project ID "${projectId}".`)
  process.exit(1)
}

if (emulator) {
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost
  process.env.GCLOUD_PROJECT = projectId
}

const { buildSearchTokens } = await import('../functions/lib/utils/normalizeJob.js')

const COLLECTIONS = {
  companies: (data) => [data.name, data.industry, data.location],
  applications: (data) => [
    data.companyName,
    data.jobTitle,
    data.location,
    data.jobSource,
  ],
  outreach: (data) => [
    data.companyName,
    data.jobTitle,
    data.contactName,
    data.contactEmail,
    data.subject,
  ],
  resumeVariants: (data) => [
    data.name,
    data.targetRoles,
    data.technologies,
  ],
}

function sameTokens(before, after) {
  if (!Array.isArray(before)) return false
  if (before.length !== after.length) return false
  return before.every((value, index) => value === after[index])
}

function tokenize(data, fields) {
  const values = fields.map((value) => (typeof value === 'string' ? value : undefined))
  return buildSearchTokens(...values)
}

async function confirm() {
  if (!apply || assumeYes) return
  const rl = createInterface({ input, output })
  const target = emulator ? 'the local emulator' : `production (${projectId})`
  const answer = await rl.question(
    `Write searchTokens to companies, applications, outreach, and resume variants in ${target}? Type "yes" to continue: `,
  )
  rl.close()
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Cancelled.')
    process.exit(0)
  }
}

async function writeBackup(changes) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const directory = '.firebase/backups'
  const file = `${directory}/search-tokens-${timestamp}.json`
  await mkdir(directory, { recursive: true })
  await writeFile(
    file,
    `${JSON.stringify({ projectId, target: emulator ? 'emulator' : 'production', createdAt: new Date().toISOString(), changes }, null, 2)}\n`,
  )
  return file
}

async function loadEmulatorDocuments() {
  const { initializeApp } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')

  initializeApp({ projectId })
  const db = getFirestore()
  const documents = []

  for (const [collectionName, fields] of Object.entries(COLLECTIONS)) {
    const snapshot = await db.collection(collectionName).get()
    for (const document of snapshot.docs) {
      const data = document.data()
      documents.push({
        collection: collectionName,
        id: document.id,
        ref: document.ref,
        previous: data.searchTokens,
        next: tokenize(data, fields(data)),
        data,
      })
    }
  }

  return { documents, save: async (document, tokens) => {
    await document.ref.update({ searchTokens: tokens })
  } }
}

async function productionToken() {
  try {
    return execFileSync('gcloud', ['auth', 'print-access-token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    throw new Error(
      'Unable to get a gcloud access token. Sign in with `gcloud auth login` and try again.',
    )
  }
}

function documentData(document) {
  const data = {}
  for (const [key, value] of Object.entries(document.fields ?? {})) {
    if (typeof value?.stringValue === 'string') data[key] = value.stringValue
    if (key === 'searchTokens' && Array.isArray(value?.arrayValue?.values)) {
      data.searchTokens = value.arrayValue.values
        .map((entry) => entry?.stringValue)
        .filter((entry) => typeof entry === 'string')
    }
  }
  return data
}

async function loadProductionDocuments() {
  const token = await productionToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'x-goog-user-project': projectId,
  }
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  const documents = []

  for (const [collectionName, fields] of Object.entries(COLLECTIONS)) {
    let pageToken = ''
    do {
      const url = new URL(`${base}/${collectionName}`)
      url.searchParams.set('pageSize', '300')
      if (pageToken) url.searchParams.set('pageToken', pageToken)
      const response = await fetch(url, { headers })
      if (!response.ok) {
        throw new Error(
          `Unable to list ${collectionName} (${response.status}): ${(
            await response.text()
          ).slice(0, 300)}`,
        )
      }
      const body = await response.json()
      for (const document of body.documents ?? []) {
        const id = document.name.split('/').pop()
        const data = documentData(document)
        documents.push({
          collection: collectionName,
          id,
          name: document.name,
          previous: data.searchTokens,
          next: tokenize(data, fields(data)),
          data,
        })
      }
      pageToken = body.nextPageToken ?? ''
    } while (pageToken)
  }

  return { documents, headers, base, save: async (document, tokens) => {
    const url = new URL(`${base}/${document.name.split('/documents/')[1]}`)
    url.searchParams.set('updateMask.fieldPaths', 'searchTokens')
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          searchTokens: {
            arrayValue: {
              values: tokens.map((value) => ({ stringValue: value })),
            },
          },
        },
      }),
    })
    if (!response.ok) {
      throw new Error(
        `Unable to update ${document.collection}/${document.id} (${response.status}): ${(
          await response.text()
        ).slice(0, 300)}`,
      )
    }
  } }
}

const target = emulator
  ? `emulator ${emulatorHost} (project ${projectId})`
  : `production (project ${projectId})`
const loaded = emulator ? await loadEmulatorDocuments() : await loadProductionDocuments()
const changes = loaded.documents.filter(
  (document) => !sameTokens(document.previous, document.next),
)

console.log(`Target: ${target}`)
console.log(`Documents scanned: ${loaded.documents.length}`)
console.log(`Documents needing searchTokens: ${changes.length}`)
for (const [collectionName] of Object.entries(COLLECTIONS)) {
  const count = changes.filter((document) => document.collection === collectionName).length
  console.log(`- ${collectionName}: ${count}`)
}

for (const document of changes.slice(0, 5)) {
  console.log(
    `  sample ${document.collection}/${document.id}: ${document.next.slice(0, 12).join(', ')}`,
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

const backupFile = await writeBackup(
  changes.map((document) => ({
    collection: document.collection,
    id: document.id,
    previousSearchTokens: document.previous ?? null,
    nextSearchTokens: document.next,
  })),
)
console.log(`Backup written to ${backupFile}`)

let saved = 0
for (const document of changes) {
  await loaded.save(document, document.next)
  saved += 1
}
console.log(`Applied searchTokens to ${saved} document(s).`)
