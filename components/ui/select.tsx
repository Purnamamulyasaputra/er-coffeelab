import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: { label: string; value: string | number }[]
  value?: string | number
  onChange?: (e: any) => void
  disabled?: boolean
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, options, value, onChange, disabled, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const selectedOption = options.find(o => String(o.value) === String(value))

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("relative w-full", className)}
        {...props}
      >
        <div
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium shadow-sm transition-colors cursor-pointer outline-none",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            open && "border-primary text-primary"
          )}
          onClick={() => setOpen(!open)}
        >
          <span className="truncate">{selectedOption?.label || "Select..."}</span>
          <ChevronDown size={14} className={cn("opacity-50 transition-transform", open && "rotate-180")} />
        </div>

        {open && (
          <div className="absolute top-full mb-1 left-0 w-full z-[100] bg-background text-foreground rounded-md border border-border shadow-2xl ring-1 ring-black/5 dark:ring-white/10 max-h-[250px] overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-[13px] text-muted-foreground">No options available</div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    "px-3 py-2.5 text-[13px] hover:bg-muted cursor-pointer transition-colors",
                    String(value) === String(opt.value) && "bg-primary/10 font-bold text-primary dark:text-primary"
                  )}
                  onClick={() => {
                    if (onChange) onChange({ target: { value: String(opt.value) } })
                    setOpen(false)
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
