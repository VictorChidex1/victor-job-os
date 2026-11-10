import { initializeApp } from 'firebase-admin/app'
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
} from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { getAIService } from '../ai/index.js'
import type {
  ApplicationAnswersInput,
  CoverLetterInput,
} from '../ai/types.js'
import { getJob } from '../jobs/qualification.js'
import { recordActivity } from '../utils/activity.js'
import { currentProvider, recordAiRun } from '../utils/aiUsage.js'
import { toHttpsError } from '../utils/errors.js'
import { recordError } from '../utils/errorLog.js'
import { assertAiBudgetAvailable } from '../utils/budgetControl.js'
import { stripHtml } from '../utils/html.js'

initializeApp()
const db = getFirestore()

const PROMPT_VERSION = 'application-prep-v1'
const MAX_QUESTIONS = 10

const CALLABLE_OPTIONS = {
  memory: '512MiB' as const,
  timeoutSeconds: 180,
  maxInstances: 2,
}

interface PreparationRequest {
  applicationId?: string
}

interface AnswersRequest extends PreparationRequest {
  questions?: unknown
}

interface LoadedContext {
  applicationId: string
  jobId: string
  input: CoverLetterInput
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
}

function verifiedValues(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (record.status !== 'verified') return []
    const item = readString(record.value)
    return item ? [item] : []
  })
}

function preparationDocId(uid: string, applicationId: string): string {
  return `${uid.replace(/\//g, '_')}__prep__${applicationId.replace(/\//g, '_')}`
}

function parseQuestions(value: unknown): Array<{ id: string; question: string }> {
  if (!Array.isArray(value)) return []
  const questions: Array<{ id: string; question: string }> = []
  const seen = new Set<string>()

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const id = readString(record.id)
    const question = stripHtml(readString(record.question)).trim()
    if (!id || !question || seen.has(id)) continue
    seen.add(id)
    questions.push({ id, question })
  }

  return questions
}

async function loadContext(
  uid: string,
  applicationId: string,
): Promise<LoadedContext> {
  const applicationSnapshot = await db
    .collection('applications')
    .doc(applicationId)
    .get()

  if (!applicationSnapshot.exists) {
    throw new HttpsError('not-found', 'Application not found.')
  }

  const application = applicationSnapshot.data() ?? {}
  if (application.userId !== uid) {
    throw new HttpsError('permission-denied', 'This application does not belong to you.')
  }

  const jobId = readString(application.jobId)
  if (!jobId) {
    throw new HttpsError('failed-precondition', 'This application has no source opportunity.')
  }

  const job = await getJob(jobId)
  if (!job) {
    throw new HttpsError(
      'failed-precondition',
      'The source opportunity no longer exists. You can still write preparation content manually.',
    )
  }
  if (job.userId !== undefined && job.userId !== uid) {
    throw new HttpsError('permission-denied', 'This opportunity does not belong to you.')
  }

  const profileSnapshot = await db.collection('profiles').doc(uid).get()
  const profileData = profileSnapshot.data() ?? {}
  const profile = {
    fullName: readString(profileData.fullName) || undefined,
    headline: readString(profileData.headline),
    summary: readString(profileData.summary),
    skills: verifiedValues(profileData.skills),
    technologies: verifiedValues(profileData.technologies),
    preferredRoles: readStringArray(profileData.preferredRoles),
    experienceLevel: readString(profileData.experienceLevel) || undefined,
  }

  const analysisSnapshot = await db
    .collection('jobAnalyses')
    .where('userId', '==', uid)
    .where('jobId', '==', jobId)
    .orderBy('analyzedAt', 'desc')
    .limit(1)
    .get()
  const analysisData = analysisSnapshot.docs[0]?.data()

  const analysis = analysisData
    ? {
        fitScore:
          typeof analysisData.fitScore === 'number'
            ? analysisData.fitScore
            : undefined,
        roleType: readString(analysisData.roleType) || undefined,
        matchedSkills: readStringArray(analysisData.matchedSkills),
        missingSkills: readStringArray(analysisData.missingSkills),
        summary: readString(analysisData.summary) || undefined,
      }
    : undefined

  let company: CoverLetterInput['company']
  const companyId = readString(application.companyId)
  if (companyId) {
    const companySnapshot = await db.collection('companies').doc(companyId).get()
    const companyData = companySnapshot.data()
    if (
      companySnapshot.exists &&
      companyData &&
      companyData.userId === uid
    ) {
      company = {
        name: readString(companyData.name) || readString(application.companyName),
        industry: readString(companyData.industry) || undefined,
        description: readString(companyData.description) || undefined,
        product: readString(companyData.product) || undefined,
        roleContext: readString(companyData.roleContext) || undefined,
        hiringSignals: readStringArray(companyData.hiringSignals),
        researchSummary: readString(companyData.researchSummary) || undefined,
      }
    }
  }
  if (!company && readString(application.companyName)) {
    company = {
      name: readString(application.companyName),
      hiringSignals: [],
    }
  }

  const projectsSnapshot = await db
    .collection('projects')
    .where('userId', '==', uid)
    .where('isActive', '==', true)
    .limit(20)
    .get()

  const projects = projectsSnapshot.docs.map((document) => {
    const project = document.data()
    return {
      title: readString(project.title),
      summary: readString(project.summary),
      technologies: readStringArray(project.technologies),
      outcomes: readStringArray(project.outcomes),
      verifiedMetrics: readStringArray(project.verifiedMetrics),
      url: readString(project.url) || undefined,
    }
  })

  return {
    applicationId,
    jobId,
    input: {
      job: {
        title: job.title,
        description: job.description,
        location: job.location,
        remote: job.remote ?? false,
        skills: job.skills ?? [],
      },
      analysis,
      company,
      profile,
      projects,
    },
  }
}

