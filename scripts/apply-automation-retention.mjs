#!/usr/bin/env node
/**
 * Apply automation retention policies.
 *
 * - Firestore TTL deletes automationArtifacts after `expiresAt` (24h).
 * - Firestore TTL deletes automationLogs after `expiresAt` (30 days).
 * - Cloud Storage lifecycle deletes automation screenshots after 1 day.
 *
 * Usage:
 *   node scripts/apply-automation-retention.mjs
 *   node scripts/apply-automation-retention.mjs --confirm
 */
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const confirmed = args.includes('--confirm')
const projectId =
  args.find((arg) => arg.startsWith('--project='))?.split('=')[1] ??
  process.env.GCLOUD_PROJECT ??
  'victor-job-os'
const bucket =
  args.find((arg) => arg.startsWith('--bucket='))?.split('=')[1] ??
  `${projectId}.firebasestorage.app`

if (!/^[a-z0-9-]+$/.test(projectId)) {
  console.error(`Invalid project ID "${projectId}".`)
  process.exit(1)
}

const commands = [
  [
    'gcloud',
    'firestore',
    'fields',
    'ttls',
    'update',
    'expiresAt',
    '--collection-group=automationArtifacts',
    '--enable-ttl',
    `--project=${projectId}`,
  ],
  [
    'gcloud',
    'firestore',
    'fields',
    'ttls',
    'update',
    'expiresAt',
    '--collection-group=automationLogs',
    '--enable-ttl',
    `--project=${projectId}`,
  ],
  [
    'gcloud',
    'storage',
    'buckets',
    'update',
    `gs://${bucket}`,
    '--lifecycle-file=storage-lifecycle.json',
    `--project=${projectId}`,
  ],
]

if (!confirmed) {
  console.log('Dry run. Run with --confirm to apply these commands:')
  for (const command of commands) {
    console.log(`  ${command.join(' ')}`)
  }
  process.exit(0)
}

for (const command of commands) {
  console.log(`$ ${command.join(' ')}`)
  try {
    execFileSync(command[0], command.slice(1), { stdio: 'inherit' })
  } catch {
    console.error(`Failed: ${command.join(' ')}`)
    process.exit(1)
  }
}

console.log('Automation retention policies applied.')
