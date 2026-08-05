import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# ==============================================
# JWT signing — must match the asymmetric key pair registered as this
# project's JWT Signing Key in Supabase Dashboard → Authentication → JWT
# Keys, so tokens minted here are trusted by PostgREST/RLS exactly like
# tokens GoTrue would have issued.
# ==============================================
JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY", "")  # PEM, RS256 private key
JWT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY", "")  # PEM, RS256 public key
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

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ==============================================
# AWS SES — invite / password-reset email delivery
# ==============================================
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
SES_SENDER_EMAIL = os.getenv("SES_SENDER_EMAIL", "")
