import { updateSession } from "@/lib/supabase/proxy";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // 1. Setup Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Handled by updateSession later
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user) {
    if (path.startsWith("/homepage") || path.startsWith("/onboarding") || path.startsWith("/lobby")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return await updateSession(request);
  }
  
  let stage: number;
  let shouldSetCookie = false;

  const stageCookie = request.cookies.get("spindl_stage");

  if (stageCookie) {
    stage = parseInt(stageCookie.value);
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_stage")
      .eq("id", user.id)
      .single();

    stage = profile?.onboarding_stage ?? 0;
    shouldSetCookie = true;
  }

  let targetPath = "/homepage";
  if (stage === 0) targetPath = "/onboarding/resumeautofiller";
  else if (stage === 1) targetPath = "/onboarding/manualprofilefill";
  else if (stage === 2) targetPath = "/homepage"; 

  let response: NextResponse | null = null;

  if (stage < 3 && path !== targetPath) {
     response = NextResponse.redirect(new URL(targetPath, request.url));
  }

  else if (stage >= 3 && (path === "/" || path.startsWith("/onboarding"))) {
     response = NextResponse.redirect(new URL("/homepage", request.url));
  }

  if (response) {
    if (shouldSetCookie) {
      response.cookies.set("spindl_stage", stage.toString(), { maxAge: 60 * 60 * 24 }); // Cache for 24h
    }
    return response;
  }

  const sessionResponse = await updateSession(request);
  if (shouldSetCookie) {
    sessionResponse.cookies.set("spindl_stage", stage.toString(), { maxAge: 60 * 60 * 24 });
  }
  
  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};