# Deploying to Vercel (Groq Edition)

## Prerequisites
- A GitHub account.
- A Vercel account (free).

## Steps

1.  **Push to GitHub**:
    Ensure all your code is committed and pushed to your GitHub repository.
    ```bash
    git add .
    git commit -m "Migrated to Groq"
    git push
    ```

2.  **Import to Vercel**:
    - Go to [vercel.com/new](https://vercel.com/new).
    - Select your `LegoAI` repository.
    - Click **Import**.

3.  **Configuring the Project**:
    - **Framework Preset**: Vercel should auto-detect "Vite". If not, select **Vite**.
    - **Root Directory**: Leave as `./` (Root).
    - **Build & Output Settings** (Expand this section):
        - **Build Command**: Toggle **OVERRIDE** to ON. Enter: `npm run build`
        - **Output Directory**: Toggle **OVERRIDE** to ON. Enter: `web-app/dist`
    - **Environment Variables**:
      Add the following keys:
      - `GROQ_API_KEY`: `gsk_O6i...` (Your Groq Key)
      - `REBRICKABLE_API_KEY`: `790...` (Your Rebrickable Key)
      - `VITE_SUPABASE_URL` (if used)
      - `VITE_SUPABASE_ANON_KEY` (if used)

4.  **Deploy**:
    - Click **Deploy**.
    - Vercel will build everything.

5.  **Done!**:
    - Open your new URL on your phone!
