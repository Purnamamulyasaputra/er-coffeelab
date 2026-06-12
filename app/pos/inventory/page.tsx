import { getIngredients } from "@/lib/queries/inventory"
import { InventoryClient } from "@/app/admin/inventory/inventory-client"
export default async function POSInventoryPage() {
  const ingredients = await getIngredients()
  return (
    <div className="p-6">
      <InventoryClient initialData={ingredients} />
    </div>
  )
}


