export default function EmptyState({ message, icon }: { message: string; icon?: string }) {
  return (
    <div className="text-center py-12 text-muted-text">
      <p className="text-3xl mb-2">{icon || '📭'}</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}
