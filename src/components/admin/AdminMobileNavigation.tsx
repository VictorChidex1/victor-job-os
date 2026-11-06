import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export function AdminMobileNavigation({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-64 gap-0 p-0"
      >
        <SheetTitle className="sr-only">Admin navigation</SheetTitle>
        <AdminSidebar onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
