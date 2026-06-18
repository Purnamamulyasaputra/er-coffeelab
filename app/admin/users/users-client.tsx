"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  branch: string;
  branch_ids?: number[];
}

export function UsersClient({ initialData, initialBranches }: { initialData: User[], initialBranches: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = React.useState<User[]>(initialData)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "SUPERADMIN",
    status: "ACTIVE",
    branchIds: [] as number[]
  })

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({ name: "", email: "", password: "", role: "SUPERADMIN", status: "ACTIVE", branchIds: [] })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setEditingId(user.id)
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // empty password means don't change
      role: user.role,
      status: user.status,
      branchIds: (typeof user.branch_ids === 'string' ? JSON.parse(user.branch_ids || '[]') : user.branch_ids) || []
    })
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${deleteConfirmId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete user")

      setData(data.filter(u => u.id !== deleteConfirmId))
      toast("User deleted successfully", "success")
      setDeleteConfirmId(null)
      router.refresh()
    } catch (err: unknown) {
      toast("Error deleting user", "error")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users'
      const method = editingId ? 'PUT' : 'POST'

      // Use a temporary payload to avoid typescript complaints on delete
      const payload: Record<string, any> = { ...formData }
      if (editingId && !payload.password) {
        delete payload.password // Don't send empty password on update
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to save")

      // Generate frontend display string for branches
      let branchNames = "All"
      if (formData.role === 'STORE_ADMIN') {
        const selectedBranches = initialBranches.filter(b => formData.branchIds.includes(b.id))
        branchNames = selectedBranches.length > 0 ? selectedBranches.map(b => b.name.replace('ER Coffeelab ', '')).join(', ') : 'None'
      }

      if (editingId) {
        setData(data.map(u => u.id === editingId ? { ...u, ...result.data, branch: branchNames, branch_ids: formData.branchIds } : u))
        toast("User updated successfully", "success")
      } else {
        setData([{ ...result.data, branch: branchNames, branch_ids: formData.branchIds }, ...data])
        toast("User created successfully", "success")
      }

      setIsModalOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      toast(error.message || "Error saving user", "error")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBranch = (branchId: number) => {
    setFormData(prev => {
      const newIds = prev.branchIds.includes(branchId)
        ? prev.branchIds.filter(id => id !== branchId)
        : [...prev.branchIds, branchId];
      return { ...prev, branchIds: newIds }
    })
  }

  const columns = [
    { header: "Name", accessorKey: "name" as const },
    { header: "Email", accessorKey: "email" as const },
    {
      header: "Role",
      cell: (item: User) => {
        const isSuper = item.role === 'SUPERADMIN'
        return (
          <Badge variant={isSuper ? "cool" : "success"}>
            {isSuper ? 'SUPER' : 'STORE'}
          </Badge>
        )
      }
    },
    { header: "Branches", accessorKey: "branch" as const },
    {
      header: "Status",
      cell: (item: User) => {
        const isActive = item.status === "ACTIVE"
        return (
          <Badge variant={isActive ? "success" : "destructive"}>
            {isActive ? 'ON' : 'OFF'}
          </Badge>
        )
      }
    },
    {
      header: "Actions",
      cell: (item: User) => (
        <div className="flex gap-1">
          <Button size="icon" onClick={() => handleOpenEdit(item)} className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" onClick={() => setDeleteConfirmId(item.id)} className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Dashboard access and role administration"
        action={<Button onClick={handleOpenAdd} className="gap-2"><Plus size={14} /> Add User</Button>}
      />
      <DataTable data={data} columns={columns} keyExtractor={item => item.id} />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card rounded-[14px] w-full max-w-[420px] overflow-hidden flex flex-col shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 pt-5 pb-2">
              <h2 className="text-[17px] font-bold text-foreground">{editingId ? 'Edit User' : 'Add Users'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] placeholder:text-muted-foreground/50"
                  placeholder="Name"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] placeholder:text-muted-foreground/50"
                  placeholder="Email"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Password {editingId && <span className="text-muted-foreground text-[10px] font-normal">(Leave blank to keep current)</span>}</label>
                <input
                  required={!editingId}
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] placeholder:text-muted-foreground/50"
                  placeholder="Password"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value, branchIds: e.target.value === 'SUPERADMIN' ? [] : formData.branchIds })}
                  className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="SUPERADMIN">SUPERADMIN</option>
                  <option value="STORE_ADMIN">STORE ADMIN</option>
                </select>
              </div>

              {formData.role === 'STORE_ADMIN' && (
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Assign Branch</label>
                  <select
                    required
                    value={formData.branchIds[0] || ""}
                    onChange={e => setFormData({ ...formData, branchIds: [Number(e.target.value)] })}
                    className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="" disabled>Select a branch</option>
                    {initialBranches.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name.replace('ER Coffeelab ', '')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                  className={`w-10 h-[22px] rounded-full transition-colors relative ${formData.status === 'ACTIVE' ? 'bg-[#22c55e]' : 'bg-muted border border-border'}`}
                >
                  <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all ${formData.status === 'ACTIVE' ? 'left-5' : 'left-[3px] bg-[#8b8fa8]'}`} />
                </button>
                <span className="text-[13px] font-medium text-foreground">Active</span>
              </div>

              <div className="flex justify-end gap-2.5 mt-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="bg-muted text-foreground hover:bg-muted/80 hover:text-foreground px-5 py-2 h-auto rounded-lg text-[12px] font-semibold border border-border">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-primary text-white hover:bg-primary/80 px-5 py-2 h-auto rounded-lg text-[12px] font-semibold">
                  {loading ? 'Saving...' : '✓ Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        type="danger"
        title="Delete User"
        message="Are you sure you want to delete this user?"
        confirmText={loading ? 'Deleting...' : 'Delete'}
      />
    </div>
  )
}
