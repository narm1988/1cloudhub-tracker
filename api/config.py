import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://cuwqcmhhyhldauifhdrf.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_6vgvsv2BFacuw3-oEvsKMw_-SZhhWbW")

# ==============================================
# JWT signing — uses the HS256 JWT secret from Supabase Dashboard →
# Settings → API → JWT Settings (or the legacy secret shown under
# JWT Keys → Legacy JWT Secret tab). Tokens minted with this secret
# are trusted by PostgREST/RLS exactly like GoTrue-issued tokens.
# ==============================================
JWT_SECRET = os.getenv("JWT_SECRET", "")  # Supabase JWT secret (HS256)
JWT_ISSUER = os.getenv("JWT_ISSUER", f"{SUPABASE_URL}/auth/v1")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "authenticated")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# ==============================================
# Microsoft Entra ID (Azure AD) SSO
# ==============================================
ENTRA_TENANT_ID = os.getenv("ENTRA_TENANT_ID", "")
ENTRA_CLIENT_ID = os.getenv("ENTRA_CLIENT_ID", "")
ENTRA_CLIENT_SECRET = os.getenv("ENTRA_CLIENT_SECRET", "")
ENTRA_REDIRECT_URI = os.getenv("ENTRA_REDIRECT_URI", "")  # {API_URL}/api/auth/entra/callback
ENTRA_ADMIN_GROUP_ID = os.getenv("ENTRA_ADMIN_GROUP_ID", "")  # Object ID of the admin security group
ENTRA_AUTHORITY = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}"

FRONTEND_URL = os.getenv("FRONTEND_URL", "")

# ==============================================
# Email — SMTP (Gmail or any provider)
# ==============================================
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")  # Gmail: use App Password, not login password
SMTP_FROM = os.getenv("SMTP_FROM", "") or SMTP_USER  # defaults to SMTP_USER if not set

# ==============================================
# Microsoft Teams — Incoming Webhook for notifications
# ==============================================
TEAMS_WEBHOOK_URL = os.getenv("TEAMS_WEBHOOK_URL", "")  # Teams channel webhook URL