async function writePreparation(
  uid: string,
  applicationId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const ref = db
    .collection('applicationPreparations')
    .doc(preparationDocId(uid, applicationId))
  const existing = await ref.get()

  await ref.set(
    {
      userId: uid,
      applicationId,
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}

function providerDetails() {
  return currentProvider()
}

export const generateCoverLetter = onCall(
  CALLABLE_OPTIONS,
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }

    const data = (request.data ?? {}) as PreparationRequest
    const applicationId = readString(data.applicationId)
    if (!applicationId) {
      throw new HttpsError('invalid-argument', 'applicationId is required.')
    }
    await assertAiBudgetAvailable()

    try {
      const context = await loadContext(uid, applicationId)
      const ai = getAIService()
      const provider = providerDetails()
      const startedAt = Date.now()

      let coverLetter
      try {
        coverLetter = await ai.generateCoverLetter(context.input)
        await recordAiRun({
          userId: uid,
          provider: provider.provider,
          model: provider.model,
          operation: 'generateCoverLetter',
          status: 'success',
          durationMs: Date.now() - startedAt,
          jobId: context.jobId,
        })
      } catch (error) {
        await recordAiRun({
          userId: uid,
          provider: provider.provider,
          model: provider.model,
          operation: 'generateCoverLetter',
          status: 'error',
          durationMs: Date.now() - startedAt,
          jobId: context.jobId,
          error: error instanceof Error ? error.message.slice(0, 500) : String(error),
        })
        throw error
      }

      if (!coverLetter.body.trim()) {
        throw new HttpsError(
          'internal',
          'The AI returned an empty cover letter. Please try again.',
        )
      }

      await writePreparation(uid, applicationId, {
        coverLetter: {
          body: coverLetter.body,
          draftBody: coverLetter.body,
          status: 'needs-review',
          aiProvider: provider.provider,
          model: provider.model,
          promptVersion: PROMPT_VERSION,
          approvedAt: FieldValue.delete(),
          updatedAt: Timestamp.now(),
        },
      })

      await recordActivity(
        uid,
        'application-preparation',
        'completed',
        'Cover letter draft generated.',
        { applicationId, jobId: context.jobId },
      )

      return { body: coverLetter.body }
    } catch (error) {
      await recordError('generateCoverLetter', error, {
        userId: uid,
        applicationId,
      })
      throw toHttpsError(error, 'Cover letter generation failed. Please try again.')
    }
  },
)

