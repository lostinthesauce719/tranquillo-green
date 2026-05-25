import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple pass-through middleware.
// Auth is handled client-side via ClerkProvider in the layout
// and server-side with withAuth() wrappers on API routes.
export default function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};