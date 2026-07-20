export function getStoredUser() {
  try {
    const r = localStorage.getItem('vox_user')
    return r ? JSON.parse(r) : null
  } catch { return null }
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function statusColor(s: string) {
  switch (s) {
    case 'Draft': return 'bg-muted text-muted-text'
    case 'Published': return 'bg-primary-light dark:bg-primary/15 text-primary'
    case 'Closed': return 'bg-error/10 text-error'
    default: return 'bg-muted text-muted-text'
  }
}
