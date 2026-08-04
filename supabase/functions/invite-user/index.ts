// Sends a real Supabase Auth invite email, restricted to @1cloudhub.com addresses.
// Must run with the service-role key (never expose that key to the browser),
// so this logic lives in an Edge Function instead of the client.
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_DOMAIN = '1cloudhub.com'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, redirectTo } = await req.json()

    if (!email || typeof email !== 'string') {
      return json({ error: 'Email is required.' }, 400)
    }
    if (role !== 'admin' && role !== 'member') {
      return json({ error: 'Invalid role.' }, 400)
    }

    const normalizedEmail = email.trim().toLowerCase()
    const domain = normalizedEmail.split('@')[1]
    if (domain !== ALLOWED_DOMAIN) {
      return json({ error: `Invites are only allowed for @${ALLOWED_DOMAIN} email addresses.` }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing authorization.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Scoped to the caller's own JWT — used only to verify who is asking.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !caller) {
      return json({ error: 'Not authenticated.' }, 401)
    }

    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profileError || callerProfile?.role !== 'admin') {
      return json({ error: 'Only admins can invite people.' }, 403)
    }

    // Service-role client — the only place allowed to actually create + email the invite.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: { role, invited_by: caller.id },
        redirectTo: typeof redirectTo === 'string' ? redirectTo : undefined,
      }
    )

    if (inviteError) {
      return json({ error: inviteError.message }, 400)
    }

    await adminClient.from('invites').insert({
      email: normalizedEmail,
      role,
      invited_by: caller.id,
      accepted: false,
    })

    return json({ success: true, userId: inviteData.user?.id }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, 500)
  }
})
