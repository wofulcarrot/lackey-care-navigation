import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
} from '@payloadcms/next/routes'
import config from '@payload-config'
import type { NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{ payload: string[] }>
}

const restGet = REST_GET(config)
const restPost = REST_POST(config)
const restDelete = REST_DELETE(config)
const restPatch = REST_PATCH(config)
const restOptions = REST_OPTIONS(config)

export function GET(request: NextRequest, { params }: RouteContext) {
  return restGet(request, {
    params: params.then(({ payload }) => ({ slug: payload })),
  })
}

export function POST(request: NextRequest, { params }: RouteContext) {
  return restPost(request, {
    params: params.then(({ payload }) => ({ slug: payload })),
  })
}

export function DELETE(request: NextRequest, { params }: RouteContext) {
  return restDelete(request, {
    params: params.then(({ payload }) => ({ slug: payload })),
  })
}

export function PATCH(request: NextRequest, { params }: RouteContext) {
  return restPatch(request, {
    params: params.then(({ payload }) => ({ slug: payload })),
  })
}

export function OPTIONS(request: NextRequest, { params }: RouteContext) {
  return restOptions(request, {
    params: params.then(({ payload }) => ({ slug: payload })),
  })
}
