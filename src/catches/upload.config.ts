import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { extname, join } from 'path';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

// Ensure the uploads directory exists before multer tries to write to it.
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB (the app already compresses photos)

export const catchUploadOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      const ext = extname(file.originalname) || '.jpg';
      cb(null, `${randomUUID()}${ext.toLowerCase()}`);
    },
  }),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new BadRequestException('დაშვებულია მხოლოდ სურათის ფაილი'), false);
      return;
    }
    cb(null, true);
  },
};
