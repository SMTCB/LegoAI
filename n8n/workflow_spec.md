# n8n Workflow Implementation Guide

This guide details exactly how to build the backend logic in n8n.

## Workflow Overview
`Webhook (Input)` -> `Gemini (Vision)` -> `Code (Parse)` -> `SplitInBatches` -> `Rebrickable (Get Sets)` -> `Code (Master Logic)` -> `Webhook (Response)`

---

## Step 1: Receive Image (Webhook)
**Node Type**: `Webhook`
- **Path**: `/analyze`
- **Method**: `POST`
- **Authentication**: None (or 'Header Auth' if configured in ngrok)
- **Response Mode**: `OnLastNode` (We will send the JSON response manually at the end)

**Test Input**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

## Step 2: Analyze Image (Google Gemini)
**Node Type**: `Google Gemini Chat Model` (or `HTTP Request` to Gemini API)
- **Model**: `Gemini 1.5 Flash` (Recommended for speed/cost)
- **Prompt**:
  > "Identify all LEGO bricks in this image. Return ONLY a valid JSON array. Each item must have:
  > - `part_num`: The specific Lego element ID (e.g. '3001').
  > - `color_id`: The Rebrickable color ID (approximate if needed, e.g. 0 for Black, 15 for White).
  > - `quantity`: Count of this brick.
  > - `name`: Brief description.
  > Do not include markdown formatting or backticks."
- **Image Input**: Map `{{ $json.image }}` from the Webhook node.

---

## Step 3: Parse AI Response
**Node Type**: `Code`
- **Language**: JavaScript
- **Purpose**: Ensure the AI output is valid JSON data we can iterate over.
- **Code**:
  ```javascript
  const aiText = $input.first().json.content; // Adjust based on node output
  let parts = [];
  try {
    // Remove markdown code blocks if Gemini added them
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    parts = JSON.parse(cleanJson);
  } catch (e) {
    parts = []; // Handle error
  }
  return parts.map(p => ({ json: p }));
  ```

---

## Step 4: Retrieve Candidate Sets (Rebrickable)
We need to find sets that contain these parts.
**Node Type**: `Split In Batches`
- **Batch Size**: 1 (Process one part at a time)

**Node Type**: `HTTP Request` (Rebrickable)
- **Method**: `GET`
- **URL**: `https://rebrickable.com/api/v3/lego/parts/{{ $json.part_num }}/colors/{{ $json.color_id }}/sets/`
- **Header**: `Authorization: key <YOUR_KEY>`

**Node Type**: `Code` (Aggregate)
- **Purpose**: Collect all found sets into one big list before processing logic.

---

## Step 5: The Master Logic (Color-Swap & Scoring)
**Node Type**: `Code`
- **Purpose**: The core "Master Builder" algorithm.
- **Logic Description**:
  1.  **Group by Set**: Consolidate the list of sets found in Step 4.
  2.  **Fetch Set Inventory**: (Optional but recommended for accuracy) For top candidates, fetch their full part list. *Note: To save API calls, you might stick to the "finding" logic first or only check top 10.*
  3.  **Calculate Score**:
      - `Owned Parts` / `Total Set Parts` = Base %
      - **Color Logic**: If the user has the part in a *different* color, count it as `0.8` of a part instead of `1.0`.
  4.  **Filter**: Remove results < 85% match.
  5.  **Generate Missing List**: `Set Parts - User Parts`.

**Output Structure**:
```json
[
  {
    "scan_id": "unique-id",
    "identified_parts": [...],
    "suggested_builds": [
      {
        "set_id": "60000",
        "name": "Fire Motorcycle",
        "match_score": 92.5,
        "missing_parts": [...]
      }
    ]
  }
]
```

---

## Step 6: Return Response
**Node Type**: `Respond to Webhook`
- **Respond With**: JSON
- **Body**: `{{ $json }}` (The output from Step 5)
