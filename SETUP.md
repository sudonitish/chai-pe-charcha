# Chai Pe Charcha — Setup Guide

## 1. Google OAuth

1. Go to https://console.cloud.google.com
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/callback/google`
5. Copy Client ID and Client Secret

## 2. Deploy to Vercel

1. Push this repo to GitHub
2. Import in Vercel
3. In Vercel → Storage → Create Database → Postgres (Neon)
4. Set environment variables:
   - `DATABASE_URL` — auto-set by Neon
   - `NEXTAUTH_SECRET` — run: `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel domain e.g. `https://tea.vercel.app`
   - `GOOGLE_CLIENT_ID` — from step 1
   - `GOOGLE_CLIENT_SECRET` — from step 1
   - `ADMIN_PASSWORD` — choose any password

## 3. Run DB migrations

After first deploy, run:
```
npx prisma db push
```
Or connect locally with the DATABASE_URL from Vercel and run it.

## 4. First use

1. Open `/admin` → enter ADMIN_PASSWORD
2. Add flat members by name (no email needed)
3. Each person opens the app, signs in with Google, picks their name
4. Done — debt tracking starts automatically

## Local dev

```bash
cp .env.example .env.local
# fill in .env.local values
npm install
npx prisma db push
npm run dev
```
