import { getTemplates } from "@/lib/queries/notifications"
import { NotificationsClient } from "./notifications-client"

export default async function NotificationsPage() {
  const data = await getTemplates()
  return <NotificationsClient initialData={data} />
}
