import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ShieldAlert, ShieldCheck, Trash2, UserCog, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAdminViewerRole } from '@/hooks/useAdminViewerRole'
import { useAuth } from '@/hooks/useAuth'
import {
  deleteAdminUser,
  setAdminUserDisabled,
  setAdminUserRole,
} from '@/services/adminUserManagement'
import type { AdminUserSummary } from '@/types/admin'

type PendingAction =
  | { type: 'role'; role: 'user' | 'admin' }
  | { type: 'disabled'; disabled: boolean }

export function AdminUserManagementCard({
  user,
  onUpdated,
}: {
  user: AdminUserSummary
  onUpdated: () => Promise<void>
}) {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const viewerRole = useAdminViewerRole()
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin' | null>(null)
  const role =
    selectedRole ?? (user.role === 'admin' ? 'admin' : 'user')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteReason, setDeleteReason] = useState('')

  const isSelf = currentUser?.uid === user.id
  const isOwner = user.role === 'owner'
  const locked = isOwner || isSelf
  const canDelete = viewerRole === 'owner' && !isSelf && !isOwner
  const deleteConfirmed =
    deleteConfirmation.trim() === user.id ||
    deleteConfirmation.trim() === (user.email ?? '')
  const deleteReady = deleteConfirmed && deleteReason.trim().length > 0

  function requestRoleChange() {
    if (role === user.role) return
    setPending({ type: 'role', role })
  }

  function requestDisabledChange() {
    setPending({ type: 'disabled', disabled: !user.disabled })
  }

  async function confirmAction() {
    if (!pending) return
    setSaving(true)
    try {
      const trimmedReason = reason.trim() || undefined
      if (pending.type === 'role') {
        await setAdminUserRole(user.id, pending.role, trimmedReason)
        toast(`Role updated to ${pending.role}`, {
          description:
            'The user must sign out and back in to refresh their admin claim.',
        })
      } else {
        await setAdminUserDisabled(user.id, pending.disabled, trimmedReason)
        toast(pending.disabled ? 'Account disabled' : 'Account enabled', {
          description: pending.disabled
            ? 'The account loses Firestore access immediately.'
            : 'The user can sign in again.',
        })
      }
      setPending(null)
      setReason('')
      setSelectedRole(null)
      await onUpdated()
    } catch (error) {
      toast('User management action failed', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!canDelete || !deleteReady) return
    setSaving(true)
    try {
      await deleteAdminUser(
        user.id,
        deleteConfirmation.trim(),
        deleteReason.trim() || undefined,
      )
      toast('Account permanently deleted', {
        description: 'The Auth account and owned workspace data were removed.',
      })
      setDeleteOpen(false)
      navigate('/admin/users')
    } catch (error) {
      toast('Account deletion failed', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const confirmLabel = pending
    ? pending.type === 'role'
      ? pending.role === 'admin'
        ? 'Promote to admin'
        : 'Demote to user'
      : pending.disabled
        ? 'Disable account'
        : 'Enable account'
    : 'Confirm'

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-950">
            <UserCog className="size-4 text-indigo-500" />
            Account management
          </CardTitle>
          <CardDescription>
            Role changes and account suspension are protected admin actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isOwner ? 'secondary' : 'outline'}>
              {isOwner ? 'Protected owner' : user.role}
            </Badge>
            <Badge variant={user.disabled ? 'outline' : 'secondary'}>
              {user.disabled ? 'Disabled' : 'Active'}
            </Badge>
            {isSelf && (
              <Badge variant="outline" className="gap-1">
                <ShieldAlert className="size-3" />
                Your account
              </Badge>
            )}
          </div>

          {isOwner && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              The owner account is immutable here. Admins cannot demote, disable, or
              change the owner role.
            </p>
          )}

          {isSelf && !isOwner && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              You cannot change your own role or disable your own account. This prevents
              accidental admin lockout.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Role
              </label>
              <Select
                value={role}
                onValueChange={(value) => {
                  if (value === 'user' || value === 'admin') setSelectedRole(value)
                }}
                disabled={locked || saving}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="self-end"
              size="sm"
              variant="outline"
              onClick={requestRoleChange}
              disabled={locked || saving || role === user.role}
            >
              <ShieldCheck />
              Save role
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <div className="text-sm font-medium text-slate-900">Account access</div>
              <p className="mt-0.5 text-xs text-slate-500">
                {user.disabled
                  ? 'This account cannot sign in or access Firestore.'
                  : 'Disable the account to block sign-in and revoke refresh tokens.'}
              </p>
            </div>
            <Button
              size="sm"
              variant={user.disabled ? 'outline' : 'destructive'}
              onClick={requestDisabledChange}
              disabled={locked || saving}
            >
              <UserX />
              {user.disabled ? 'Enable account' : 'Disable account'}
            </Button>
          </div>

          {canDelete && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <div>
                <div className="text-sm font-medium text-rose-900">Danger zone</div>
                <p className="mt-0.5 text-xs text-rose-700">
                  Permanently remove the Auth account and all owned workspace data.
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={saving}
              >
                <Trash2 />
                Delete account
              </Button>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Destructive changes are recorded in the admin audit log. Role and account
            changes require the Cloud Functions backend.
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setPending(null)
            setReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmLabel}</DialogTitle>
            <DialogDescription>
              {pending?.type === 'role'
                ? `Change ${user.email || user.id} from ${user.role} to ${pending.role}?`
                : pending?.disabled
                  ? `Disable ${user.email || user.id}? They will lose access immediately and must be re-enabled by an admin.`
                  : `Enable ${user.email || user.id}? The user will be able to sign in again.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="admin-action-reason"
              className="text-xs font-bold uppercase tracking-widest text-slate-400"
            >
              Reason
            </label>
            <Textarea
              id="admin-action-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional context for the audit log"
              rows={3}
              maxLength={500}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPending(null)
                setReason('')
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={pending?.type === 'disabled' && pending.disabled ? 'destructive' : 'default'}
              onClick={() => void confirmAction()}
              disabled={saving}
            >
              {saving ? 'Applying…' : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setDeleteOpen(false)
            setDeleteConfirmation('')
            setDeleteReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete account</DialogTitle>
            <DialogDescription>
              This removes the Auth account, profile, settings, and all owned
              opportunities, applications, outreach, companies, resumes, activity,
              AI runs, errors, and contacts. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              Type <strong>{user.email || user.id}</strong> to confirm.
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="delete-confirmation"
                className="text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                Confirmation
              </label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder={user.email || user.id}
                disabled={saving}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="delete-reason"
                className="text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                Reason
              </label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Required context for the audit log"
                rows={3}
                maxLength={500}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteOpen(false)
                setDeleteConfirmation('')
                setDeleteReason('')
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={saving || !deleteReady}
            >
              {saving ? 'Deleting…' : 'Permanently delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
