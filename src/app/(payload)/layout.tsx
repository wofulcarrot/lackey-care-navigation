import type React from 'react'
import type { ServerFunctionClient } from 'payload'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './admin/importMap.js'
import '@payloadcms/ui/scss/app.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions(args)
}

export default function Layout({ children }: Args) {
  return RootLayout({ children, config, importMap, serverFunction })
}
