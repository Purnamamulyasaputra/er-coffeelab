import { getStaticPages, getMerchandise } from "@/lib/queries/content"
import { ContentClient } from "./content-client"

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const [staticPages, merchandise] = await Promise.all([
    getStaticPages(),
    getMerchandise()
  ])

  return <ContentClient initialStaticPages={staticPages as any[]} initialMerchandise={merchandise as any[]} />
}
