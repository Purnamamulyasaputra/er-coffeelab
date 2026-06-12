import { getBanners } from "@/lib/queries/banners"
import { BannersClient } from "./banners-client"

export default async function BannersPage() {
  const data = await getBanners()
  return <BannersClient initialData={data} />
}
