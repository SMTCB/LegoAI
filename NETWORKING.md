# Network & Git Configuration

## 1. ngrok Setup (Tunneling)
To expose your local n8n instance (running on port 5678) to the internet so the React app (or external APIs) can reach it:

1.  **Install ngrok**: Download from [ngrok.com](https://ngrok.com/download) or use a package manager.
2.  **Authenticate**: Run the command provided in your ngrok dashboard.
    ```bash
    ngrok config add-authtoken <YOUR_TOKEN>
    ```
3.  **Start Tunnel**:
    ```bash
    ngrok http 5678
    ```
4.  **Copy URL**: Copy the `https://...` URL shown in the terminal.
5.  **Update Environment**: Paste this URL into your `web-app/.env` file as `VITE_N8N_WEBHOOK_URL`.
    ```env
    VITE_N8N_WEBHOOK_URL=https://<your-ngrok-id>.ngrok-free.app/webhook/analyze
    ```

## 2. Git Auto-Push
To enable automatic backup of your work via Antigravity:

1.  **Link GitHub**:
    - Open **Agent Manager** in Antigravity.
    - Install **GitHub MCP**.
    - Authenticate with your GitHub account.

2.  **Configure Policy**:
    - In `antigravity.json`, set `artifactReviewPolicy` for Git commands to `Always Proceed` (optional, for fully autonomous pushing).

3.  **Usage**:
    - Simply tell the agent: "Push my progress to GitHub" and it will handle the commit and push operations.
