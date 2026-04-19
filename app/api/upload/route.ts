// =============================================================
// POST /api/upload
// Accepts: multipart/form-data with field "file"
// Saves to: Cloudinary
// Returns: { url: "https://res.cloudinary.com/..." }
// =============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using env vars
// Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    // Auth guard — only signed-in users can upload
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided. Send field name "file".' }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF` },
        { status: 415 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 5 MB` },
        { status: 413 }
      );
    }

    // Convert Web File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary using streams
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'toolverse/tools' }, // Organized dynamically
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      // Write buffer to stream and end
      const { Readable } = require('stream');
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });

    // Cloudinary returns a secure_url
    const publicUrl = (uploadResult as any).secure_url;

    return Response.json({ url: publicUrl });
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
