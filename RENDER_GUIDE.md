# 🚀 Professional Hosting Guide (Render + Supabase + Cloudinary)

This guide will show you how to launch your cinematic portfolio on **Render** with a permanent database and cloud image storage.

---

## Step 1: Create Your Free Accounts
1. **[Supabase](https://supabase.com)**: For your Database ("Always Free" tier).
2. **[Cloudinary](https://cloudinary.com)**: For your Image Storage (Generous Free tier).
3. **[GitHub](https://github.com)**: To host your code privately/publicly for Render to pull from.

---

## Step 2: Get Your API Keys

### 1. From Supabase
- Create a new project.
- Go to **Project Settings** > **Database**.
- Copy the **Connection String** (use the "URI" version).
  - *It looks like: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`*

### 2. From Cloudinary
- Go to your **Dashboard**.
- Copy your **Cloud Name**, **API Key**, and **API Secret**.

---

## Step 3: Create Web Service on Render
1. [Sign in to Render](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Set these details:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

---

## Step 4: Add "Environment Variables" (Crucial)
On the Render dashboard for your new service, go to the **"Environment"** tab and click **"Add Environment Variable"**. Add these 6 variables:

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | Your Supabase Connection String (replace `[PASSWORD]` with your actual password) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret |
| `SECRET_TOKEN` | `illusionmaster` (or your chosen secret) |
| `ADMIN_PASSWORD` | `illusionmaster` (or your chosen password) |

---

## Step 5: Migration (Move existing work to Live)
Once your site is live on Render, you want your old portfolio items to show up.
1. On your Mac, open a terminal in your project folder.
2. Set your `DATABASE_URL` momentarily:
   ```bash
   export DATABASE_URL="your-supabase-url"
   python3 migrate.py
   ```
3. This will push all your current local work to your new live database!

---

## ✅ You're Live!
Your site is now professional grade. Images are stored in the cloud, and data is safe in a high-performance database.
