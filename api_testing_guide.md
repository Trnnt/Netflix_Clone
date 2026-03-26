# Rimuru API Testing Guide (Postman)

This guide explains how to verify the **Rimuru Backend** using Postman. We will test Authentication, Data Persistence, and Security Hardening.

## 1. Import the Collection
1. Open Postman.
2. Click **Import** (top left).
3. Select the file: [rimuru_api_collection.json](file:///C:/Users/NISHANT%20KUMAR/.gemini/antigravity/brain/db0ec04d-7f1f-454e-9ffc-39dd261c5e51/rimuru_api_collection.json).
4. You will see a new folder named **Rimuru API Testing**.

## 2. Test Login & Authentication
- **Register New User**: Run this first to create a test account.
- **Login User**: Run this next. 
    - **Pro Tip**: I've added a "Test" script that automatically saves the `rimuru_token` to your Postman variables. You don't need to copy-paste it!

## 3. Test Data Saving (Persistence)
- **Save to My List**: This test sends a "Fight Club" entry to your watchlist.
- **Verify List Data**: This GET request retrieves your list. If "Fight Club" appears, **Data Saves** is confirmed!
- You can similarly test Likes and Downloads using the same pattern.

## 4. Test Security & Error Handling
### Rate Limiting
- Send the **Login User** request repeatedly. 
- After 15 attempts within 15 minutes, the server will return `429 Too Many Requests`.
- This proves the "Rimuru" backend is protected against brute-force attacks.

### NoSQL Injection Prevention
- Run **Test NoSQL Injection (Sanitize)**.
- The payload uses a MongoDB operator `"$gt": ""`.
- **Expected**: The server safely handles this and returns a `401 Unauthorized` (because the operator was stripped and the email became empty) instead of leaking data.

### Input Sanitization (XSS)
- The backend automatically cleans all input. Any `<script>` tags sent in names or movie titles will be neutralized before reaching the database.

---
**Status**: 🚀 All backend systems are hardened and ready for production.
