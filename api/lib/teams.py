"""
Microsoft Teams notifications via Incoming Webhook.

Setup:
1. In Teams, go to the channel → Manage channel → Connectors → Incoming Webhook
2. Create a webhook, copy the URL
3. Set TEAMS_WEBHOOK_URL in Vercel env vars

The webhook receives Adaptive Card payloads and posts them as messages.
"""
import httpx
from typing import Optional
from api.config import TEAMS_WEBHOOK_URL, FRONTEND_URL


def send_teams_notification(
    assignee_name: str,
    assigned_by: str,
    item_type: str,
    display_id: str,
    title: str,
    priority: Optional[str] = None,
    item_path: Optional[str] = None,
) -> bool:
    """Send a Teams notification when an item is assigned. Returns True on success."""
    if not TEAMS_WEBHOOK_URL:
        return False

    item_url = f"{FRONTEND_URL}{item_path}" if item_path else FRONTEND_URL

    # Color based on item type
    color_map = {
        "Bug": "attention",
        "Task": "accent",
        "Story": "good",
        "Sub-task": "default",
        "Epic": "accent",
    }
    color = color_map.get(item_type, "default")

    # Adaptive Card payload
    card = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "body": [
                        {
                            "type": "TextBlock",
                            "text": f"📋 {item_type} Assigned",
                            "weight": "Bolder",
                            "size": "Medium",
                        },
                        {
                            "type": "FactSet",
                            "facts": [
                                {"title": "ID", "value": display_id},
                                {"title": "Title", "value": title},
                                {"title": "Assigned to", "value": assignee_name},
                                {"title": "Assigned by", "value": assigned_by},
                                *([{"title": "Priority", "value": priority}] if priority else []),
                            ],
                        },
                    ],
                    "actions": [
                        {
                            "type": "Action.OpenUrl",
                            "title": "View in Tracker",
                            "url": item_url,
                        }
                    ],
                },
            }
        ],
    }

    try:
        response = httpx.post(TEAMS_WEBHOOK_URL, json=card, timeout=10)
        return response.status_code in (200, 202)
    except Exception:
        return False
