// =============================================================
// POST /api/upload
// Accepts: multipart/form-data with field "file"
// Saves to: public/uploads/tools/<uuid>.<ext>
// Returns: { url: "/uploads/tools/<uuid>.<ext>" }
//
// NOTE: local filesystem storage is perfect for development.
// For production on Vercel/serverless, swap this out for
// an object store (S3, Cloudinary, etc.), since the
// filesystem is ephemeral there.
// =============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    // Auth guard — only signed-in users can upload
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Parse multipart form data (built-in Web API — no extra deps)
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

    // Determine save path: public/uploads/tools/<uuid>.<ext>
    const ext       = extname(file.name).toLowerCase() || '.jpg';
    const filename  = `${randomUUID()}${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'tools');
    const filePath  = join(uploadDir, filename);

    // Ensure directory exists (idempotent)
    await mkdir(uploadDir, { recursive: true });

    // Stream file contents to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return public-facing URL (Next.js serves /public/** as /**)
    const publicUrl = `/uploads/tools/${filename}`;
    return Response.json({ url: publicUrl });
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
