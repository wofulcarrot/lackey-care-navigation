import { NotFoundPage } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'
import config from '@payload-config'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export default function NotFound({ params, searchParams }: Args) {
  return NotFoundPage({
    config,
    importMap,
    params,
    searchParams,
  })
}
