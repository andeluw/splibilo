import { Injectable } from '@nestjs/common';
import { Request } from 'express';

const ALLOWED_KINDS = ['avatar', 'receipt', 'proof', 'icon'] as const;
type AllowedKind = (typeof ALLOWED_KINDS)[number];

function mapKindToFolder(kind: AllowedKind): string {
  switch (kind) {
    case 'avatar':
      return 'avatars';
    case 'receipt':
      return 'receipts';
    case 'proof':
      return 'proofs';
    case 'icon':
      return 'icons';
  }
}

@Injectable()
export class UploadService {
  buildFileInfo(req: Request, kind: AllowedKind, filename: string) {
    const folder = mapKindToFolder(kind);

    const relativePath = `${folder}/${filename}`;

    // build base URL: http(s)://host
    const protocol =
      (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = req.get('host');

    const baseUrl = `${protocol}://${host}`;
    const fileUrl = `${baseUrl}/uploads/${relativePath}`;

    return {
      kind,
      file_url: fileUrl,
      path: relativePath,
    };
  }
}
