#!/usr/bin/env node
/**
 * Grant the Job OS admin/owner custom claim and mirror the role in Firestore.
 *
 * Emulator:
 *   node functions/scripts/grant-admin.mjs donchid.online@gmail.com --owner --emulator --yes
 *
 * Production:
 *   node functions/scripts/grant-admin.mjs donchid.online@gmail.com --owner
 *
 * Audit-only (record current state without changing access):
 *   node functions/scripts/grant-admin.mjs donchid.online@gmail.com --owner --audit-only --emulator --yes
 *   node functions/scripts/grant-admin.mjs donchid.online@gmail.com --owner --audit-only --yes
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
const owner = args.includes('--owner')
const auditOnly = args.includes('--audit-only')
const skipConfirmation = args.includes('--yes')
const role = owner ? 'owner' : 'admin'
const projectId = process.env.GCLOUD_PROJECT ?? 'victor-job-os'
const auditAction = role === 'owner' ? 'owner-provisioned' : 'admin-provisioned'

if (!email) {
  console.error(
    'Usage: node functions/scripts/grant-admin.mjs <email> [--emulator] [--owner] [--audit-only] [--yes]',
  )
  process.exit(1)
}

function gcloudAccount() {
  try {
    return execFileSync('gcloud', ['config', 'get-value', 'account'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

const actorEmail =
  process.env.ADMIN_ACTOR_EMAIL?.trim() || gcloudAccount() || 'cli'

function normalizeRole(value) {
  return value === 'owner' || value === 'admin' || value === 'user'
    ? value
    : 'user'
}

function auditFields({
  uid,
  beforeRole,
  beforeDisabled,
  afterRole,
  afterDisabled,
  changed,
}) {
  return {
    actorUid: { stringValue: `cli:${actorEmail}` },
    actorType: { stringValue: 'cli' },
    actorEmail: { stringValue: actorEmail },
    targetUid: { stringValue: uid },
    targetEmail: { stringValue: email },
    action: { stringValue: auditAction },
    beforeRole: { stringValue: beforeRole },
    afterRole: { stringValue: afterRole },
    beforeDisabled: { booleanValue: beforeDisabled },
    afterDisabled: { booleanValue: afterDisabled },
    reason: {
      stringValue: auditOnly
        ? 'Audit-only provisioning verification via grant-admin script.'
        : 'Access provisioned via grant-admin script.',
    },
    metadata: {
      mapValue: {
        fields: {
          source: { stringValue: 'grant-admin.mjs' },
          environment: {
            stringValue: emulator ? 'emulator' : 'production',
          },
          changed: { booleanValue: changed },
          auditOnly: { booleanValue: auditOnly },
        },
      },
    },
    createdAt: { timestampValue: new Date().toISOString() },
  }
}

async function confirm() {
  if (skipConfirmation) return
  const rl = createInterface({ input, output })
  const target = emulator ? 'the local emulator' : `production (${projectId})`
  const action = auditOnly
    ? `Record ${role} provisioning audit for`
    : `Grant ${role} access to`
  const answer = await rl.question(
    `${action} ${email} in ${target}? Type "yes" to continue: `,
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
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore')

  initializeApp({ projectId })
  const auth = getAuth()
  const db = getFirestore()
  const user = await auth.getUserByEmail(email)
  const claims = user.customClaims ?? {}
  const userRef = db.collection('users').doc(user.uid)
  const snapshot = await userRef.get()
  const data = snapshot.data() ?? {}

  const beforeRole = normalizeRole(data.role)
  const beforeDisabled = data.disabled === true
  const claimBefore = claims.admin === true

  if (auditOnly && beforeRole !== role) {
    throw new Error(
      `Audit-only requested ${role}, but the current role is ${beforeRole}. Run without --audit-only to change it.`,
    )
  }

  const afterRole = role
  const afterDisabled = auditOnly ? beforeDisabled : false
  const changed =
    !auditOnly &&
    (beforeRole !== role || beforeDisabled !== false || !claimBefore)

  if (!auditOnly) {
    await auth.setCustomUserClaims(user.uid, { ...claims, admin: true })
    await userRef.set(
      { role, disabled: false, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
  }

  if (changed || auditOnly) {
    await db.collection('adminAuditLogs').add({
      actorUid: `cli:${actorEmail}`,
      actorType: 'cli',
      actorEmail,
      targetUid: user.uid,
      targetEmail: email,
      action: auditAction,
      beforeRole,
      afterRole,
      beforeDisabled,
      afterDisabled: afterRole === role ? afterDisabled : beforeDisabled,
      reason: auditOnly
        ? 'Audit-only provisioning verification via grant-admin script.'
        : 'Access provisioned via grant-admin script.',
      metadata: {
        source: 'grant-admin.mjs',
        environment: 'emulator',
        changed,
        auditOnly,
      },
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  return { uid: user.uid, changed }
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

function firestoreFields(document) {
  const fields = document?.fields ?? {}
  return {
    role: fields.role?.stringValue,
    disabled: fields.disabled?.booleanValue === true,
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

  const documentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${user.localId}`
  const documentResponse = await fetch(documentUrl, { headers })
  if (!documentResponse.ok) {
    throw new Error(
      `Unable to read the user document (${documentResponse.status}): ${(
        await documentResponse.text()
      ).slice(0, 300)}`,
    )
  }
  const beforeDoc = firestoreFields(await documentResponse.json())
  const beforeRole = normalizeRole(beforeDoc.role)
  const beforeDisabled = beforeDoc.disabled
  const claimBefore = claims.admin === true

  if (auditOnly && beforeRole !== role) {
    throw new Error(
      `Audit-only requested ${role}, but the current role is ${beforeRole}. Run without --audit-only to change it.`,
    )
  }

  const afterRole = role
  const afterDisabled = auditOnly ? beforeDisabled : false
  const changed =
    !auditOnly &&
    (beforeRole !== role || beforeDisabled !== false || !claimBefore)

  if (!auditOnly) {
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

    const mirrorResponse = await fetch(
      `${documentUrl}?updateMask.fieldPaths=role&updateMask.fieldPaths=disabled`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: {
            role: { stringValue: role },
            disabled: { booleanValue: false },
          },
        }),
      },
    )
    if (!mirrorResponse.ok) {
      throw new Error(
        `Unable to update the role mirror (${mirrorResponse.status}): ${(
          await mirrorResponse.text()
        ).slice(0, 300)}`,
      )
    }
  }

  if (changed || auditOnly) {
    const auditResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/adminAuditLogs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fields: auditFields({
            uid: user.localId,
            beforeRole,
            beforeDisabled,
            afterRole,
            afterDisabled,
            changed,
          }),
        }),
      },
    )
    if (!auditResponse.ok) {
      throw new Error(
        `Unable to write the provisioning audit entry (${auditResponse.status}): ${(
          await auditResponse.text()
        ).slice(0, 300)}`,
      )
    }
  }

  return { uid: user.localId, changed }
}

async function main() {
  await confirm()
  const result = emulator ? await grantEmulator() : await grantProduction()
  const accessWord = role === 'owner' ? 'Owner' : 'Admin'

  if (auditOnly) {
    console.log(
      `\nProvisioning audit entry recorded for ${email} (uid: ${result.uid}).\nNo access changes were made.`,
    )
    return
  }

  if (!result.changed) {
    console.log(
      `\n${email} already has ${accessWord.toLowerCase()} access (uid: ${result.uid}).\nNo access changes were made and no audit entry was written.\nUse --audit-only to record the current provisioning state.`,
    )
    return
  }

  console.log(
    `\n${accessWord} access granted to ${email} (uid: ${result.uid}).\nProvisioning audit entry recorded.\nSign out of Job OS and sign back in to refresh the ID token.`,
  )
}

main().catch((error) => {
  console.error(`\nAdmin grant failed: ${error.message}`)
  process.exit(1)
})
