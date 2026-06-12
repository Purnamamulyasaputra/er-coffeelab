"use client"

import * as React from "react"
import { Users, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DndContext, useDraggable, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core'

function DraggableTable({ table, updateStatus }: { table: any, updateStatus: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: table.id.toString(),
    data: table
  })

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    left: table.position_x || 0,
    top: table.position_y || 0,
    zIndex: isDragging ? 100 : 1,
  }

  const status = table.status || "AVAILABLE"
  const isAvailable = status === "AVAILABLE"
  const isOccupied = status === "OCCUPIED"

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`absolute w-[120px] h-[90px] rounded-xl shadow-lg border-2 flex flex-col cursor-grab active:cursor-grabbing transition-shadow
        ${isAvailable ? "bg-[#1c1f3a] border-[#22c55e] text-[#22c55e]" :
          isOccupied ? "bg-[#1c1f3a] border-[#ef4444] text-[#ef4444]" :
            "bg-[#1c1f3a] border-[#f59e0b] text-[#f59e0b]"}
      `}
    >
      <div className={`h-8 flex items-center justify-between px-3 font-extrabold text-[15px] rounded-t-[10px]
        ${isAvailable ? "bg-[#22c55e]/10" :
          isOccupied ? "bg-[#ef4444]/10" :
            "bg-[#f59e0b]/10"}
      `}>
        <span>{table.table_number}</span>
      </div>
      <div className="flex-1 flex flex-col justify-center px-3 gap-1">
        <div className="flex justify-between items-center text-[11px] font-bold text-white">
          <span className="flex items-center gap-1 opacity-70"><Users size={12} /> {table.capacity}</span>
        </div>
        <div className="text-[10px] text-center font-extrabold uppercase mt-1">
          {status}
        </div>
      </div>
    </div>
  )
}