export const generateApplicationAnswers = onCall(
  CALLABLE_OPTIONS,
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }

    const data = (request.data ?? {}) as AnswersRequest
    const applicationId = readString(data.applicationId)
    if (!applicationId) {
      throw new HttpsError('invalid-argument', 'applicationId is required.')
    }
    await assertAiBudgetAvailable()

    const questions = parseQuestions(data.questions)
    if (questions.length === 0) {
      throw new HttpsError('invalid-argument', 'At least one question is required.')
    }
    if (questions.length > MAX_QUESTIONS) {
      throw new HttpsError(
        'invalid-argument',
        `You can generate at most ${MAX_QUESTIONS} answers at once.`,
      )
    }

    try {
      const context = await loadContext(uid, applicationId)
      const ai = getAIService()
      const provider = providerDetails()
      const startedAt = Date.now()
      const answersInput: ApplicationAnswersInput = {
        ...context.input,
        questions,
      }

      let generated
      try {
        generated = await ai.generateApplicationAnswers(answersInput)
        await recordAiRun({
          userId: uid,
          provider: provider.provider,
          model: provider.model,
          operation: 'generateApplicationAnswers',
          status: 'success',
          durationMs: Date.now() - startedAt,
          jobId: context.jobId,
        })
      } catch (error) {
        await recordAiRun({
          userId: uid,
          provider: provider.provider,
          model: provider.model,
          operation: 'generateApplicationAnswers',
          status: 'error',
          durationMs: Date.now() - startedAt,
          jobId: context.jobId,
          error: error instanceof Error ? error.message.slice(0, 500) : String(error),
        })
        throw error
      }

      const generatedById = new Map(
        generated.answers.map((answer) => [answer.id, answer]),
      )
      for (const question of questions) {
        const answer = generatedById.get(question.id)
        if (!answer || !answer.answer.trim()) {
          throw new HttpsError(
            'internal',
            'The AI returned an incomplete set of answers. Please try again.',
          )
        }
      }

      const prepRef = db
        .collection('applicationPreparations')
        .doc(preparationDocId(uid, applicationId))
      const prepSnapshot = await prepRef.get()
      const existingAnswers = Array.isArray(prepSnapshot.data()?.answers)
        ? (prepSnapshot.data()?.answers as DocumentData[])
        : []
      const answersById = new Map<string, DocumentData>()
      for (const answer of existingAnswers) {
        const id = readString(answer.id)
        if (id) answersById.set(id, answer)
      }

      for (const question of questions) {
        const answer = generatedById.get(question.id)
        if (!answer) continue
        const previous = answersById.get(question.id) ?? {}
        const nextAnswer: DocumentData = {
          ...previous,
          id: question.id,
          question: answer.question,
          answer: answer.answer,
          draftAnswer: answer.answer,
          status: 'needs-review',
          aiProvider: provider.provider,
          model: provider.model,
          promptVersion: PROMPT_VERSION,
          updatedAt: Timestamp.now(),
        }
        delete nextAnswer.approvedAt
        answersById.set(question.id, nextAnswer)
      }

      await writePreparation(uid, applicationId, {
        answers: Array.from(answersById.values()),
      })

      await recordActivity(
        uid,
        'application-preparation',
        'completed',
        'Application answer drafts generated.',
        {
          applicationId,
          jobId: context.jobId,
          questionCount: questions.length,
        },
      )

      return { answers: generated.answers }
    } catch (error) {
      await recordError('generateApplicationAnswers', error, {
        userId: uid,
        applicationId,
      })
      throw toHttpsError(
        error,
        'Application answer generation failed. Please try again.',
      )
    }
  },
)
