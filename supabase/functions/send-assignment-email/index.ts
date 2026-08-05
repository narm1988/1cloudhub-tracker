// Sends the "you've been assigned" email via Amazon SES. Triggered directly
// by the frontend right after an assignee_id change is saved — no database
// trigger/webhook involved, so this stays swappable if the app ever moves
// off Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const TYPE_META: Record<string, { emoji: string; color: string; label: string }> = {
  Story: { emoji: '📗', color: '#1E9E6B', label: 'STORY' },
  Task: { emoji: '✅', color: '#3B82F6', label: 'TASK' },
  Bug: { emoji: '🐛', color: '#E5484D', label: 'BUG' },
  'Sub-task': { emoji: '📎', color: '#6B7280', label: 'SUB-TASK' },
  Epic: { emoji: '🚩', color: '#8B5CF6', label: 'EPIC' },
}

const PRIORITY_EMOJI: Record<string, string> = {
  Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢',
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function buildEmailHtml(p: {
  assigneeFirstName: string
  assignedByName: string
  itemType: string
  displayId: string
  title: string
  breadcrumb?: string
  priority?: string
  dueDate?: string
  itemUrl: string
}) {
  const meta = TYPE_META[p.itemType] || TYPE_META.Task
  const priorityRow = p.priority
    ? `<td align="right" style="font-size:12px;font-family:Arial,Helvetica,sans-serif;color:#374151;font-weight:600;">${PRIORITY_EMOJI[p.priority] || ''} ${escapeHtml(p.priority)}</td>`
    : `<td></td>`
  const dueRow = p.dueDate
    ? `<div style="font-size:12px;color:#9CA0AE;margin-top:8px;font-family:Arial,Helvetica,sans-serif;">Due ${escapeHtml(p.dueDate)}</div>`
    : ''
  const verb = p.itemType === 'Epic' ? 'assigned you an epic as owner' : `assigned you a ${p.itemType.toLowerCase()}`

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6F8;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;margin:0;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EC;">
  <tr><td style="background:#14171F;padding:18px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="width:26px;height:26px;background:#5B5FEF;border-radius:7px;text-align:center;vertical-align:middle;font-size:13px;">☁️</td>
      <td style="padding-left:9px;">
        <div style="font-weight:700;font-size:14px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">1CloudHub</div>
        <div style="font-size:8.5px;letter-spacing:.14em;color:#9195A8;font-family:Arial,Helvetica,sans-serif;">TRACKER</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:24px 24px 6px;">
    <p style="margin:0 0 4px;font-size:13.5px;color:#14171F;font-family:Arial,Helvetica,sans-serif;">Hi ${escapeHtml(p.assigneeFirstName)},</p>
    <p style="margin:0 0 18px;font-size:13.5px;color:#4B5563;line-height:1.6;font-family:Arial,Helvetica,sans-serif;"><strong>${escapeHtml(p.assignedByName)}</strong> ${verb}.</p>
  </td></tr>
  <tr><td style="padding:0 24px 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EC;border-radius:10px;border-left:4px solid ${meta.color};">
      <tr><td style="padding:15px 17px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:10.5px;font-family:Consolas,monospace;color:#9CA0AE;">${meta.emoji} ${meta.label} · ${escapeHtml(p.displayId)}</td>
          ${priorityRow}
        </tr></table>
        <div style="height:1px;margin:9px 0;background:repeating-linear-gradient(90deg,#E6E7EB 0,#E6E7EB 3px,transparent 3px,transparent 7px);"></div>
        <div style="font-size:14.5px;font-weight:600;color:#14171F;margin-bottom:6px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(p.title)}</div>
        ${p.breadcrumb ? `<div style="font-size:12px;color:#6B7280;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(p.breadcrumb)}</div>` : ''}
        ${dueRow}
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 24px 24px;">
    <a href="${p.itemUrl}" style="display:block;text-align:center;background:#5B5FEF;color:#ffffff;text-decoration:none;font-weight:700;font-size:13.5px;padding:11px 0;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">View in Tracker →</a>
  </td></tr>
  <tr><td style="padding:14px 24px;background:#F9FAFB;border-top:1px solid #EEF0F2;">
    <p style="margin:0;font-size:10.5px;color:#9CA0AE;text-align:center;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">You're receiving this because you were assigned to this item in 1CloudHub Tracker.</p>
  </td></tr>
</table>
</td></tr></table>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { assigneeId, itemType, displayId, title, breadcrumb, priority, dueDate, itemPath, appUrl } = await req.json()

    if (!assigneeId || !itemType || !displayId || !title || !itemPath || !appUrl) {
      return json({ error: 'Missing required fields.' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing authorization.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller) {
      return json({ error: 'Not authenticated.' }, 401)
    }

    // Never trust a client-supplied email/name — look both sides up server-side.
    const [{ data: assignee }, { data: assigner }] = await Promise.all([
      callerClient.from('profiles').select('email, full_name').eq('id', assigneeId).single(),
      callerClient.from('profiles').select('full_name').eq('id', caller.id).single(),
    ])

    if (!assignee?.email) {
      return json({ error: 'Assignee not found.' }, 404)
    }

    // Assigning to yourself doesn't need an email.
    if (assigneeId === caller.id) {
      return json({ success: true, skipped: 'self-assignment' }, 200)
    }

    const fromEmail = Deno.env.get('SES_FROM_EMAIL')!
    const region = Deno.env.get('AWS_REGION')!
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')!
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')!

    const meta = TYPE_META[itemType] || TYPE_META.Task
    const html = buildEmailHtml({
      assigneeFirstName: (assignee.full_name || 'there').split(' ')[0],
      assignedByName: assigner?.full_name || 'Someone',
      itemType,
      displayId,
      title,
      breadcrumb,
      priority,
      dueDate,
      itemUrl: `${appUrl}${itemPath}`,
    })

    const ses = new SESv2Client({ region, credentials: { accessKeyId, secretAccessKey } })

    await ses.send(new SendEmailCommand({
      FromEmailAddress: fromEmail,
      Destination: { ToAddresses: [assignee.email] },
      Content: {
        Simple: {
          Subject: { Data: `${meta.emoji} ${displayId} assigned to you — ${title}` },
          Body: { Html: { Data: html } },
        },
      },
    }))

    return json({ success: true }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, 500)
  }
})
