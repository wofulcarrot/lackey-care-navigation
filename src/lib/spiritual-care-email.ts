/**
 * Spiritual-care notification email.
 *
 * Three delivery modes, picked at runtime based on env vars:
 *  - RESEND_API_KEY set     → Resend (preferred; zero config)
 *  - SMTP_HOST / SMTP_USER  → Nodemailer over SMTP
 *  - (neither)              → log and return. Request still captured
 *                             in the CMS so Pedro can process manually.
 *
 * Recipient resolution:
 *  - recipientOverride on a chaplain payload (already-resolved caregiver)
 *  - SPIRITUAL_CARE_EMAIL env var
 *  - first active caregiver with an email address from the rotation
 *  - fallback to admin@lackeyclinic.org + log warning
 *
 * Provider SDKs are lazy-required and cached as module-level singletons
 * so the hot path doesn't reconstruct Resend's fetch client or rebuild
 * nodemailer's transport on every submit.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { NotificationPayload, SupportedLocale } from '@/lib/spiritual-care-types'

const FALLBACK_EMAIL = 'admin@lackeyclinic.org'

// Lazy-cached provider clients. Initialized on first use so the build
// stays green when the SDKs aren't installed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let resendClient: any | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailerTransport: any | null = null

async function pickRecipient(
  type: NotificationPayload['type'],
  locale: SupportedLocale,
): Promise<string> {
  if (process.env.SPIRITUAL_CARE_EMAIL) return process.env.SPIRITUAL_CARE_EMAIL

  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'spiritual-caregivers',
      where: { isActive: { equals: true } },
      sort: 'lastContactedAt',
      limit: 10,
      overrideAccess: true,
    })
    const rows = res.docs as Array<{ email?: string; languages?: string[] }>
    const langMatch = rows.find((r) => r.email && (r.languages ?? []).includes(locale))
    if (langMatch?.email) return langMatch.email
    const anyActive = rows.find((r) => r.email)
    if (anyActive?.email) return anyActive.email
  } catch (err) {
    console.warn('[spiritual-care] caregiver lookup failed:', (err as Error).message)
  }

  console.warn(
    `[spiritual-care] no recipient configured for ${type}/${locale}; falling back to ${FALLBACK_EMAIL}`,
  )
  return FALLBACK_EMAIL
}

function buildSubject(p: NotificationPayload): string {
  const prefix = p.type === 'prayer' ? 'Prayer request' : 'Chaplain callback request'
  const from = p.name ? ` from ${p.name}` : ''
  const lang = p.locale === 'es' ? ' (ES)' : ''
  return `${prefix}${from}${lang}`
}

function buildBody(p: NotificationPayload): string {
  const lines: string[] = []
  lines.push(`A new ${p.type === 'prayer' ? 'prayer request' : 'chaplain callback request'} arrived from the Lackey Digital Front Door.`)
  lines.push('')
  if (p.name) lines.push(`Name: ${p.name}`)
  if (p.type === 'prayer') lines.push(`Email: ${p.email}`)
  if (p.type === 'chaplain') lines.push(`Phone: ${p.phone}`)
  lines.push(`Language: ${p.locale === 'es' ? 'Spanish' : 'English'}`)
  lines.push('')
  if (p.message) {
    lines.push('Message:')
    lines.push(p.message)
    lines.push('')
  }
  lines.push(`Request ID: ${p.requestId}`)
  lines.push(`Open in CMS: /admin/collections/spiritual-care-requests/${p.requestId}`)
  return lines.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResendClient(apiKey: string): any | null {
  if (resendClient) return resendClient
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require('resend')
    resendClient = new Resend(apiKey)
    return resendClient
  } catch {
    console.warn('[spiritual-care] RESEND_API_KEY set but `resend` not installed. Request captured in DB only.')
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSmtpTransport(): any | null {
  if (nodemailerTransport) return nodemailerTransport
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require('nodemailer')
    nodemailerTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Pooled transport reuses SMTP connections across submissions —
      // the request volume is low, but it's free.
      pool: true,
    })
    return nodemailerTransport
  } catch {
    console.warn('[spiritual-care] SMTP_HOST set but `nodemailer` not installed. Request captured in DB only.')
    return null
  }
}

export async function notifySpiritualCareTeam(p: NotificationPayload): Promise<void> {
  // For chaplain requests the route already resolved a caregiver via
  // the rotation — reuse that email to skip the redundant DB lookup.
  const overrideRecipient =
    p.type === 'chaplain' && p.recipientOverride ? p.recipientOverride : null
  const to = overrideRecipient ?? (await pickRecipient(p.type, p.locale))
  const subject = buildSubject(p)
  const text = buildBody(p)

  if (process.env.RESEND_API_KEY) {
    const resend = getResendClient(process.env.RESEND_API_KEY)
    if (!resend) return
    const from = process.env.SPIRITUAL_CARE_FROM || 'Lackey Front Door <noreply@lackeyclinic.org>'
    await resend.emails.send({ from, to, subject, text })
    console.log(`[spiritual-care] notified ${to} via Resend (request ${p.requestId})`)
    return
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transport = getSmtpTransport()
    if (!transport) return
    const from = process.env.SPIRITUAL_CARE_FROM || process.env.SMTP_USER
    await transport.sendMail({ from, to, subject, text })
    console.log(`[spiritual-care] notified ${to} via SMTP (request ${p.requestId})`)
    return
  }

  console.info(
    `[spiritual-care] no email provider configured; request ${p.requestId} captured in DB. ` +
      `Would notify ${to}: ${subject}`,
  )
}
