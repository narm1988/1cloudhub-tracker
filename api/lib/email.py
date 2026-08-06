"""
Invite / assignment-notification email delivery via AWS SES, replacing
GoTrue's built-in email sending and the send-assignment-email Supabase
Edge Function now that Supabase Auth/Functions are no longer used.

AWS credentials come from the standard boto3 credential chain
(AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars, or an IAM role) —
not something this module handles directly.
"""
from html import escape
from typing import Optional

import boto3

from api.config import AWS_REGION, SES_SENDER_EMAIL


def send_invite_email(to_email: str, invite_link: str) -> None:
    client = boto3.client("ses", region_name=AWS_REGION)
    client.send_email(
        Source=SES_SENDER_EMAIL,
        Destination={"ToAddresses": [to_email]},
        Message={
            "Subject": {"Data": "You're invited to 1CloudHub Tracker"},
            "Body": {
                "Html": {
                    "Data": (
                        "<p>You've been invited to 1CloudHub Tracker.</p>"
                        f'<p><a href="{invite_link}">Accept your invite</a></p>'
                    )
                },
                "Text": {"Data": f"You've been invited to 1CloudHub Tracker.\n\n{invite_link}"},
            },
        },
    )


# Ported 1:1 from supabase/functions/send-assignment-email/index.ts —
# same visual template, same emoji/color-by-type mapping.
_TYPE_META = {
    "Story": {"emoji": "📗", "color": "#1E9E6B", "label": "STORY"},
    "Task": {"emoji": "✅", "color": "#3B82F6", "label": "TASK"},
    "Bug": {"emoji": "🐛", "color": "#E5484D", "label": "BUG"},
    "Sub-task": {"emoji": "📎", "color": "#6B7280", "label": "SUB-TASK"},
    "Epic": {"emoji": "🚩", "color": "#8B5CF6", "label": "EPIC"},
}
_PRIORITY_EMOJI = {"Critical": "🔴", "High": "🟠", "Medium": "🟡", "Low": "🟢"}


def _build_assignment_email_html(
    assignee_first_name: str,
    assigned_by_name: str,
    item_type: str,
    display_id: str,
    title: str,
    item_url: str,
    breadcrumb: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
) -> str:
    meta = _TYPE_META.get(item_type, _TYPE_META["Task"])
    priority_cell = (
        f'<td align="right" style="font-size:12px;font-family:Arial,Helvetica,sans-serif;color:#374151;font-weight:600;">'
        f'{_PRIORITY_EMOJI.get(priority, "")} {escape(priority)}</td>'
        if priority else "<td></td>"
    )
    due_row = (
        f'<div style="font-size:12px;color:#9CA0AE;margin-top:8px;font-family:Arial,Helvetica,sans-serif;">Due {escape(due_date)}</div>'
        if due_date else ""
    )
    breadcrumb_row = (
        f'<div style="font-size:12px;color:#6B7280;font-family:Arial,Helvetica,sans-serif;">{escape(breadcrumb)}</div>'
        if breadcrumb else ""
    )
    verb = "assigned you an epic as owner" if item_type == "Epic" else f"assigned you a {item_type.lower()}"

    return f"""
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
    <p style="margin:0 0 4px;font-size:13.5px;color:#14171F;font-family:Arial,Helvetica,sans-serif;">Hi {escape(assignee_first_name)},</p>
    <p style="margin:0 0 18px;font-size:13.5px;color:#4B5563;line-height:1.6;font-family:Arial,Helvetica,sans-serif;"><strong>{escape(assigned_by_name)}</strong> {verb}.</p>
  </td></tr>
  <tr><td style="padding:0 24px 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EC;border-radius:10px;border-left:4px solid {meta['color']};">
      <tr><td style="padding:15px 17px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:10.5px;font-family:Consolas,monospace;color:#9CA0AE;">{meta['emoji']} {meta['label']} · {escape(display_id)}</td>
          {priority_cell}
        </tr></table>
        <div style="height:1px;margin:9px 0;background:repeating-linear-gradient(90deg,#E6E7EB 0,#E6E7EB 3px,transparent 3px,transparent 7px);"></div>
        <div style="font-size:14.5px;font-weight:600;color:#14171F;margin-bottom:6px;font-family:Arial,Helvetica,sans-serif;">{escape(title)}</div>
        {breadcrumb_row}
        {due_row}
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 24px 24px;">
    <a href="{item_url}" style="display:block;text-align:center;background:#5B5FEF;color:#ffffff;text-decoration:none;font-weight:700;font-size:13.5px;padding:11px 0;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">View in Tracker →</a>
  </td></tr>
  <tr><td style="padding:14px 24px;background:#F9FAFB;border-top:1px solid #EEF0F2;">
    <p style="margin:0;font-size:10.5px;color:#9CA0AE;text-align:center;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">You're receiving this because you were assigned to this item in 1CloudHub Tracker.</p>
  </td></tr>
</table>
</td></tr></table>"""


def send_assignment_email(
    to_email: str,
    assignee_first_name: str,
    assigned_by_name: str,
    item_type: str,
    display_id: str,
    title: str,
    item_url: str,
    breadcrumb: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
) -> None:
    meta = _TYPE_META.get(item_type, _TYPE_META["Task"])
    html = _build_assignment_email_html(
        assignee_first_name, assigned_by_name, item_type, display_id, title, item_url,
        breadcrumb, priority, due_date,
    )
    client = boto3.client("ses", region_name=AWS_REGION)
    client.send_email(
        Source=SES_SENDER_EMAIL,
        Destination={"ToAddresses": [to_email]},
        Message={
            "Subject": {"Data": f"{meta['emoji']} {display_id} assigned to you — {title}"},
            "Body": {"Html": {"Data": html}},
        },
    )
