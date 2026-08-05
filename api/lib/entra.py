"""
Microsoft Entra ID (Azure AD) SSO via MSAL — the authorization-code flow
now lives entirely in this backend; Supabase Auth is no longer in the loop.
"""
import msal

from api.config import ENTRA_AUTHORITY, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, ENTRA_REDIRECT_URI

# openid/profile/email get the standard claims (name, preferred_username);
# the "groups" claim itself comes from the Entra app registration's Token
# Configuration (added there, not requested as a scope here).
_SCOPES = ["User.Read"]


def _app() -> msal.ConfidentialClientApplication:
    return msal.ConfidentialClientApplication(
        ENTRA_CLIENT_ID,
        authority=ENTRA_AUTHORITY,
        client_credential=ENTRA_CLIENT_SECRET,
    )


def get_auth_url(state: str) -> str:
    return _app().get_authorization_request_url(
        _SCOPES,
        redirect_uri=ENTRA_REDIRECT_URI,
        state=state,
    )


def acquire_token(code: str) -> dict:
    """Exchanges an authorization code for tokens. Raises ValueError on failure.

    The returned dict's "id_token_claims" key is where MSAL surfaces the
    parsed ID token — email/name/groups all come from there.
    """
    result = _app().acquire_token_by_authorization_code(
        code,
        scopes=_SCOPES,
        redirect_uri=ENTRA_REDIRECT_URI,
    )
    if "error" in result:
        raise ValueError(result.get("error_description", result["error"]))
    return result
