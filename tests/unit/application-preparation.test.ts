import { describe, expect, it } from 'vitest'
import {
  createAnswerId,
  createEmptyAnswer,
  createEmptyCoverLetter,
  createEmptyPreparation,
  isPreparationReadOnly,
  preparationApprovedAnswerCount,
  preparationDocId,
  preparationPendingItems,
  preparationReadyForApproval,
} from '@/lib/applicationPreparation'

describe('application preparation helpers', () => {
  it('builds a user-scoped preparation document id', () => {
    const id = preparationDocId('user/one', 'user/one__job/one')

    expect(id).toBe('user_one__prep__user_one__job_one')
    expect(preparationDocId('user-a', 'app-1')).not.toBe(
      preparationDocId('user-b', 'app-1'),
    )
  })

  it('creates an empty preparation with an empty cover letter and no answers', () => {
    const preparation = createEmptyPreparation('user-1', 'app-1')

    expect(preparation.coverLetter).toEqual(createEmptyCoverLetter())
    expect(preparation.answers).toEqual([])
    expect(preparation.resumeUrl).toBe('')
    expect(preparation.resumeNotes).toBe('')
    expect(preparation.resumeReviewed).toBe(false)
  })

  it('creates answers with unique ids', () => {
    const first = createAnswerId()
    const second = createAnswerId()

    expect(first).not.toBe(second)
    expect(createEmptyAnswer('Why this role?').status).toBe('empty')
  })

  it('locks preparation after approval', () => {
    expect(isPreparationReadOnly('not-started')).toBe(false)
    expect(isPreparationReadOnly('preparing')).toBe(false)
    expect(isPreparationReadOnly('needs-review')).toBe(false)
    expect(isPreparationReadOnly('approved')).toBe(true)
    expect(isPreparationReadOnly('submitted')).toBe(true)
    expect(isPreparationReadOnly('closed')).toBe(true)
  })

  it('identifies content that still needs approval', () => {
    const preparation = createEmptyPreparation('user-1', 'app-1')
    preparation.coverLetter = {
      body: 'A cover letter',
      draftBody: 'A cover letter',
      status: 'needs-review',
    }
    preparation.answers = [
      {
        ...createEmptyAnswer('Why this role?'),
        answer: 'A grounded answer',
        draftAnswer: 'A grounded answer',
        status: 'approved',
      },
    ]

    expect(preparationPendingItems(preparation)).toEqual(['Cover letter'])
    expect(preparationReadyForApproval(preparation)).toBe(false)
    expect(preparationApprovedAnswerCount(preparation)).toBe(1)

    preparation.coverLetter.status = 'approved'

    expect(preparationPendingItems(preparation)).toEqual([])
    expect(preparationReadyForApproval(preparation)).toBe(true)
  })
})
