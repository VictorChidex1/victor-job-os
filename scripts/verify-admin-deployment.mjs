#!/usr/bin/env node
/**
 * Read-only production verification for the admin console.
 *
 * Usage:
 *   node scripts/verify-admin-deployment.mjs
 */
import { execFileSync } from 'node:child_process'
import { stdout as output } from 'node:process'

const projectId = process.env.GCLOUD_PROJECT ?? 'victor-job-os'
const adminEmail = process.env.ADMIN_EMAIL ?? 'donchid.online@gmail.com'

function token() {
  try {
    return execFileSync('gcloud', ['auth', 'print-access-token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    throw new Error('Unable to get a gcloud access token. Run `gcloud auth login`.')
  }
}

async function request(url, authToken, options = {}) {
  const method = options.method ?? 'GET'
  const args = [
    '-sS',
    '-X',
    method,
    '-H',
    `Authorization: Bearer ${authToken}`,
    '-H',
    `x-goog-user-project: ${projectId}`,
    '-H',
    'Content-Type: application/json',
    '-w',
    '\n%{http_code}',
  ]
  if (options.body) args.push('--data-binary', options.body)
  args.push(url)
  const raw = execFileSync('curl', args, { encoding: 'utf8' })
  const marker = raw.lastIndexOf('\n')
  const status = Number(raw.slice(marker + 1).trim())
  const body = raw.slice(0, marker)
  if (status >= 400) {
    throw new Error(`${method} ${url} failed (${status}): ${body.slice(0, 500)}`)
  }
  return body ? JSON.parse(body) : {}
}

const authToken = token()
const checks = []

const release = await request(
  `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
  authToken,
)
checks.push({
  label: 'Firestore rules release',
  ok: Boolean(release.rulesetName),
  detail: release.rulesetName ?? 'missing',
})

const lookup = await request(
  `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
  authToken,
  {
    method: 'POST',
    body: JSON.stringify({ email: [adminEmail] }),
  },
)
const authUser = lookup.users?.[0]
let claims = {}
if (typeof authUser?.customAttributes === 'string' && authUser.customAttributes) {
  try {
    claims = JSON.parse(authUser.customAttributes)
  } catch {
    claims = {}
  }
}
checks.push({
  label: 'Owner Auth account',
  ok: Boolean(authUser?.localId) && authUser?.disabled !== true,
  detail: authUser?.localId ?? 'missing',
})
checks.push({
  label: 'Admin custom claim',
  ok: claims.admin === true,
  detail: `admin=${claims.admin === true}`,
})

if (authUser?.localId) {
  const userDoc = await request(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${authUser.localId}`,
    authToken,
  )
  const role = userDoc.fields?.role?.stringValue
  const disabled = userDoc.fields?.disabled?.booleanValue === true
  checks.push({
    label: 'Owner role mirror',
    ok: role === 'owner' && !disabled,
    detail: `role=${role ?? 'missing'}, disabled=${disabled}`,
  })
}

const indexes = await request(
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/adminAuditLogs/indexes`,
  authToken,
)
checks.push({
  label: 'Firestore indexes',
  ok: Array.isArray(indexes.indexes) && indexes.indexes.length > 0,
  detail: `${indexes.indexes?.length ?? 0} indexes`,
})

let failed = false
for (const check of checks) {
  output.write(`${check.ok ? 'PASS' : 'FAIL'}  ${check.label}: ${check.detail}\n`)
  if (!check.ok) failed = true
}

if (failed) {
  output.write('\nAdmin deployment verification failed.\n')
  process.exit(1)
}

output.write('\nAdmin deployment verification passed.\n')