export function TablesClient({ initialData, isAdminView = false }: { initialData: any[], isAdminView?: boolean }) {
  const [tables, setTables] = React.useState(initialData)
  const [section, setSection] = React.useState("Indoor")

  // Sections
  const sections = Array.from(new Set(tables.map(t => t.section || "Indoor")))
  if (!sections.includes("Indoor")) sections.push("Indoor")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    if (delta.x === 0 && delta.y === 0) return; // Didn't move

    const id = parseInt(active.id.toString())

    setTables(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          position_x: (t.position_x || 0) + delta.x,
          position_y: (t.position_y || 0) + delta.y
        }
      }
      return t
    }))

    // Save to DB
    const table = tables.find(t => t.id === id)
    if (table) {
      const newX = (table.position_x || 0) + delta.x
      const newY = (table.position_y || 0) + delta.y
      try {
        await fetch(`/api/tables/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'position', position_x: Math.round(newX), position_y: Math.round(newY) })
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  const updateTableStatus = async (id: number, status: string) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await fetch(`/api/tables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', status })
    })
  }

  const currentTables = tables.filter(t => (t.section || "Indoor") === section)

  const [selectedTable, setSelectedTable] = React.useState<any>(null);

  const handleTableClick = (table: any) => {
    // Prevent opening dialog if in admin view (admin view is for moving tables only)
    if (isAdminView) return;
    setSelectedTable(table);
  };

  return (
    <div className={`${isAdminView ? 'h-full' : 'h-screen'} flex flex-col bg-[#0b0c16] text-white font-sans ${isAdminView ? 'p-0' : 'p-4 gap-4'}`}>
      <div className={`flex justify-between items-center bg-[#151729] p-4 ${isAdminView ? 'border-b' : 'rounded-xl border'} border-[#2a2d4a] shrink-0`}>
        <div className="flex items-center gap-4">
          {!isAdminView && (
            <Link href="/pos" className="text-[#8b8fa8] hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
          )}
          <div>
            <h1 className="text-[20px] font-extrabold tracking-tight m-0 leading-none">Table Management</h1>
            <p className="text-[12px] text-[#8b8fa8] mt-1.5 leading-none">Floor Plan Layout</p>
          </div>
        </div>
        <div className="flex gap-2">
          {sections.map(s => (
            <button
              key={s as string}
              onClick={() => setSection(s as string)}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${section === s
                  ? "bg-brand-blue text-white"
                  : "bg-[#1c1f3a] text-[#8b8fa8] hover:bg-[#2a2d4a] hover:text-white border border-[#2a2d4a]"
                }`}
            >
              {s as string}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-[#151729] rounded-xl border border-[#2a2d4a] relative overflow-hidden">
        {/* Floor Plan Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#8b8fa8 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="relative w-full h-full p-4 overflow-auto">
            {currentTables.map(t => (
              <div key={t.id} onClick={() => handleTableClick(t)}>
                <DraggableTable table={t} updateStatus={updateTableStatus} />
              </div>
            ))}
            {currentTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-[#8b8fa8] text-[13px] pointer-events-none">
                No tables configured for this section. Configure in Admin Panel.
              </div>
            )}
          </div>
        </DndContext>
      </div>

      {selectedTable && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151729] border border-[#2a2d4a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-6 border-b border-[#2a2d4a] flex items-center justify-between
              ${(selectedTable.status || "AVAILABLE") === "AVAILABLE" ? "bg-[#22c55e]/10" : 
                (selectedTable.status || "AVAILABLE") === "OCCUPIED" ? "bg-[#ef4444]/10" : 
                "bg-[#f59e0b]/10"}
            `}>
              <div>
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  Table {selectedTable.table_number}
                  <span className={`text-[10px] px-2 py-1 rounded-md tracking-wider uppercase
                    ${(selectedTable.status || "AVAILABLE") === "AVAILABLE" ? "bg-[#22c55e]/20 text-[#22c55e]" : 
                      (selectedTable.status || "AVAILABLE") === "OCCUPIED" ? "bg-[#ef4444]/20 text-[#ef4444]" : 
                      "bg-[#f59e0b]/20 text-[#f59e0b]"}
                  `}>
                    {selectedTable.status || "AVAILABLE"}
                  </span>
                </h2>
                <p className="text-sm text-[#8b8fa8] mt-1 flex items-center gap-1.5 opacity-80">
                  <Users size={14} /> Capacity: {selectedTable.capacity} pax &bull; {selectedTable.section || "Indoor"}
                </p>
              </div>
              <button 
                onClick={() => setSelectedTable(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              {(selectedTable.status || "AVAILABLE") === "OCCUPIED" && (
                <div className="mb-6 bg-[#1c1f3a] p-4 rounded-xl border border-[#2a2d4a]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-[#8b8fa8]">Current Order</span>
                    <span className="text-sm font-extrabold text-white">#ORD-092</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-[#8b8fa8]">Duration</span>
                    <span className="text-sm font-bold flex items-center gap-1.5 text-warning"><Clock size={14}/> 45 mins</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-[#2a2d4a]">
                    <span className="text-sm font-bold text-[#8b8fa8]">Total Bill</span>
                    <span className="text-lg font-extrabold text-white">IDR 145.000</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[11px] font-bold text-[#8b8fa8] uppercase tracking-wider mb-2">Quick Actions</p>
                
                {(selectedTable.status || "AVAILABLE") === "AVAILABLE" && (
                  <>
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl transition-all"
                      onClick={() => {
                        updateTableStatus(selectedTable.id, "OCCUPIED")
                        setSelectedTable(null)
                      }}
                    >
                      Seat Guest (Create Order)
                    </button>
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1c1f3a] hover:bg-[#2a2d4a] text-warning border border-warning/30 font-bold rounded-xl transition-all"
                      onClick={() => {
                        updateTableStatus(selectedTable.id, "RESERVED")
                        setSelectedTable(null)
                      }}
                    >
                      Reserve Table
                    </button>
                  </>
                )}

                {(selectedTable.status || "AVAILABLE") === "OCCUPIED" && (
                  <>
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1c1f3a] hover:bg-[#2a2d4a] text-white border border-[#2a2d4a] font-bold rounded-xl transition-all"
                      onClick={() => {
                        alert("Navigate to Order / Checkout screen")
                      }}
                    >
                      View Order Details
                    </button>
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1c1f3a] hover:bg-success/20 text-success border border-success/30 font-bold rounded-xl transition-all"
                      onClick={() => {
                        updateTableStatus(selectedTable.id, "AVAILABLE")
                        setSelectedTable(null)
                      }}
                    >
                      Clear Table (Mark Available)
                    </button>
                  </>
                )}

                {(selectedTable.status || "AVAILABLE") === "RESERVED" && (
                  <>
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl transition-all"
                      onClick={() => {
                        updateTableStatus(selectedTable.id, "OCCUPIED")
                        setSelectedTable(null)
                      }}
                    >
                      Guest Arrived (Seat Guest)
                    </button>
                    <button 
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1c1f3a] hover:bg-destructive/20 text-destructive border border-destructive/30 font-bold rounded-xl transition-all"
                      onClick={() => {
                        updateTableStatus(selectedTable.id, "AVAILABLE")
                        setSelectedTable(null)
                      }}
                    >
                      Cancel Reservation
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
