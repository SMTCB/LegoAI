# Master Builder AI - Setup Guide

This guide provides step-by-step instructions to configure the backend services required for Master Builder AI.

## 1. Supabase (Database & Auth)
**Goal**: Create the database to store your parts collection and build history.

1.  **Create Account/Project**: Go to [supabase.com](https://supabase.com/) and create a new project.
2.  **Get Credentials**:
    - Go to **Project Settings** -> **API**.
    - Copy the `Project URL` and `anon public` key.
    - Paste these into your `web-app/.env` file:
        ```env
        VITE_SUPABASE_URL=https://your-project.supabase.co
        VITE_SUPABASE_ANON_KEY=your-anon-key-here
        ```
3.  **Run SQL Schema**:
    - Open the `SQL Editor` in the Supabase Dashboard.
    - Copy the content from `supabase/schema.sql` in this repo.
    - Paste it into the editor and click **Run**.
    - *Success Check*: You should see `parts_inventory` and `build_history` tables in the Table Editor.

## 2. Rebrickable API (Lego Data)
**Goal**: Get an API key to search for Lego parts and sets.

1.  **Register**: Go to [rebrickable.com/api/](https://rebrickable.com/api/) and click "Register".
2.  **Get API Key**:
    - After logging in, go to the **API** tab in your profile.
    - Generate a new API Key.
    - **Keep this key secret**. You will use it in the **Backend** (.env), NOT in the frontend code.

## 3. Backend Setup (Node.js)

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    *   Create a `.env` file in the `backend` folder (copy from `.env.example`).
    *   Add your API keys:
        ```env
        PORT=3000
        GEMINI_API_KEY=AIza...
        REBRICKABLE_API_KEY=790...
        ```
    *   *Tip*: You can get your Gemini Key from [Google AI Studio](https://aistudio.google.com/app/apikey) and Rebrickable Key from [Rebrickable Settings](https://rebrickable.com/users/settings/api/).

4.  **Start the Server**:
    ```bash
    npm start
    # Output: Server running on http://localhost:3000
    ```
