import { updateSession } from "@/lib/supabase/proxy"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Skip auth session check for public routes and API routes that don't need it
  // This prevents "Browser Restriction" warnings in embedded previews
  const pathname = request.nextUrl.pathname
  if (pathname === "/" || pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
