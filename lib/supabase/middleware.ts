import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!URL || !KEY) return response; // โหมดเดโม: ไม่บังคับล็อกอิน

  const supabase = createServerClient(URL, KEY, {
    cookieOptions: { maxAge: 60 * 60 * 24 * 400, sameSite: "lax", path: "/" },
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(toSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as any));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuth = path.startsWith("/login") || path.startsWith("/auth");

  if (!user && !isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && path.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}
