# Automated Testing Guide

This project includes an automated testing pipeline to validate the **Parts Scanning** functionality. This allows us to improve the AI logic iteratively without manually testing every time.

## 📂 Directory Structure

-   `tests/fixtures/parts_scan/`: **DROP YOUR PHOTOS HERE**.
    -   Place your real-world test images in this folder.
-   `tests/manifest.json`: **DEFINE EXPECTED RESULTS HERE**.
    -   A JSON file that maps image filenames to the parts that *should* be found.
-   `scripts/test_parts_scan.js`: The runner script.

## 🚀 How to Run Tests

1.  **Start the API Server**:
    Open a terminal in the project root and run:
    ```bash
    node server.js
    ```
2.  **Run the Test Script**:
    Open a second terminal and run:
    ```bash
    node scripts/test_parts_scan.js
    ```

## 📝 How to Add a New Test

1.  **Take a Photo**: Take a clear photo of some Lego parts.
2.  **Save it**: Save it as `mypics_01.jpg` (or any name) in `tests/fixtures/parts_scan/`.
3.  **Update Manifest**: Open `tests/manifest.json` and add an entry:

```json
{
  "existing_test.jpg": [...],
  "mypics_01.jpg": [
    {
      "part_num": "3001",
      "quantity": 2,
      "name": "Brick 2x4 Red"
    },
    {
      "part_num": "3020",
      "quantity": 1,
      "name": "Plate 2x4 Blue"
    }
  ]
}
```

## 🧠 Manifest Fields
-   `part_num`: The official Lego/Rebrickable element ID (e.g. `3001`). If you don't know it, you can look it up or rely on the `name` match.
-   `quantity`: How many of this exact part are in the photo.
-   `name`: A descriptive name. The test runner uses this for fuzzy matching if `part_num` fails or is omitted.
