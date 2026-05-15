/**
 * Minimal stub of `next/server` for vitest. We don't pull Next.js in as a
 * dev dep just to test our route handlers — the route only uses
 * NextResponse / NextRequest, and both can be backed by the Web standard
 * Request / Response that jsdom + undici expose.
 *
 * Keep the surface tight: if a future route handler reaches for a Next
 * helper that isn't here, add it here, don't reach for the real package.
 */

export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit): NextResponse {
    return new NextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  }
}

export type NextRequest = Request;
