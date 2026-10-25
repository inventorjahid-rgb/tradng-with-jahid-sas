# TRADING WITH JAHID fixes

- Mobile course, book, and strategy cards now use two columns.
- PDF downloads verify actual PDF bytes; missing/corrupt PDFs show an error rather than creating a fake PDF.
- Admin uploads use Cloudinary when CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are set. PDF files use Cloudinary raw resource type.
- Existing older /uploads/ PDF records must be re-uploaded if missing from Firestore; changing code cannot recover missing bytes.
- Configure ADMIN_SECRET as a stable, strong production environment variable.
- Cloudinary upload endpoints and Vercel payload limits may restrict very large files; test with a small PDF first.
- This patch does not delete existing Firestore data.
