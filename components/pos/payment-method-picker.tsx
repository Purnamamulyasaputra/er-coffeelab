import React, { useState, useRef, useEffect } from "react"
import { CreditCard, QrCode, Smartphone, Landmark, Banknote, ChevronDown, Store } from "lucide-react"

interface PaymentMethod {
  id: number
  code: string
  name: string
  type: string
  provider: string
  is_redirect: boolean
  logo_url: string | null
}

interface PaymentMethodPickerProps {
  methods: PaymentMethod[]
  selected: string
  onChange: (code: string) => void
}

function getIconForType(type: string) {
  switch (type) {
    case 'CASH': return <Banknote size={18} className="text-emerald-500" />
    case 'QR_CODE': return <QrCode size={18} className="text-blue-500" />
    case 'E_WALLET':
    case 'EWALLET': return <Smartphone size={18} className="text-purple-500" />
    case 'VIRTUAL_ACCOUNT': return <Landmark size={18} className="text-indigo-500" />
    case 'OVER_THE_COUNTER': return <Store size={18} className="text-orange-500" />
    default: return <CreditCard size={18} />
  }
}

export function PaymentMethodPicker({ methods, selected, onChange }: PaymentMethodPickerProps) {
  const [openType, setOpenType] = useState(false)
  const [openMethod, setOpenMethod] = useState(false)
  const [internalSelectedType, setInternalSelectedType] = useState<string | null>(null)
  const typeContainerRef = useRef<HTMLDivElement>(null)
  const methodContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeContainerRef.current && !typeContainerRef.current.contains(event.target as Node)) {
        setOpenType(false)
      }
      if (methodContainerRef.current && !methodContainerRef.current.contains(event.target as Node)) {
        setOpenMethod(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedMethodObj = methods.find(m => m.code === selected)
  const selectedType = internalSelectedType || selectedMethodObj?.type || 'CASH'

  // Available types based on passed methods, ordered nicely
  const typeOrder = ['CASH', 'QR_CODE', 'E_WALLET', 'VIRTUAL_ACCOUNT', 'OVER_THE_COUNTER', 'EDC']
  const availableTypesSet = new Set(methods.map(m => m.type))
  const availableTypes = typeOrder.filter(t => availableTypesSet.has(t))

  // Available methods for the selected type
  const methodsForType = methods.filter(m => m.type === selectedType)

  const formatTypeLabel = (type: string) => {
    if (type === 'CASH') return 'Cash'
    if (type === 'QR_CODE') return 'QRIS'
    if (type === 'E_WALLET' || type === 'EWALLET') return 'E-Wallet'
    if (type === 'VIRTUAL_ACCOUNT') return 'Virtual Account'
    if (type === 'OVER_THE_COUNTER') return 'Gerai Retail (Alfamart/Indomaret)'
    if (type === 'EDC') return 'Mesin EDC / Kartu'
    return type.replace(/_/g, ' ')
  }

  const handleTypeChange = (type: string) => {
    if (type === selectedType) {
      setOpenType(false)
      return
    }
    setInternalSelectedType(type)
    
    // For types that don't need a second dropdown, auto-select the method
    if (type === 'CASH' || type === 'QR_CODE' || type === 'EDC') {
      const firstMethod = methods.find(m => m.type === type)
      if (firstMethod) {
        onChange(firstMethod.code)
      }
    } else {
      // For EWALLET, VA, OTC -> clear selection so user must pick
      onChange('')
    }
    setOpenType(false)
  }

  return (
    <div className="space-y-3">
      {/* Type Dropdown */}
      <div className="relative" ref={typeContainerRef}>
        <div
          className="flex h-11 w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold shadow-sm transition-colors cursor-pointer hover:border-primary/50"
          onClick={() => setOpenType(!openType)}
        >
          <div className="flex items-center gap-2">
            {getIconForType(selectedType)}
            <span>{formatTypeLabel(selectedType)}</span>
          </div>
          <ChevronDown size={16} className={`transition-transform opacity-50 ${openType ? 'rotate-180' : ''}`} />
        </div>

        {openType && (
          <div className="mt-2 w-full bg-card rounded-md border border-border shadow-sm py-1 animate-in slide-in-from-top-2 duration-200">
            {availableTypes.map(type => (
              <div
                key={type}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer hover:bg-muted transition-colors ${selectedType === type ? 'bg-primary/10 text-primary font-bold' : 'text-foreground font-medium'}`}
                onClick={() => handleTypeChange(type)}
              >
                {getIconForType(type)}
                {formatTypeLabel(type)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specific Method Dropdown (Only for E-Wallet, VA, and OTC) */}
      {(selectedType === 'E_WALLET' || selectedType === 'EWALLET' || selectedType === 'VIRTUAL_ACCOUNT' || selectedType === 'OVER_THE_COUNTER') && methodsForType.length > 0 && (
        <div className="relative animate-in slide-in-from-top-2 duration-200" ref={methodContainerRef}>
          <div
            className="flex h-12 w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold shadow-sm transition-colors cursor-pointer hover:border-primary/50"
            onClick={() => setOpenMethod(!openMethod)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {selectedMethodObj?.logo_url ? (
                  <img src={selectedMethodObj.logo_url} alt={selectedMethodObj.name} className="w-6 h-6 object-contain" />
                ) : (
                  getIconForType(selectedMethodObj?.type || '')
                )}
              </div>
              <span className="truncate">{selectedMethodObj?.name || 'Pilih...'}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform opacity-50 shrink-0 ${openMethod ? 'rotate-180' : ''}`} />
          </div>

          {openMethod && (
            <div className="mt-2 w-full bg-card rounded-md border border-border shadow-sm py-1 max-h-[220px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
              {methodsForType.map(method => (
                <div
                  key={method.code}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-muted transition-colors ${selected === method.code ? 'bg-primary/5 text-primary font-bold' : 'text-foreground font-medium'}`}
                  onClick={() => {
                    setInternalSelectedType(null)
                    onChange(method.code);
                    setOpenMethod(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {method.logo_url ? (
                      <img src={method.logo_url} alt={method.name} className="w-6 h-6 object-contain" />
                    ) : (
                      getIconForType(method.type)
                    )}
                  </div>
                  <span className="truncate">{method.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
