"use client"

import * as React from "react"
import { Download, Eye, X, Mail, Phone, MapPin, Calendar, CreditCard, ChevronRight, Filter } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatStatus } from "@/lib/utils"

function getTierVariant(tier: string): any {
  if (tier === 'Platinum') return 'cool'
  if (tier === 'Gold') return 'warning'
  if (tier === 'Silver') return 'default'
  return 'success'
}

function formatMoney(amount: number) {
  return "Rp " + Number(amount || 0).toLocaleString("id-ID")
}

export function CustomersClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = React.useState(initialData)
  const [selectedCustomer, setSelectedCustomer] = React.useState<any | null>(null)
  const [customerDetail, setCustomerDetail] = React.useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = React.useState(false)

  // Filters
  const [tierFilter, setTierFilter] = React.useState<string>("ALL")
  const [showFilters, setShowFilters] = React.useState(false)

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Phone", "Email", "Tier", "Points", "Lifetime Spend", "Last Visit"]
    const rows = data.map(c => [
      c.id, 
      `"${c.name}"`, 
      `"${c.phone || ''}"`, 
      `"${c.email || ''}"`,
      c.tier,
      c.pts,
      c.spend,
      c.last
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `customers_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenDetail = async (customer: any) => {
    setSelectedCustomer(customer)
    setCustomerDetail(null)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}`)
      if (res.ok) {
        const result = await res.json()
        setCustomerDetail(result.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDetail(false)
    }
  }

  const filteredData = React.useMemo(() => {
    if (tierFilter === "ALL") return data
    return data.filter(c => c.tier.toUpperCase() === tierFilter.toUpperCase())
  }, [data, tierFilter])

  const columns = [
    { header: "No", accessorKey: "id" as const },
    { header: "Name", accessorKey: "name" as const },
    { header: "Phone", accessorKey: "phone" as const },
    { 
      header: "Tier", 
      cell: (item: any) => (
        <Badge variant={getTierVariant(item.tier)}>
          {item.tier}
        </Badge>
      )
    },
    { header: "Points", accessorKey: "pts" as const },
    { header: "Total Spend", cell: (item: any) => formatMoney(item.spend) },
    { header: "Last Visit", accessorKey: "last" as const },
    {
      header: "Actions",
      cell: (item: any) => (
        <Button size="icon" onClick={() => handleOpenDetail(item)} className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Eye size={14} /></Button>
      )
    }
  ]

  return (
    <div className="relative">
      <PageHeader 
        title="Customers" 
        description="CRM and user profiles" 
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 bg-card border-border hover:bg-muted text-foreground">
              <Filter size={14} /> Filter
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-card border-border hover:bg-muted text-foreground">
              <Download size={14} /> Export CSV
            </Button>
          </div>
        } 
      />

      {showFilters && (
        <div className="flex items-center gap-4 mb-4 bg-card p-3 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-muted-foreground">Tier:</span>
            <select 
              value={tierFilter} 
              onChange={e => setTierFilter(e.target.value)}
              className="bg-muted border border-border text-foreground text-[12px] rounded-lg px-3 py-1.5 outline-none appearance-none pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="ALL">All Tiers</option>
              <option value="PLATINUM">Platinum</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>
        </div>
      )}

      <DataTable data={filteredData} columns={columns} keyExtractor={item => item.id} />

      {/* Detail Drawer Overlay */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-card w-full max-w-[450px] h-full shadow-2xl border-l border-border flex flex-col transform transition-transform" onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <h2 className="text-[18px] font-bold text-foreground">Customer Detail</h2>
              <button onClick={() => setSelectedCustomer(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {loadingDetail ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                </div>
              ) : customerDetail ? (
                <div className="space-y-6">
                  {/* Profile Card */}
                  <div className="bg-muted rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue text-xl font-bold uppercase">
                        {customerDetail.profile.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-foreground font-bold text-[16px]">{customerDetail.profile.name}</h3>
                        <Badge variant={getTierVariant(customerDetail.profile.tier_name)} className="mt-1">
                          {customerDetail.profile.tier_name}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                        <Phone size={14} className="text-brand-blue" /> {customerDetail.profile.phone || 'No phone'}
                      </div>
                      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                        <Mail size={14} className="text-brand-blue" /> {customerDetail.profile.email || 'No email'}
                      </div>
                      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                        <Calendar size={14} className="text-brand-blue" /> Joined {new Date(customerDetail.profile.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-xl p-4 border border-border">
                      <div className="text-[11px] text-muted-foreground font-semibold mb-1">TOTAL POINTS</div>
                      <div className="text-[18px] font-bold text-foreground">{Number(customerDetail.profile.total_points).toLocaleString()}</div>
                    </div>
                    <div className="bg-muted rounded-xl p-4 border border-border">
                      <div className="text-[11px] text-muted-foreground font-semibold mb-1">LIFETIME SPEND</div>
                      <div className="text-[15px] font-bold text-green-500">{formatMoney(customerDetail.profile.lifetime_spend)}</div>
                    </div>
                  </div>

                  {/* Order History */}
                  <div>
                    <h4 className="text-[14px] font-bold text-foreground mb-3">Recent Orders</h4>
                    {customerDetail.orders.length === 0 ? (
                      <div className="text-[13px] text-muted-foreground p-4 text-center bg-muted rounded-xl border border-border">No orders found</div>
                    ) : (
                      <div className="space-y-2">
                        {customerDetail.orders.map((order: any) => (
                          <div key={order.id} className="bg-muted rounded-xl p-3 border border-border flex items-center justify-between group cursor-pointer hover:border-brand-blue transition-colors">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[12px] font-bold text-foreground">{order.invoice_code}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-card text-muted-foreground">{order.branch_name || 'Online'}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('id-ID')} • {formatMoney(order.total_amount)}
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Addresses */}
                  <div>
                    <h4 className="text-[14px] font-bold text-foreground mb-3">Saved Addresses</h4>
                    {customerDetail.addresses.length === 0 ? (
                      <div className="text-[13px] text-muted-foreground p-4 text-center bg-muted rounded-xl border border-border">No addresses saved</div>
                    ) : (
                      <div className="space-y-2">
                        {customerDetail.addresses.map((addr: any) => (
                          <div key={addr.id} className="bg-muted rounded-xl p-3 border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin size={12} className="text-brand-blue" />
                              <span className="text-[12px] font-bold text-foreground">{addr.label}</span>
                              {addr.is_primary && <span className="text-[9px] bg-brand-blue/20 text-brand-blue px-1.5 py-0.5 rounded">PRIMARY</span>}
                            </div>
                            <div className="text-[11px] text-muted-foreground pl-5 leading-relaxed">
                              {addr.recipient_name} ({addr.phone_number})<br/>
                              {addr.address_line1}, {addr.city}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
