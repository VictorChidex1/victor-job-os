import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, type Firestore } from 'firebase/firestore'
import { createResumeVariantService } from '@/services/resumeVariantService'

let testEnv: RulesTestEnvironment
const owner = 'resume-owner'
const other = 'resume-other'

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test',
    firestore: {
      host: '127.0.0.1',
      port: 8081,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

function firestoreFor(uid: string): Firestore {
  return testEnv.authenticatedContext(uid).firestore() as unknown as Firestore
}

function serviceFor(uid: string) {
  return createResumeVariantService(firestoreFor(uid))
}

function input(name: string, isDefault = false) {
  return {
    name,
    resumeUrl: `https://example.com/${name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    targetRoles: ['Software Engineer'],
    technologies: ['React'],
    notes: '',
    isDefault,
  }
}

describe('resume variant service', () => {
  it('creates, lists, updates, and deletes variants for the owner', async () => {
    const service = serviceFor(owner)
    const id = await service.create(owner, input('Full Stack'))

    const created = await service.get(id)
    expect(created?.name).toBe('Full Stack')
    expect(created?.resumeUrl).toBe('https://example.com/full-stack.pdf')
    expect(created?.userId).toBe(owner)
    expect(created?.searchTokens).toEqual(
      expect.arrayContaining(['full', 'stack', 'software', 'engineer', 'react']),
    )

    await service.update(owner, id, { ...input('Full Stack Updated'), notes: 'Updated' })
    const updated = await service.get(id)
    expect(updated?.name).toBe('Full Stack Updated')
    expect(updated?.notes).toBe('Updated')

    const list = await service.list(owner)
    expect(list).toHaveLength(1)

    await service.delete(id)
    await expect(service.get(id)).resolves.toBeNull()
  })

  it('keeps only one default variant per user', async () => {
    const service = serviceFor(owner)
    const first = await service.create(owner, input('Full Stack', true))
    const second = await service.create(owner, input('Frontend', true))

    const list = await service.list(owner)
    const defaults = list.filter((variant) => variant.isDefault)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].id).toBe(second)
    expect(list.find((variant) => variant.id === first)?.isDefault).toBe(false)

    await service.setDefault(owner, first)
    const defaultsAfter = (await service.list(owner)).filter(
      (variant) => variant.isDefault,
    )
    expect(defaultsAfter).toHaveLength(1)
    expect(defaultsAfter[0].id).toBe(first)
  })

  it('does not expose variants to another user', async () => {
    const ownerService = serviceFor(owner)
    const id = await ownerService.create(owner, input('Private'))

    const otherDb = firestoreFor(other)
    await expect(
      getDoc(doc(otherDb, 'resumeVariants', id)),
    ).rejects.toThrow()

    const otherService = serviceFor(other)
    await expect(otherService.update(other, id, input('Hacked'))).rejects.toThrow()
  })
})
