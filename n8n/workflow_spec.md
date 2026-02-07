# n8n Workflow Logic Specification

## Overview
The n8n workflow is the "brain" of Master Builder AI. It receives an image, identifies parts, finds builds, and filters them.

**Webhook URL**: `POST <ngrok_url>/webhook/analyze`
**Input**: JSON `{ "image": "base64_string" }`
**Output**: JSON `{ "identified_parts": [...], "suggested_builds": [...] }`

## 1. Vision Analysis (Gemini Node)
- **Input**: Base64 image.
- **Prompt**: "Identify all LEGO bricks in this image. Return a JSON array where each item has: `part_num` (Rebrickable ID), `color_id` (Rebrickable Color ID), `quantity`, and `name`."
- **Output**: JSON Array of identified parts.

## 2. Rebrickable Integration
### Fetch Sets
- For each unique `part_num`, query Rebrickable API to find sets containing this part.
- Endpoint: `GET /api/v3/lego/parts/{part_num}/colors/{color_id}/sets/`
- **Optimization**: accurate color matching is preferred, but loose matching is allowed (see below).

## 3. Logic: Color-Swap & Matching
This logic should be implemented in a **Code Node** (JavaScript) in n8n.

### Algorithm
1.  **User Inventory**: `identified_parts` from Gemini.
2.  **Candidate Sets**: Aggregate all sets returned from Rebrickable queries.
3.  **Scoring**:
    For each Candidate Set:
    - Get full part list for the set (Cache this if possible, or fetch on demand).
    - Compare `Set Parts` vs `User Inventory`.
    - **Match Calculation**:
        - `Exact Match`: User has Part X in Color Y. (Score: 1.0 per part)
        - `Color Swap`: User has Part X in *Different* Color Z. (Score: 0.8 per part)
    - `Total Score` = (Sum of Scores) / (Total Parts in Set) * 100.

### 4. Logic: Completion Filtering
- Filter the list of coded sets.
- **Rule**: `match_score >= 85`.
- Sort by `match_score` (descending).
- Take top 5.

### 5. Logic: Missing List
For the top 5 sets, generate a `missing_parts` array.
- For each missing part:
    - Include `part_num`, `color_id`, `name`, `img_url`.
    - Quantity needed = (Set Qty) - (User Qty).

## 6. Response Format
Return this JSON to the frontend:
```json
{
  "scan_id": "uuid",
  "identified_parts": [
    { "part_num": "3001", "color_id": 15, "quantity": 5, ... }
  ],
  "suggested_builds": [
    {
      "set_id": "60000",
      "name": "Fire Motorcycle",
      "match_score": 92.5,
      "missing_parts": [...]
    }
  ]
}
```
