"""
Invite/password-reset email delivery via AWS SES, replacing GoTrue's
built-in email sending now that Supabase Auth is no longer used.

AWS credentials come from the standard boto3 credential chain
(AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars, or an IAM role) —
not something this module handles directly.
"""
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
