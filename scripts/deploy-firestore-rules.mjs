#!/usr/bin/env node
/**
 * Deploy Firestore rules using the gcloud access token.
 *
 * This bypasses the Firebase CLI `:test` request that can fail with:
 *   Failed to make request to https://firebaserules.googleapis.com/...:test
 *
 * Usage:
 *   node scripts/deploy-firestore-rules.mjs --confirm
 */
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const args = process.argv.slice(2)
const confirmed = args.includes('--confirm')
const assumeYes = args.includes('--yes')
const projectId =
  args.find((arg) => arg.startsWith('--project='))?.split('=')[1] ??
  process.env.GCLOUD_PROJECT ??
  'victor-job-os'

if (!confirmed) {
  console.error(
    'Refusing to deploy without --confirm. Run: node scripts/deploy-firestore-rules.mjs --confirm',
  )
  process.exit(1)
}

if (!/^[a-z0-9-]+$/.test(projectId)) {
  console.error(`Invalid project ID "${projectId}".`)
  process.exit(1)
}

async function accessToken() {
  try {
    return execFileSync('gcloud', ['auth', 'print-access-token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    throw new Error(
      'Unable to get a gcloud access token. Run `gcloud auth login` and try again.',
    )
  }
}

async function confirm() {
  if (assumeYes) return
  const rl = createInterface({ input, output })
  const answer = await rl.question(
    `Deploy Firestore rules to production project ${projectId}? Type "yes" to continue: `,
  )
  rl.close()
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Cancelled.')
    process.exit(0)
  }
}

async function request(url, token, options = {}) {
  const method = options.method ?? 'GET'
  const args = [
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
    '\\n%{http_code}',
  ]
  if (options.body) {
    args.push('--data-binary', options.body)
  }
  args.push(url)

  let output
  try {
    output = execFileSync('curl', args, { encoding: 'utf8' })
  } catch (error) {
    throw new Error(
      `Unable to call the Firebase Rules API: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  const marker = output.lastIndexOf('\n')
  const status = Number(output.slice(marker + 1).trim())
  const body = output.slice(0, marker)
  if (status >= 400) {
    throw new Error(`${method} ${url} failed (${status}): ${body.slice(0, 800)}`)
  }
  return body ? JSON.parse(body) : {}
}

const rules = await readFile('firestore.rules', 'utf8')
const token = await accessToken()
const base = `https://firebaserules.googleapis.com/v1/projects/${projectId}`
const source = {
  files: [{ name: 'firestore.rules', content: rules }],
}

await confirm()

console.log(`Project: ${projectId}`)
console.log('Validating rules source…')
await request(`${base}:test`, token, {
  method: 'POST',
  body: JSON.stringify({ source }),
})

console.log('Creating ruleset…')
const ruleset = await request(`${base}/rulesets`, token, {
  method: 'POST',
  body: JSON.stringify({ source }),
})
console.log(`Ruleset: ${ruleset.name}`)

console.log('Updating cloud.firestore release…')
const release = await request(
  `${base}/releases/cloud.firestore`,
  token,
  {
    method: 'PATCH',
    body: JSON.stringify({
      release: {
        name: `projects/${projectId}/releases/cloud.firestore`,
        rulesetName: ruleset.name,
      },
      updateMask: 'rulesetName',
    }),
  },
)

console.log(`Release: ${release.name}`)
console.log(`Active ruleset: ${release.rulesetName}`)
console.log('Firestore rules deployed successfully.')
