import { getProducts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"
import { ProductsClient } from "./products-client"
import { requireAdmin } from "@/lib/auth"

export default async function ProductsPage() {
  const session = await requireAdmin()
  const branchId = session.resolvedBranchId || undefined
  
  const [products, categories] = await Promise.all([
    getProducts(branchId),
    getCategories()
  ])
  
  return <ProductsClient initialData={products} categories={categories} />
}
