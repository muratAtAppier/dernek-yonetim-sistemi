import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

type UploadResult = { url: string; key: string }

async function ensureLocalUploadDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch {}
}

export async function uploadFile(
  buffer: Buffer,
  contentType: string,
  opts?: { prefix?: string; extHint?: string }
): Promise<UploadResult> {
  const extFromType = contentType?.includes('png')
    ? 'png'
    : contentType?.includes('jpeg')
      ? 'jpg'
      : contentType?.includes('jpg')
        ? 'jpg'
        : contentType?.includes('webp')
          ? 'webp'
          : opts?.extHint || 'bin'
  const keyName = `${randomUUID()}.${extFromType}`

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await ensureLocalUploadDir(uploadDir)
  const filePath = path.join(uploadDir, keyName)
  await fs.writeFile(filePath, buffer)
  const url = `/uploads/${path.basename(filePath)}`
  return { url, key: path.basename(filePath) }
}

export async function deleteFileByUrl(url: string): Promise<void> {
  if (!url) return
  const match = url.match(/\/uploads\/(.+)$/)
  if (match) {
    const filename = match[1]
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
    try {
      await fs.unlink(filePath)
    } catch {}
  }
}
