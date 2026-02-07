# Master Builder AI - Specifications

## Environment Variables
The application requires the following environment variables.
Create a `.env` file in the root of the frontend project and configure your deployment platform (Vercel) with these.

| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anonymous Key |
| `VITE_N8N_WEBHOOK_URL` | The public URL for your n8n workflow (e.g., via ngrok) |

**Note**: `REBRICKABLE_API_KEY` is used within **n8n**, not the frontend.

## Logic Specifications

### 1. Color-Swap Logic
The core matching algorithm resides in n8n.
- If `Part ID` matches but `Color ID` differs:
    - Count as a "Compatible Swap".
    - Apply a **0.8x score weight** to the match contribution.
    - This ensures users can still build sets even with different colored bricks.

### 2. Completion Logic
- Filter build results to only show sets with **>85% completion**.
- This avoids frustration by suggesting builds the user can actually complete (or close to it).

### 3. Missing List Generation
- Identify the exact missing parts (up to 15%).
- Return this list in the JSON response to populate a "Shopping List" or "Missing Parts" view in the frontend.

## Data Schema (Supabase)

### `parts_inventory`
| Column | Type | Description |
| :--- | :--- |
| `id` | uuid | Primary Key |
| `user_id` | uuid | Foreign Key (auth.users) |
| `part_num` | text | Rebrickable Part Number |
| `color_id` | int | Rebrickable Color ID |
| `quantity` | int | Number of pieces owned |

### `build_history`
| Column | Type | Description |
| :--- | :--- |
| `id` | uuid | Primary Key |
| `user_id` | uuid | Foreign Key (auth.users) |
| `set_id` | text | Set Number |
| `name` | text | Set Name |
| `match_score` | float | Calculated Match % |
| `instruction_url` | text | Link to instructions |
| `created_at` | timestamp | Scan time |

## Network Setup
- **ngrok**: Use `ngrok` to expose localhost:5678 (n8n) to a stable public URL.
- **Git Auto-Push**: Enabled via Antigravity for continuous backup.
