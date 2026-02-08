# Deploying to Vercel

## Prerequisites
- A GitHub account.
- A Vercel account (free).

## Steps

1.  **Push to GitHub**:
    Ensure all your code is committed and pushed to your GitHub repository.
    ```bash
    git add .
    git commit -m "Ready for Vercel"
    git push
    ```

2.  **Import to Vercel**:
    - Go to [vercel.com/new](https://vercel.com/new).
    - Select your `LegoAI` repository.
    - Click **Import**.

3.  **Configuring the Project**:
    - **Framework Preset**: Vercel should auto-detect "Vite" for the frontend.
    - **Root Directory**: Leave as `./` (Root).
    - **Build Command**: `cd web-app && npm install && npm run build` (Important: We need to tell Vercel to build the subdir).
    - **Output Directory**: `web-app/dist`.
    - **Environment Variables**:
      Add the following keys from your local `.env` files:
      - `GEMINI_API_KEY`
      - `REBRICKABLE_API_KEY`
      - `VITE_SUPABASE_URL` (if used)
      - `VITE_SUPABASE_ANON_KEY` (if used)

4.  **Deploy**:
    - Click **Deploy**.
    - Vercel will build the frontend and set up the serverless functions in `api/`.

5.  **Done!**:
    - You will get a URL like `https://lego-ai.vercel.app`.
    - Open this URL on your iPhone/Android to test!
