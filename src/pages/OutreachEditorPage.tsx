import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { httpsCallable } from 'firebase/functions'
import { toast } from 'sonner'
import {
  Archive,
  ArrowLeft,
  Check,
  Copy,
  Mail,
  RotateCcw,
  Send,
  UserPlus,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/states/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { useContacts } from '@/hooks/useContacts'
import { usePageMeta } from '@/hooks/usePageMeta'
import { aiErrorMessage } from '@/lib/ai-errors'
import { createContact } from '@/services/contacts'
import { listFollowUpsForOutreach, updateFollowUp } from '@/services/followUps'
import { functions } from '@/services/functions'
import { getOutreach, updateOutreach } from '@/services/outreach'
import type { FollowUp, Outreach } from '@/types/outreach'

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  'needs-review': 'Needs review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  sent: 'Sent',
  replied: 'Replied',
  'follow-up-due': 'Follow-up due',
  closed: 'Closed',
}

function formatDate(value: { toDate?: () => Date } | undefined): string {
  const date = value?.toDate?.()
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
}

export function OutreachEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [outreach, setOutreach] = useState<Outreach | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [contactId, setContactId] = useState<string | undefined>()
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')

  const { items: contacts, refresh: refreshContacts } = useContacts(outreach?.companyId || undefined)

  usePageMeta({
    title: outreach?.companyName ? `Outreach — ${outreach.companyName}` : 'Outreach — Victor Job OS',
    description: 'Edit, approve, and track a personalized outreach message.',
    noindex: true,
    path: `/app/outreach/${id ?? ''}`,
  })

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let active = true
    getOutreach(id)
      .then(async (data) => {
        if (!active) return
        setOutreach(data)
        if (data) {
          setSubject(data.subject)
          setBody(data.body)
          setContactName(data.contactName ?? '')
          setContactEmail(data.contactEmail ?? '')
          setContactId(data.contactId)
          if (user) {
            const items = await listFollowUpsForOutreach(user.uid, data.id)
            if (active) setFollowUps(items)
          }
        }
      })
      .catch(() => {
        if (active) setError('We couldn’t load this outreach.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, user])

  if (!id) {
    return (
      <PageContainer title="Outreach">
        <EmptyState title="No outreach selected" />
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer title="Outreach">
        <LoadingState label="Loading outreach…" rows={5} />
      </PageContainer>
    )
  }

  if (error || !outreach) {
    return (
      <PageContainer title="Outreach">
        <EmptyState title={error ?? 'Outreach not found'} description="It may have been removed." />
      </PageContainer>
    )
  }

  const readonly = outreach.status === 'closed'
  const mailto = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  async function save() {
    if (!outreach) return
    setSaving(true)
    try {
      let nextContactId = contactId
      const email = contactEmail.trim()
      if (email) {
        const existing = contacts.find((contact) => contact.email?.toLowerCase() === email.toLowerCase())
        if (existing) {
          nextContactId = existing.id
        } else if (user) {
          nextContactId = await createContact(user.uid, {
            companyId: outreach.companyId,
            companyName: outreach.companyName,
            name: contactName.trim() || undefined,
            email,
            role: contactRole.trim() || undefined,
            verified: true,
          })
          await refreshContacts()
        }
      }
      await updateOutreach(outreach.id, {
        subject,
        body,
        contactName: contactName.trim(),
        contactEmail: email,
        ...(nextContactId ? { contactId: nextContactId } : {}),
      })
      setContactId(nextContactId)
      setOutreach({
        ...outreach,
        subject,
        body,
        contactName: contactName.trim(),
        contactEmail: email,
        contactId: nextContactId,
      })
      toast('Outreach saved')
    } catch {
      toast('Unable to save outreach')
    } finally {
      setSaving(false)
    }
  }

  async function act(action: string, extra?: Record<string, unknown>) {
    if (!outreach) return
    setActing(true)
    try {
      const callable = httpsCallable(functions, 'updateOutreachStatus')
      await callable({ outreachId: outreach.id, action, ...extra })
      const refreshed = await getOutreach(outreach.id)
      setOutreach(refreshed)
      if (refreshed && user) {
        setFollowUps(await listFollowUpsForOutreach(user.uid, refreshed.id))
      }
      toast('Outreach updated')
    } catch (actionError) {
      toast('Unable to update outreach', {
        description: aiErrorMessage(actionError, 'Please try again.'),
      })
    } finally {
      setActing(false)
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
      toast('Copied to clipboard')
    } catch {
      toast('Unable to copy')
    }
  }

  function restoreOriginal() {
    setSubject(outreach?.draftSubject ?? '')
    setBody(outreach?.draftBody ?? '')
  }

  async function markFollowUp(followUpId: string, status: 'sent' | 'cancelled') {
    try {
      await updateFollowUp(followUpId, { status })
      if (user && outreach) {
        setFollowUps(await listFollowUpsForOutreach(user.uid, outreach.id))
      }
    } catch {
      toast('Unable to update follow-up')
    }
  }

  function selectContact(contact: { id: string; name?: string; email?: string; role?: string }) {
    setContactId(contact.id)
    setContactName(contact.name ?? '')
    setContactEmail(contact.email ?? '')
    setContactRole(contact.role ?? '')
  }

  return (
    <PageContainer
      title={outreach.jobTitle || 'Outreach'}
      description={`${outreach.companyName || 'Unknown company'}${contactName ? ` · ${contactName}` : ''}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {!readonly && (
            <Button variant="outline" size="sm" onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => void copyMessage()}>
            <Copy />
            Copy
          </Button>
          {contactEmail ? (
            <Button size="sm" variant="outline" render={<a href={mailto} />}>
              <Mail />
              Open in mail
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <Mail />
              Open in mail
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/app/outreach"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Outreach
        </Link>
        <Badge variant={outreach.status === 'replied' ? 'secondary' : 'outline'}>
          {statusLabels[outreach.status] ?? outreach.status}
        </Badge>
        {outreach.aiProvider && (
          <Badge variant="outline" className="text-[0.65rem]">
            {outreach.aiProvider} · {outreach.model}
          </Badge>
        )}
      </div>

      {/* Status actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Workflow</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {outreach.status === 'needs-review' && (
            <>
              <Button size="sm" onClick={() => void act('approve')} disabled={acting}>
                <Check />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => void act('reject')} disabled={acting}>
                <X />
                Reject
              </Button>
            </>
          )}
          {outreach.status === 'draft' && (
            <Button size="sm" onClick={() => void act('submit-review')} disabled={acting}>
              Submit for review
            </Button>
          )}
          {(outreach.status === 'approved' || outreach.status === 'scheduled') && (
            <Button size="sm" onClick={() => void act('mark-sent')} disabled={acting}>
              <Send />
              Mark as sent
            </Button>
          )}
          {outreach.status === 'approved' && (
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={scheduleAt}
                onChange={(event) => setScheduleAt(event.target.value)}
                className="h-8 w-auto text-xs"
                aria-label="Schedule send time"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void act('schedule', {
                    scheduledAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
                  })
                }
                disabled={acting || !scheduleAt}
              >
                Schedule
              </Button>
            </div>
          )}
          {(outreach.status === 'sent' || outreach.status === 'follow-up-due') && (
            <Button size="sm" onClick={() => void act('record-reply')} disabled={acting}>
              <Check />
              Mark replied
            </Button>
          )}
          {!readonly && (
            <Button size="sm" variant="outline" onClick={() => void act('archive')} disabled={acting}>
              <Archive />
              Archive
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {outreach.sentAt
              ? `Sent ${formatDate(outreach.sentAt)}`
              : outreach.approvedAt
                ? `Approved ${formatDate(outreach.approvedAt)}`
                : 'Not sent yet'}
          </span>
        </CardContent>
      </Card>

      {/* Recipient */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recipient</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder="Hiring manager"
                disabled={readonly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="name@company.com"
                disabled={readonly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-role">Role</Label>
              <Input
                id="contact-role"
                value={contactRole}
                onChange={(event) => setContactRole(event.target.value)}
                placeholder="Engineering Manager"
                disabled={readonly}
              />
            </div>
          </div>
          {contacts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Saved contacts:</span>
              {contacts.map((contact) => (
                <Button
                  key={contact.id}
                  size="sm"
                  variant="outline"
                  onClick={() => selectContact(contact)}
                  disabled={readonly}
                >
                  <UserPlus />
                  {contact.name || contact.email || 'Contact'}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Message</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={readonly}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Body</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={restoreOriginal}
                disabled={readonly || (subject === outreach.draftSubject && body === outreach.draftBody)}
              >
                <RotateCcw />
                Restore original draft
              </Button>
            </div>
            <Textarea
              id="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-[360px] font-mono text-sm leading-relaxed"
              disabled={readonly}
            />
            <div className="text-xs text-muted-foreground">
              {body.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups */}
      {followUps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            {followUps.map((followUp) => (
              <div
                key={followUp.id}
                className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Follow-up {followUp.sequence}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(followUp.scheduledFor)} · {followUp.status}
                  </div>
                </div>
                {followUp.status === 'pending' && !readonly && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => void markFollowUp(followUp.id, 'sent')}>
                      Mark sent
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void markFollowUp(followUp.id, 'cancelled')}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />
      <div className="text-xs text-muted-foreground">
        {outreach.contactEmail
          ? 'Ready to send from your mailbox. Use “Open in mail”, review, then “Mark as sent”.'
          : 'Add a recipient email before sending.'}
      </div>
    </PageContainer>
  )
}
