/**
 * Preview-only diagnostic endpoint — surfaces Payload init and query
 * errors so we can debug DB connectivity without digging through
 * truncated Vercel logs. Returns 404 in production to keep the error
 * surface closed.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 30

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const dbUri = process.env.DATABASE_URI || ''
  const secret = process.env.PAYLOAD_SECRET || ''
  const results: Record<string, unknown> = {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    hasDatabaseUri: Boolean(dbUri),
    databaseUriKind: dbUri.startsWith('postgres')
      ? 'postgres'
      : dbUri.startsWith('file:')
        ? 'sqlite-file'
        : dbUri
          ? 'other'
          : 'missing',
    databaseUriHostHint: dbUri.startsWith('postgres')
      ? dbUri.split('@')[1]?.split('/')[0] ?? 'unparseable'
      : null,
    hasPayloadSecret: Boolean(secret),
    payloadSecretLength: secret.length,
    timestamp: new Date().toISOString(),
  }

  try {
    const payload = await getPayload({ config })
    results.payloadInit = 'ok'
    try {
      const r = await payload.find({ collection: 'care-types', limit: 1 })
      results.careTypesFind = { ok: true, totalDocs: r.totalDocs }
    } catch (err) {
      results.careTypesFind = {
        ok: false,
        message: (err as Error).message,
        stack: ((err as Error).stack || '').split('\n').slice(0, 8),
      }
    }
  } catch (err) {
    results.payloadInit = 'error'
    results.payloadInitError = {
      message: (err as Error).message,
      stack: ((err as Error).stack || '').split('\n').slice(0, 10),
    }
  }

  return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } })
}
