import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://cuwqcmhhyhldauifhdrf.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_6vgvsv2BFacuw3-oEvsKMw_-SZhhWbW")

# ==============================================
# JWT signing — must match the asymmetric key pair registered as this
# project's JWT Signing Key in Supabase Dashboard → Authentication → JWT
# Keys, so tokens minted here are trusted by PostgREST/RLS exactly like
# tokens GoTrue would have issued.
# ==============================================
JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY", "")  # PEM, RS256 private key
JWT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY", "")  # PEM, RS256 public key

# Vercel stores multiline env vars with literal "\n" — convert to real newlines
if JWT_PRIVATE_KEY:
    JWT_PRIVATE_KEY = JWT_PRIVATE_KEY.replace("\\n", "\n")
if JWT_PUBLIC_KEY:
    JWT_PUBLIC_KEY = JWT_PUBLIC_KEY.replace("\\n", "\n")

# Fall back to reading PEM files from disk if env vars are empty (local dev)
if not JWT_PRIVATE_KEY:
    _pk_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "private.pem")
    if os.path.isfile(_pk_path):
        with open(_pk_path) as f:
            JWT_PRIVATE_KEY = f.read()

if not JWT_PUBLIC_KEY:
    _pub_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public.pem")
    if os.path.isfile(_pub_path):
        with open(_pub_path) as f:
            JWT_PUBLIC_KEY = f.read()
JWT_KID = os.getenv("JWT_KID", "")  # must match the key id shown in the Dashboard
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
# AWS SES — invite / password-reset email delivery
# ==============================================
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
SES_SENDER_EMAIL = os.getenv("SES_SENDER_EMAIL", "")
