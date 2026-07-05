import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { key, fileName } = req.query
    if (!key) return res.status(400).json({ error: 'No key provided' })

    const obj = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))

    const name = fileName || key.split('/').pop()
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`)
    res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream')
    if (obj.ContentLength) res.setHeader('Content-Length', obj.ContentLength)

    obj.Body.pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
