#!/usr/bin/env node
/**
 * One-off job text cleanup for the local Firestore emulator.
 *
 * Usage:
 *   node scripts/clean-job-text.mjs                 # dry run (default)
 *   node scripts/clean-job-text.mjs --apply --confirm
 *
 * It only updates job text fields and derived search/dedupe fields. It never
 * touches company IDs, applications, outreach, or any other collections.
 *
 * The script refuses to run against anything except the local emulator on
 * port 8080. Back up the emulator before using --apply:
 *
 *   npm run emulators:export
 *   npm run emulators:backup
 */

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
const ALLOWED_HOSTS = new Set(['127.0.0.1:8080', 'localhost:8080'])
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'victor-job-os'

if (!ALLOWED_HOSTS.has(EMULATOR_HOST)) {
  console.error(
    `Refusing to run against "${EMULATOR_HOST}". This script only supports the local emulator on port 8080.`,
  )
  process.exit(1)
}

if (PROJECT_ID !== 'victor-job-os') {
  console.error(
    `Refusing to run against project "${PROJECT_ID}". Expected the local victor-job-os emulator project.`,
  )
  process.exit(1)
}

const apply = process.argv.includes('--apply')
const confirmed = process.argv.includes('--confirm')

if (apply && !confirmed) {
  console.error(
    'Refusing to write without --confirm. Back up the emulator first, then run with --apply --confirm.',
  )
  process.exit(1)
}

process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST
process.env.GCLOUD_PROJECT = PROJECT_ID

const { initializeApp } = await import('firebase-admin/app')
const { getFirestore } = await import('firebase-admin/firestore')
const { stripHtml } = await import('../functions/lib/utils/html.js')
const {
  buildSearchTokens,
  companyTitleKey,
  fingerprintDescription,
  fingerprintJob,
} = await import('../functions/lib/utils/normalizeJob.js')

initializeApp({ projectId: PROJECT_ID })
const db = getFirestore()

function preview(value, max = 220) {
  const text = String(value ?? '')
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function hasChanged(before, after) {
  return String(before ?? '') !== String(after ?? '')
}

const snapshot = await db.collection('jobs').get()
const fieldCounts = { title: 0, companyName: 0, location: 0, description: 0 }
const samples = []
let affected = 0
let batch = db.batch()
let batched = 0
let committed = 0

for (const document of snapshot.docs) {
  const data = document.data()
  const cleanTitle = stripHtml(String(data.title ?? ''))
  const cleanCompanyName = stripHtml(String(data.companyName ?? ''))
  const hasLocation = typeof data.location === 'string'
  const cleanLocation = hasLocation ? stripHtml(data.location) : undefined
  const cleanDescription = stripHtml(String(data.description ?? ''))

  const changedFields = []
  if (hasChanged(data.title, cleanTitle)) {
    changedFields.push('title')
    fieldCounts.title += 1
  }
  if (hasChanged(data.companyName, cleanCompanyName)) {
    changedFields.push('companyName')
    fieldCounts.companyName += 1
  }
  if (hasLocation && hasChanged(data.location, cleanLocation)) {
    changedFields.push('location')
    fieldCounts.location += 1
  }
  if (hasChanged(data.description, cleanDescription)) {
    changedFields.push('description')
    fieldCounts.description += 1
  }

  if (changedFields.length === 0) {
    continue
  }

  affected += 1

  const update = {
    title: cleanTitle,
    companyName: cleanCompanyName,
    description: cleanDescription,
    searchTokens: buildSearchTokens(
      cleanTitle,
      cleanCompanyName,
      cleanLocation,
      Array.isArray(data.skills) ? data.skills : [],
    ),
    descriptionFingerprint: fingerprintDescription(cleanDescription),
  }
  if (hasLocation) {
    update.location = cleanLocation
  }
  if (cleanCompanyName && cleanTitle) {
    update.companyTitleKey = companyTitleKey(cleanCompanyName, cleanTitle)
  }
  if (data.source && data.sourceJobId) {
    update.fingerprint = fingerprintJob(data.source, data.sourceJobId, cleanTitle)
  }

  if (samples.length < 3 || /forward deployed engineer/i.test(String(data.title ?? ''))) {
    samples.push({
      id: document.id,
      titleBefore: preview(data.title),
      titleAfter: preview(cleanTitle),
      companyBefore: preview(data.companyName),
      companyAfter: preview(cleanCompanyName),
      locationBefore: preview(data.location),
      locationAfter: preview(cleanLocation),
      descriptionBefore: preview(data.description, 320),
      descriptionAfter: preview(cleanDescription, 320),
      changedFields,
    })
  }

  if (apply) {
    batch.update(document.ref, update)
    batched += 1
    if (batched >= 400) {
      await batch.commit()
      committed += batched
      batched = 0
      batch = db.batch()
    }
  }
}

if (apply && batched > 0) {
  await batch.commit()
  committed += batched
}

console.log(`Emulator: ${EMULATOR_HOST} (project ${PROJECT_ID})`)
console.log(`Total jobs: ${snapshot.size}`)
console.log(`Jobs needing cleanup: ${affected}`)
console.log(
  `Field changes: title ${fieldCounts.title}, company ${fieldCounts.companyName}, location ${fieldCounts.location}, description ${fieldCounts.description}`,
)
console.log('')
console.log('Samples:')
for (const sample of samples) {
  console.log(`- ${sample.titleBefore}  →  ${sample.titleAfter}`)
  console.log(`  fields: ${sample.changedFields.join(', ')}`)
  console.log(`  company: ${sample.companyBefore}  →  ${sample.companyAfter}`)
  if (sample.changedFields.includes('location')) {
    console.log(`  location: ${sample.locationBefore}  →  ${sample.locationAfter}`)
  }
  if (sample.changedFields.includes('description')) {
    console.log(`  description before: ${sample.descriptionBefore}`)
    console.log(`  description after:  ${sample.descriptionAfter}`)
  }
  console.log('')
}

if (apply) {
  console.log(`Applied ${committed} job updates.`)
  console.log('A company ID is intentionally left unchanged so company links stay intact.')
} else {
  console.log('DRY RUN — no changes written.')
  console.log('Before applying:')
  console.log('  1. npm run emulators:export')
  console.log('  2. npm run emulators:backup')
  console.log('  3. node scripts/clean-job-text.mjs --apply --confirm')
}
