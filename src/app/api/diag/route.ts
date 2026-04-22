/**
 * Preview-only diagnostic endpoint. Exposes Payload init + find errors
 * so we can see why /api/health returns degraded on the feat/spiritual-care
 * preview. Returns 404 in production to keep the error surface closed.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 30

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const results: Record<string, unknown> = {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    hasDatabaseUri: Boolean(process.env.DATABASE_URI),
    hasPayloadSecret: Boolean(process.env.PAYLOAD_SECRET),
    payloadSecretLength: (process.env.PAYLOAD_SECRET || '').length,
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
        stack: ((err as Error).stack || '').split('\n').slice(0, 5),
      }
    }
    try {
      const r = await payload.find({
        collection: 'emergency-symptoms',
        where: { isActive: { equals: true } },
        limit: 1,
        locale: 'en',
      })
      results.emergencyFind = { ok: true, totalDocs: r.totalDocs }
    } catch (err) {
      results.emergencyFind = {
        ok: false,
        message: (err as Error).message,
        stack: ((err as Error).stack || '').split('\n').slice(0, 5),
      }
    }
    try {
      const r = await payload.find({ collection: 'spiritual-caregivers', limit: 1 })
      results.spiritualCaregiversFind = { ok: true, totalDocs: r.totalDocs }
    } catch (err) {
      results.spiritualCaregiversFind = {
        ok: false,
        message: (err as Error).message,
      }
    }
  } catch (err) {
    results.payloadInit = 'error'
    results.payloadInitError = {
      message: (err as Error).message,
      stack: ((err as Error).stack || '').split('\n').slice(0, 10),
    }
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
