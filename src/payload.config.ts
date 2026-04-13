import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      views: {
        analytics: {
          Component: './views/AnalyticsDashboard#AnalyticsDashboard',
          path: '/analytics',
        },
      },
    },
  },
  collections: [
    Users,
    CareTypes,
    UrgencyLevels,
    Questions,
    QuestionSets,
    CareResources,
    RoutingRules,
    EmergencySymptoms,
    TriageSessions,
  ],
  globals: [StaticContent],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
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
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
