# ProctorGuard SaaS - Cloud Deployment & GitHub Setup Guide

This comprehensive guide walks you through hosting the complete ProctorGuard SaaS platform on your **GitHub account** and connecting it to a **free cloud hosting platform** (Vercel or Render) with a **free PostgreSQL database** (Neon, Supabase, or Render Postgres) so it can be accessed from any device anywhere in the world.

---

## Part 1: Push Codebase to Your GitHub Account

### Step 1: Create a New GitHub Repository
1. Log in to your [GitHub Account](https://github.com).
2. Click the **`+`** icon in the upper right corner and select **New repository**.
3. Name your repository (e.g., `proctorguard-saas` or `cbt-proctor-saas`).
4. Set visibility to **Public** or **Private** (both work with Vercel and Render).
5. **Do NOT** initialize with a README, .gitignore, or license (these already exist locally).
6. Click **Create repository**.
7. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/proctorguard-saas.git`).

### Step 2: Push Your Local Repository to GitHub
Open your terminal inside the project directory:
```bash
cd "C:\Users\HP 8770W\.gemini\antigravity\scratch\proctorguard-saas"
```

Verify git status and stage all files:
```bash
git add .
git commit -m "feat: complete ProctorGuard SaaS with AI vision proctoring, blinking timer alerts, paywall tiers, and free deployment configs"
```

Link your GitHub remote and push (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repository name):
```bash
git remote add origin https://github.com/YOUR_USERNAME/proctorguard-saas.git
git branch -M master
git push -u origin master
```
*(If GitHub prompts for authentication, log in using your GitHub Personal Access Token or GitHub Desktop / CLI).*

---

## Part 2: Free Hosting Deployment Options

### Option A: Deploy to Vercel (Recommended - Fastest & Zero Config)

Vercel is the creator of Next.js and provides the fastest, zero-downtime serverless hosting for Next.js with automatic global CDN and SSL certificates.

#### Step 1: Set Up Free Cloud PostgreSQL
Next.js serverless functions require a cloud PostgreSQL database. You can create one for free in 60 seconds with **Neon** or **Supabase**:

1. Go to [Neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project**, name it `proctorguard-db`, and choose your nearest region.
3. Neon will display your connection string:
   ```
   postgresql://alex:AbCdEf123456@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy this connection string.

#### Step 2: Connect GitHub Repo to Vercel
1. Go to [Vercel.com](https://vercel.com) and sign up / log in with your **GitHub account**.
2. Click **Add New...** > **Project**.
3. Under "Import Git Repository", find your `proctorguard-saas` repository and click **Import**.
4. Configure the Project:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npx prisma generate && next build` (configured in `vercel.json`)
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://...sslmode=require` | Your Neon/Supabase PostgreSQL connection string |
   | `JWT_SECRET` | `4f9b2a7d8e1c6b3f0a5e8d9c2b1a4f7e6d5c3b2a1f0e9d8c7b6a5f4e3d2c1b0a` | Random 64-char string for HMAC token signing |
   | `NODE_ENV` | `production` | Production mode |
6. Click **Deploy**.
7. In ~60-90 seconds, Vercel will complete the build and assign you a live HTTPS URL (e.g. `https://proctorguard-saas.vercel.app`).

#### Step 3: Run Database Migrations & Seed Data
From your local machine or via GitHub Actions, push the database schema to your cloud PostgreSQL database:
```bash
# Set your DATABASE_URL in your terminal or .env
DATABASE_URL="your-neon-or-supabase-connection-string" npx prisma db push

# Optional: Seed initial demo courses, exams, and accounts
DATABASE_URL="your-neon-or-supabase-connection-string" node scripts/seed-db.js
```

---

### Option B: Deploy to Render.com (1-Click Blueprint with Free DB)

Render provides free Node.js web services and free managed PostgreSQL databases in the same region.

1. Push this codebase to GitHub (as done in Part 1).
2. Go to [Render.com](https://render.com) and log in with GitHub.
3. Click **New +** > **Blueprint**.
4. Connect your `proctorguard-saas` GitHub repository.
5. Render will automatically read the bundled `render.yaml` file:
   - Creates a free PostgreSQL database (`proctorguard-db`).
   - Creates a free Node.js web service (`proctorguard-saas`).
   - Auto-wires the `DATABASE_URL` and `JWT_SECRET`.
6. Click **Apply**.
7. Render provisions the database, runs `npm install`, `npx prisma generate`, and `npm run build`, and launches the app at `https://proctorguard-saas.onrender.com`.

---

## Part 3: Verify Your Live Platform

Once deployed, visit your live URL:
1. **Student Candidate Portal**:
   - Access `https://YOUR-APP.vercel.app/exam/LAW301-2026`
   - Enter Registration Number (e.g. `2026/LAW/0842`) and Candidate Full Name.
   - Test the **Dynamic Blinking Timer** (red pulse + sound warning at $\le 5$ min).
   - Test **AI Proctoring Intelligence** (gaze tracking reticle, looking-away alert banner).
2. **Faculty / Instructor Dashboard**:
   - Log in at `https://YOUR-APP.vercel.app/auth/login` with:
     - Email: `instructor@unilag.edu.ng`
     - Password: `Password123!`
   - Navigate to **Billing & Plans** (`/instructor/billing`) to view the upgraded paywall tiers:
     - **Member / Starter**: 200 Candidates, 5 Tests/Month.
     - **Pro**: 500 Candidates, 10 Tests/Month + AI Vision Proctoring.
     - **Premium**: 1,000 Candidates, Unlimited Tests/Month.
   - Test the interactive checkout modal with Paystack / Card simulation and instant receipt generation.
3. **Super Admin Platform Governance**:
   - Log in with `admin@proctorguard.ng` / `AdminMaster2026!`.
   - Inspect cross-tenant analytics, audit logs, and instructor subscriptions.
