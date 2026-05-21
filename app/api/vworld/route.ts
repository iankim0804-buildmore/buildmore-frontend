import { NextRequest, NextResponse } from 'next/server'

const VWORLD_BASE_URL = 'https://api.vworld.kr'
const DEFAULT_REFERER = 'https://buildmore.co.kr'
const ALLOWED_PATH_PREFIX = '/ned/data/'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized VWorld proxy request' }, { status: 401 })
}

export async function GET(request: NextRequest) {
  try {
    const configuredToken = process.env.VWORLD_PROXY_TOKEN?.trim()
    if (configuredToken) {
      const authorization = request.headers.get('authorization') || ''
      const headerToken = request.headers.get('x-buildmore-proxy-token') || ''
      const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

      if (bearerToken !== configuredToken && headerToken !== configuredToken) {
        return unauthorized()
      }
    }

    const requestUrl = new URL(request.url)
    const path = requestUrl.searchParams.get('path') || ''

    if (!path.startsWith(ALLOWED_PATH_PREFIX) || path.includes('..') || path.startsWith('//')) {
      return NextResponse.json({ error: 'Unsupported VWorld path' }, { status: 400 })
    }

    const upstreamUrl = new URL(path, VWORLD_BASE_URL)
    requestUrl.searchParams.forEach((value, key) => {
      if (key !== 'path') {
        upstreamUrl.searchParams.append(key, value)
      }
    })

    const apiKey = process.env.VWORLD_API_KEY?.trim()
    const domain = process.env.VWORLD_DOMAIN?.trim() || DEFAULT_REFERER
    const referer = domain.startsWith('http') ? domain : `https://${domain}`

    if (apiKey && !upstreamUrl.searchParams.has('key')) {
      upstreamUrl.searchParams.set('key', apiKey)
    }
    if (domain && !upstreamUrl.searchParams.has('domain')) {
      upstreamUrl.searchParams.set('domain', domain)
    }
    if (!upstreamUrl.searchParams.has('format')) {
      upstreamUrl.searchParams.set('format', 'json')
    }

    const response = await fetch(upstreamUrl.toString(), {
      cache: 'no-store',
      headers: {
        Accept: 'application/json, text/html, */*',
        Origin: referer,
        Referer: referer,
        'User-Agent': 'BuildMore/1.0',
      },
    })
    const body = await response.text()
    const contentType = response.headers.get('content-type') || 'application/json'

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[api/vworld] proxy error:', error)
    return NextResponse.json({ error: 'VWorld proxy failed' }, { status: 500 })
  }
}
