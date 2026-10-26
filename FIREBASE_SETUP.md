# TRADING WITH JAHID — Firebase Admin setup

1. In Vercel → Project → Settings → Environment Variables set:
   - `FIREBASE_PROJECT_ID=trading-with-jahid`
   - `FIREBASE_FIRESTORE_DATABASE_ID=(default)`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (Secret): paste the **entire downloaded service-account JSON** directly in Vercel. NEVER paste it into ChatGPT, GitHub, or public files.
   - `ADMIN_INITIAL_PASSWORD` (Secret): a unique strong password **only for a fresh installation**. After the first successful initialization, delete this variable and redeploy. If an existing admin hash exists, change the password from the admin panel.
   - Keep existing `ADMIN_SECRET` and Cloudinary variables.
2. Leave Firestore rules at `allow read, write: if false;` — the server Admin SDK bypasses these rules.
3. Deploy first to Preview and test login, PDF upload, PDF open and `?download=1` for download before production.
4. **The new Firebase project is empty.** Existing documents and uploaded PDF chunks in the old project do not migrate automatically. Back up / migrate them separately before switching production.
5. Avoid committing `.env`, private keys, or service-account JSON. Rotate any secrets that have been exposed.
6. This package was statically patched; dependency installation and deployment build must be run in a network-enabled environment (`npm install && npm run lint && npm run build`).

**Caution:** Vercel serverless storage is ephemeral. The existing `/admin/media-library` endpoint lists only local files, not persisted Firestore files, and may not list prior uploads across invocations. Do not assume media library is complete. Firestore document size and quota also constrain PDF sizes.
