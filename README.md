# Master Builder AI

**Project Role**: Senior Full-Stack Architect & Autonomous AI Agent  
**Goal**: Build a mobile-first web app that analyzes LEGO bricks via photo, manages a personal parts library, and suggests builds with high-completion matches.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS
- **Backend/Persistence**: Supabase (Auth/DB)
- **Logic**: n8n (Local Logic)
- **Vision/AI**: Gemini Vision (via n8n)
- **Tunneling**: ngrok (exposing local n8n)
- **External API**: Rebrickable

## Architecture & Data Flow
**Privacy-First, Text-Only Architecture**

1.  **Capture**: User takes a photo in the React app (Client).
2.  **Process**: Image converted to Base64.
3.  **Transport**: POST request sent to `N8N_WEBHOOK_URL` (secured via Cloudflare Tunnel).
4.  **Analysis (n8n)**:
    - **Gemini Vision**: Identifies parts from the image.
    - **Rebrickable API**: Finds builds using those parts.
    - **Logic Node**: Calculates matches, applies color-swap logic.
5.  **Response**: JSON data returned to Client.
6.  **Persistence**: Client saves text-based parts list and build history to **Supabase**. *No images are stored purely for privacy.*

## Deployment Strategy
- **Frontend**: Deployed via **Vercel** (connects to GitHub repo).
- **Backend**: Supabase (Cloud).
- **Logic**: Local n8n instance exposed via Cloudflare Tunnel for webhook access.
