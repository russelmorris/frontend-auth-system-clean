import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Request is already authenticated by this point
    return
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/((?!auth).)*" // Protect all API routes except auth
  ]
}