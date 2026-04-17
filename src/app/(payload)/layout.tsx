import type React from 'react'
import type { ServerFunctionClient } from 'payload'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './admin/importMap.js'
// Import the complete compiled Payload admin stylesheet (ships with
// @payloadcms/next). This contains all component styles — nav, sidebar,
// list tables, forms, everything. The base `app.scss` alone is incomplete
// because individual components rely on their own co-located SCSS that
// don't get bundled through a single entrypoint import.
// @ts-ignore — Payload exports this CSS via package.json "exports" but
// doesn't ship a .d.ts for it. Works at runtime; TypeScript just can't
// find the type declaration. Suppressed for production builds.
import '@payloadcms/next/css'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

// @ts-ignore — Payload's handleServerFunctions type signature drifts between
// minor versions. Works at runtime; strict TS build flags a false mismatch.
const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function Layout({ children }: Args) {
  return RootLayout({ children, config, importMap, serverFunction })
}
