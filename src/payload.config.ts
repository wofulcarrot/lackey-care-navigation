import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users'
import { CareTypes } from './collections/CareTypes'
import { UrgencyLevels } from './collections/UrgencyLevels'
import { Questions } from './collections/Questions'
import { QuestionSets } from './collections/QuestionSets'
import { CareResources } from './collections/CareResources'
import { RoutingRules } from './collections/RoutingRules'
import { EmergencySymptoms } from './collections/EmergencySymptoms'
import { StaticContent } from './collections/StaticContent'
import { TriageSessions } from './collections/TriageSessions'
import { TriageEvents } from './collections/TriageEvents'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Lackey CMS',
      defaultOGImageType: 'off',
    },
    components: {
      views: {
        // Analytics view at /admin/analytics (custom home dashboard
        // temporarily disabled — Payload v3 custom home renders are finicky;
        // revisit with a simpler component shape.)
        analytics: {
          Component: './views/AnalyticsDashboard#AnalyticsDashboard',
          path: '/analytics',
        },
      },
    },
  },
  collections: [
    // Collections are grouped via each collection's admin.group:
    //   "Content"       — CareResources, EmergencySymptoms (Editors can update)
    //   "Triage Logic"  — CareTypes, Questions, QuestionSets, RoutingRules, UrgencyLevels (Admins only)
    //   "Analytics"     — TriageSessions (read-only)
    //   "System"        — Users
    CareResources,
    EmergencySymptoms,
    CareTypes,
    Questions,
    QuestionSets,
    RoutingRules,
    UrgencyLevels,
    TriageSessions,
    TriageEvents,
    Users,
  ],
  globals: [StaticContent],
  db: process.env.DATABASE_URI?.startsWith('postgres')
    ? postgresAdapter({
        pool: { connectionString: process.env.DATABASE_URI },
      })
    : sqliteAdapter({
        client: { url: process.env.DATABASE_URI || 'file:./lackey-preview.db' },
      }),
  editor: lexicalEditor(),
  i18n: {
    supportedLanguages: { en, es },
  },
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Spanish', code: 'es' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  // Build-time placeholder allows `next build` on Vercel (config runs at build
  // time where env vars may not be injected). Runtime guard below catches it.
  secret: process.env.PAYLOAD_SECRET || 'build-time-placeholder-not-for-production',
  onInit: async (payload) => {
    if (
      !process.env.PAYLOAD_SECRET ||
      process.env.PAYLOAD_SECRET.length < 32 ||
      process.env.PAYLOAD_SECRET.includes('placeholder')
    ) {
      payload.logger.error(
        'PAYLOAD_SECRET must be a 32+ char random string. ' +
        'Generate one with: openssl rand -base64 32',
      )
      process.exit(1)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
