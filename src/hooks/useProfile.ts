import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { onProfileChange, saveProfile } from '@/services/profile'
import type { ProfessionalProfile } from '@/types/profile'

export interface UseProfileResult {
  profile: ProfessionalProfile | null
  loading: boolean
  error: string | null
  saving: boolean
  save: (data: Partial<ProfessionalProfile>) => Promise<void>
}

export function useProfile(): UseProfileResult {
  const { user, status } = useAuth()
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null)
  const [loading, setLoading] = useState(status === 'loading')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }
    const unsubscribe = onProfileChange(user.uid, (data) => {
      if (data) {
        setProfile({
          id: user.uid,
          fullName: data.fullName ?? '',
          headline: data.headline ?? '',
          summary: data.summary ?? '',
          skills: data.skills ?? [],
          technologies: data.technologies ?? [],
          preferredRoles: data.preferredRoles ?? [],
          preferredLocations: data.preferredLocations ?? [],
          remotePreference: data.remotePreference ?? true,
          experienceLevel: data.experienceLevel ?? '',
          resumeUrl: data.resumeUrl,
          portfolioUrl: data.portfolioUrl,
          email: data.email ?? user.email ?? '',
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        })
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  async function save(data: Partial<ProfessionalProfile>): Promise<void> {
    if (!user) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { id: _id, updatedAt: _updatedAt, ...writeData } = data
      await saveProfile(user.uid, writeData)
    } catch (saveError) {
      setError('Unable to save your profile. Please try again.')
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  return { profile, loading, error, saving, save }
}