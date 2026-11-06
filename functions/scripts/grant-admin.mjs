#!/usr/bin/env node
/**
 * Grant the Job OS admin custom claim to an Auth user.
 *
 * Emulator:
 *   node functions/scripts/grant-admin.mjs donchid.online@gmail.com --emulator --yes
 *
 * Production:
 *   node functions/scripts/grant-admin.mjs donchid.online@gmail.com
 *
 * Production uses the existing gcloud login to obtain a short-lived access
 * token. No credentials or tokens are written to disk or printed.
 */
import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const args = process.argv.slice(2)
const email =
  args.find((arg) => !arg.startsWith('--')) ?? process.env.ADMIN_EMAIL?.trim()
const emulator = args.includes('--emulator')
const skipConfirmation = args.includes('--yes')
const projectId = process.env.GCLOUD_PROJECT ?? 'victor-job-os'

if (!email) {
  console.error(
    'Usage: node functions/scripts/grant-admin.mjs <email> [--emulator] [--yes]',
  )
  process.exit(1)
}

async function confirm() {
  if (skipConfirmation) return
  const rl = createInterface({ input, output })
  const target = emulator ? 'the local emulator' : `production (${projectId})`
  const answer = await rl.question(
    `Grant admin access to ${email} in ${target}? Type "yes" to continue: `,
  )
  rl.close()
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Cancelled.')
    process.exit(0)
  }
}

async function grantEmulator() {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'

  const { initializeApp } = await import('firebase-admin/app')
  const { getAuth } = await import('firebase-admin/auth')
  const { getFirestore } = await import('firebase-admin/firestore')

  initializeApp({ projectId })
  const auth = getAuth()
  const user = await auth.getUserByEmail(email)
  const claims = user.customClaims ?? {}

  await auth.setCustomUserClaims(user.uid, { ...claims, admin: true })
  await getFirestore()
    .collection('users')
    .doc(user.uid)
    .set({ role: 'admin', updatedAt: new Date() }, { merge: true })

  return user.uid
}

async function accessToken() {
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

async function grantProduction() {
  const token = await accessToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-goog-user-project': projectId,
  }

  const lookupResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: [email] }),
    },
  )
  if (!lookupResponse.ok) {
    throw new Error(
      `Unable to look up the account (${lookupResponse.status}): ${(
        await lookupResponse.text()
      ).slice(0, 300)}`,
    )
  }

  const lookup = await lookupResponse.json()
  const user = lookup.users?.[0]
  if (!user?.localId) {
    throw new Error(`No Auth user found for ${email}.`)
  }

  let claims = {}
  if (typeof user.customAttributes === 'string' && user.customAttributes) {
    try {
      claims = JSON.parse(user.customAttributes)
    } catch {
      claims = {}
    }
  }

  const updateResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        localId: user.localId,
        customAttributes: JSON.stringify({ ...claims, admin: true }),
      }),
    },
  )
  if (!updateResponse.ok) {
    throw new Error(
      `Unable to set the admin claim (${updateResponse.status}): ${(
        await updateResponse.text()
      ).slice(0, 300)}`,
    )
  }

  // Display-only mirror. The custom claim remains the source of truth.
  try {
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${user.localId}?updateMask.fieldPaths=role`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: { role: { stringValue: 'admin' } },
        }),
      },
    )
  } catch {
    // The claim succeeded; a missing/failed role mirror should not fail the
    // provisioning operation.
  }

  return user.localId
}

async function main() {
  await confirm()
  const uid = emulator ? await grantEmulator() : await grantProduction()
  console.log(
    `\nAdmin claim granted to ${email} (uid: ${uid}).\nSign out of Job OS and sign back in to refresh the ID token.`,
  )
}

main().catch((error) => {
  console.error(`\nAdmin grant failed: ${error.message}`)
  process.exit(1)
})
