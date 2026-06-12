import { sql } from "@/lib/db"

export async function getTemplates() {
  return await sql`
    SELECT 
      id,
      event_trigger as type,
      event_trigger as name,
      message_content as body_template,
      message_content as title_template,
      is_active as active
    FROM notification_templates
    ORDER BY id DESC
  `
}

export async function createTemplate(data: any) {
  return await sql`
    INSERT INTO notification_templates (event_trigger, channel, message_content, is_active)
    VALUES (
      ${data.event_trigger || data.type},
      ${data.channel || 'PUSH'},
      ${data.message_content || data.body_template},
      ${data.is_active !== undefined ? data.is_active : (data.active !== undefined ? data.active : true)}
    )
    RETURNING *
  `
}

export async function updateTemplate(id: number, data: any) {
  return await sql`
    UPDATE notification_templates
    SET 
      event_trigger = ${data.event_trigger || data.type},
      channel = ${data.channel || 'PUSH'},
      message_content = ${data.message_content || data.body_template},
      is_active = ${data.is_active !== undefined ? data.is_active : (data.active !== undefined ? data.active : true)}
    WHERE id = ${id}
    RETURNING *
  `
}

export async function deleteTemplate(id: number) {
  return await sql`DELETE FROM notification_templates WHERE id = ${id} RETURNING *`
}

export async function sendPushNotification(data: any) {
  // Map our UI broadcast data to notification_logs schema
  return await sql`
    INSERT INTO notification_logs (recipient, channel, request_payload, status, created_at)
    VALUES (
      ${data.audience || 'ALL'},
      'PUSH',
      ${JSON.stringify({ title: data.title, body: data.body })},
      'SENT',
      NOW()
    )
    RETURNING *
  `
}
