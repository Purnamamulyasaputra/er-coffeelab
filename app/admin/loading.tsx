import { Loader2 } from "lucide-react"

export default function AdminLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground flex-col gap-4 animate-in fade-in duration-500">
      <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      <p className="text-sm font-medium">Loading data...</p>
    </div>
  )
}
