import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC = [
  /^\/_login(.*)$/,
  /^\/api\/auth(.*)$/,
  /^\/api\/login$/,
  /^\/api\/logout$/,
  /^\/_next(.*)$/,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/.*\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf)$/
];

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.some(rx => rx.test(pathname))) return NextResponse.next();

  // Dev režīms ar lokālo paroli (neuzstādi Vercel!)
  if (process.env.ENABLE_LOCAL_LOGIN === "1") {
    if (req.cookies.get("auth")?.value === "1") return NextResponse.next();
  }

  // NextAuth GitHub JWT
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/_login";
  url.search = `from=${encodeURIComponent(pathname + (search || ""))}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api/auth|favicon.ico|robots.txt).*)"]
};
