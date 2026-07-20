export default function Spinner({ className = 'py-12' }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
