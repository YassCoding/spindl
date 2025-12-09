import { updateSession } from "@/lib/supabase/proxy";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 1. Unauthenticated Guard
  if (!user) {
    if (path.startsWith("/homepage") || path.startsWith("/onboarding") || path.startsWith("/lobby")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return await updateSession(request);
  }

  // 2. Authenticated Guard
  let stage: number;
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
  }

  // Define Paths
  let targetPath = "/homepage";
  if (stage === 0) targetPath = "/onboarding/resumeautofiller";
  else if (stage === 1) targetPath = "/onboarding/manualprofilefill";
  
  // --- THE FIX: ALLOW LOBBY ACCESS ---
  const isLobbyOrGame = path.startsWith("/lobby") || path.startsWith("/game");
  const isDoneOnboarding = stage >= 2;

  // Rule A: Locked in Onboarding (Strict)
  if (!isDoneOnboarding && path !== targetPath) {
     return NextResponse.redirect(new URL(targetPath, request.url));
  }

  // Rule B: Done Onboarding (Allow Dashboard + Game Routes)
  if (isDoneOnboarding && (path === "/" || path.startsWith("/onboarding"))) {
     return NextResponse.redirect(new URL("/homepage", request.url));
  }

  // Rule C: Protect Game Routes from non-onboarded users
  if (isLobbyOrGame && !isDoneOnboarding) {
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};