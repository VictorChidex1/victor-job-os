#!/usr/bin/env node
/**
 * Deploy the Cloud Run Playwright browser worker.
 *
 * Usage:
 *   node scripts/deploy-browser-worker.mjs
 */
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const projectId =
  args.find((arg) => arg.startsWith('--project='))?.split('=')[1] ??
  process.env.GCLOUD_PROJECT ??
  'victor-job-os'
const region =
  args.find((arg) => arg.startsWith('--region='))?.split('=')[1] ??
  'us-central1'
const serviceName = 'victor-job-os-browser-worker'

function run(command, commandArgs) {
  console.log(`$ ${command} ${commandArgs.join(' ')}`)
  execFileSync(command, commandArgs, { stdio: 'inherit' })
}

function capture(command, commandArgs) {
  return execFileSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

const projectNumber = capture('gcloud', [
  'projects',
  'describe',
  projectId,
  '--format=value(projectNumber)',
])

run('gcloud', [
  'run',
  'deploy',
  serviceName,
  '--source=browser-worker',
  '--region',
  region,
  '--project',
  projectId,
  '--platform=managed',
  '--memory=2Gi',
  '--cpu=1',
  '--concurrency=1',
  '--min-instances=0',
  '--max-instances=1',
  '--timeout=180',
  '--port=8080',
  '--no-allow-unauthenticated',
  '--set-env-vars=NODE_ENV=production',
  '--quiet',
])

const workerUrl = capture('gcloud', [
  'run',
  'services',
  'describe',
  serviceName,
  '--region',
  region,
  '--project',
  projectId,
  '--format=value(status.url)',
])

const members = [
  `serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`,
  `serviceAccount:${projectId}@appspot.gserviceaccount.com`,
]

for (const member of members) {
  try {
    run('gcloud', [
      'run',
      'services',
      'add-iam-policy-binding',
      serviceName,
      '--region',
      region,
      '--project',
      projectId,
      '--member',
      member,
      '--role',
      'roles/run.invoker',
      '--quiet',
    ])
  } catch {
    console.warn(`Skipping invoker binding for ${member}`)
  }
}

console.log('')
console.log(`Worker URL: ${workerUrl}`)
console.log('')
console.log('Set these production Functions variables:')
console.log('  AUTOMATION_PROVIDER=cloud-run')
console.log(`  BROWSER_WORKER_URL=${workerUrl}`)
console.log('')
console.log('Recommended: create functions/.env.victor-job-os with those values and production secrets.')
