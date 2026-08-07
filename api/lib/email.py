"""
Email delivery via SMTP (Gmail or any SMTP provider).
Replaces the previous AWS SES implementation.

Required env vars:
  SMTP_HOST      - e.g. smtp.gmail.com
  SMTP_PORT      - e.g. 587
  SMTP_USER      - e.g. yourname@gmail.com
  SMTP_PASSWORD  - Gmail App Password (not your login password)
  SMTP_FROM      - sender address shown in emails (defaults to SMTP_USER)
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from html import escape
from typing import Optional

from api.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM


def _send(to_email: str, subject: str, html_body: str, text_body: str = "") -> None:
    """Send an email via SMTP.

    Always attaches a plain-text part alongside the HTML one, and sets
    Date/Message-ID — an HTML-only message missing these is a well-known
    spam-filter trigger (Microsoft 365/Exchange in particular), and a
    message that SMTP accepts without error can still be silently dropped
    or spam-foldered downstream with zero indication back to this code.
    """
    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid()

    msg.attach(MIMEText(text_body or "This email requires an HTML-capable mail client to view.", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())


def send_invite_email(to_email: str, invite_link: str) -> None:
    """Send a team invite email."""
    subject = "You're invited to 1CloudHub Tracker"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #14171F; padding: 18px 24px; border-radius: 12px 12px 0 0;">
        <span style="color: #fff; font-weight: 700; font-size: 14px;">1CloudHub Tracker</span>
      </div>
      <div style="border: 1px solid #E5E7EC; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 14px; color: #14171F; margin: 0 0 12px;">You've been invited to join 1CloudHub Tracker.</p>
        <p style="font-size: 13px; color: #4B5563; margin: 0 0 20px;">Click the button below to set up your account and start collaborating.</p>
        <a href="{invite_link}" style="display: inline-block; background: #5B5FEF; color: #fff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 8px;">Accept invite</a>
        <p style="font-size: 11px; color: #9CA3AF; margin: 20px 0 0;">If the button doesn't work, copy this link:<br/>{invite_link}</p>
      </div>
    </div>
    """
    text = f"You've been invited to 1CloudHub Tracker.\n\nAccept your invite: {invite_link}"
    _send(to_email, subject, html, text)


# ---- Assignment notification email ----

_TYPE_META = {
    "Story": {"emoji": "📗", "color": "#1E9E6B", "label": "STORY"},
    "Task": {"emoji": "✅", "color": "#3B82F6", "label": "TASK"},
    "Bug": {"emoji": "🐛", "color": "#E5484D", "label": "BUG"},
    "Sub-task": {"emoji": "📎", "color": "#6B7280", "label": "SUB-TASK"},
    "Epic": {"emoji": "🚩", "color": "#8B5CF6", "label": "EPIC"},
}


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
    subject = f"{meta['emoji']} {display_id} assigned to you — {title}"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #14171F; padding: 18px 24px; border-radius: 12px 12px 0 0;">
        <span style="color: #fff; font-weight: 700; font-size: 14px;">1CloudHub Tracker</span>
      </div>
      <div style="border: 1px solid #E5E7EC; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 14px; color: #14171F; margin: 0 0 4px;">Hi {escape(assignee_first_name)},</p>
        <p style="font-size: 13px; color: #4B5563; margin: 0 0 16px;"><strong>{escape(assigned_by_name)}</strong> assigned you a {item_type.lower()}.</p>
        <div style="border: 1px solid #E5E7EC; border-left: 4px solid {meta['color']}; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: #9CA3AF; font-family: monospace;">{meta['emoji']} {meta['label']} · {escape(display_id)}</div>
          <div style="font-size: 14px; font-weight: 600; color: #14171F; margin-top: 8px;">{escape(title)}</div>
          {f'<div style="font-size: 12px; color: #6B7280; margin-top: 4px;">{escape(breadcrumb)}</div>' if breadcrumb else ''}
          {f'<div style="font-size: 12px; color: #9CA3AF; margin-top: 6px;">Due {escape(due_date)}</div>' if due_date else ''}
        </div>
        <a href="{item_url}" style="display: inline-block; background: #5B5FEF; color: #fff; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 8px;">View in Tracker →</a>
      </div>
    </div>
    """

    text_lines = [
        f"Hi {assignee_first_name},",
        "",
        f"{assigned_by_name} assigned you a {item_type.lower()}.",
        "",
        f"{meta['label']} · {display_id}",
        title,
    ]
    if breadcrumb:
        text_lines.append(breadcrumb)
    if due_date:
        text_lines.append(f"Due {due_date}")
    text_lines += ["", f"View in Tracker: {item_url}"]
    text = "\n".join(text_lines)

    _send(to_email, subject, html, text)
