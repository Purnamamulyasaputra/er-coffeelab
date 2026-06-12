import { getIngredients } from "@/lib/queries/inventory"
import { InventoryClient } from "./inventory-client"

export default async function InventoryPage() {
  const ingredients = await getIngredients()
  
  return <InventoryClient initialData={ingredients} />
}
