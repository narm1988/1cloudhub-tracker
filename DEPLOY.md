# 1CloudHub Tracker — Deployment Guide

Deploy to **Vercel** (frontend + FastAPI backend) with **Supabase** (database + auth + storage).

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed
- [Vercel CLI](https://vercel.com/docs/cli) → `npm i -g vercel`
- A [Supabase](https://supabase.com/) account (free tier works)
- A [GitHub](https://github.com/) repo for the project

---

## Step 1: Set up Supabase (10 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your team, set a database password
3. Once the project is ready, go to **SQL Editor**
4. Copy the contents of `supabase/migrations/001_initial_schema.sql` and run it
5. Go to **Storage** → Create a new bucket called `tracker-files` with **Public** access
6. Go to **Settings → API** and note down:
   - **Project URL** (e.g. `https://abc123.supabase.co`)
   - **anon/public key**
   - **service_role key** (keep this secret!)

### Create your first Admin user

7. Go to **Authentication → Users → Add User**
8. Enter your email and password, click "Create user"
9. Then in the **SQL Editor**, run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', full_name = 'Your Name'
   WHERE email = 'your@email.com';
   ```

---

## Step 2: Push to GitHub (2 min)

```bash
cd d:\1CH_Tracker
git init
git add .
git commit -m "Initial commit - 1CloudHub Tracker"
git remote add origin https://github.com/YOUR_ORG/1cloudhub-tracker.git
git push -u origin main
```

---

## Step 3: Deploy to Vercel (5 min)

### Option A: Via Vercel Dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Vite — settings should show:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:

   | Variable                    | Value                          |
   | --------------------------- | ------------------------------ |
   | `VITE_SUPABASE_URL`        | `https://your-project.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY`   | your anon key                  |
   | `SUPABASE_URL`             | `https://your-project.supabase.co` |
   | `SUPABASE_ANON_KEY`        | your anon key                  |
   | `SUPABASE_SERVICE_ROLE_KEY`| your service role key          |

5. Click **Deploy**

### Option B: Via CLI

```bash
vercel login
vercel --prod
```

When prompted, link to your project and provide the same environment variables.

---

## Step 4: Configure Supabase Auth URL (2 min)

1. In Supabase Dashboard → **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel deployment URL (e.g. `https://1cloudhub-tracker.vercel.app`)
3. Add it to **Redirect URLs** as well: `https://1cloudhub-tracker.vercel.app/**`

---

## Step 5: Test the Deployment

1. Open your Vercel URL
2. Sign in with the admin email/password you created in Step 1
3. Create your first epic and user story
4. Invite teammates via the People page

---

## Local Development

```bash
# Frontend
npm install
npm run dev          # http://localhost:5173

# Backend (optional, for local API testing)
cd api
pip install -r requirements.txt
uvicorn index:app --reload --port 8000
```

Create a `.env` file from `.env.example` with your Supabase keys.

---

## Project Structure

```
1CH_Tracker/
├── api/                    # FastAPI backend (Vercel serverless)
│   ├── index.py            # App entry point
│   ├── config.py           # Environment config
│   ├── deps.py             # Auth & Supabase dependencies
│   ├── requirements.txt    # Python dependencies
│   └── routes/
│       ├── auth.py         # Invite, signup, profile
│       ├── epics.py        # CRUD epics
│       ├── stories.py      # CRUD stories/tasks
│       ├── comments.py     # Story comments
│       ├── attachments.py  # File uploads
│       └── people.py       # Team management
├── src/                    # React frontend
│   ├── components/         # UI + dashboard components
│   ├── context/            # Auth context (Supabase)
│   ├── layouts/            # Dashboard layout
│   ├── lib/                # Supabase client, constants
│   ├── pages/              # Login, Epics, People, Settings
│   └── types/              # TypeScript interfaces
├── supabase/
│   └── migrations/         # SQL schema
├── vercel.json             # Vercel routing config
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Inviting Team Members

1. Sign in as an Admin
2. Go to **People** page
3. Click **Invite person** → enter their email and role
4. They'll receive an email invite to create their account
5. Once they sign in, they can be assigned to epics and stories

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails | Verify Supabase URL and anon key in Vercel env vars |
| API returns 401 | Check `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel |
| Invite not sending | Ensure Supabase SMTP is configured (Settings → Auth → SMTP) |
| File upload fails | Verify "tracker-files" storage bucket exists and is public |
| Page 404 on refresh | The `vercel.json` rewrites handle SPA routing — redeploy if missing |

---

## Timeline Summary

| Step | Time |
|------|------|
| Supabase setup + schema | ~10 min |
| Push to GitHub | ~2 min |
| Deploy to Vercel | ~5 min |
| Configure auth URL | ~2 min |
| **Total** | **~20 min** |

You should be live within 20 minutes. Good luck!
