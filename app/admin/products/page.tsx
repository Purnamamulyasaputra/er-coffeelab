import { getProducts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"
import { ProductsClient } from "./products-client"

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ])
  
  return <ProductsClient initialData={products} categories={categories} />
}
