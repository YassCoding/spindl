import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackgroundMap from "@/components/Style/BackgroundMap";
import Logo from "@/components/Style/Logo";
import HomeMenu from "@/components/HomePage/HomeMenu";

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Fetch profile to check for active game or onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_room_code, onboarding_stage")
    .eq("id", user.id)
    .single();

  // Redirect logic if they haven't finished onboarding
  if (profile && profile.onboarding_stage < 3) { // Assuming 3 is "Done"
     if(profile.onboarding_stage === 0) redirect("/onboarding/resumeautofiller");
     if(profile.onboarding_stage === 1) redirect("/onboarding/manualprofilefill");
     // Add tutorial redirect here if stage 2
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-dark text-white font-display selection:bg-primary/30">
      <BackgroundMap />
      
      {/* Header */}
      <header className="flex items-center justify-center whitespace-nowrap px-4 sm:px-10 py-6 absolute top-0 left-0 right-0 z-20">
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center z-10 w-full p-4">
        <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-3 tracking-tight">
                Where to next?
            </h1>
            <p className="text-white/50 text-lg max-w-lg mx-auto">
                Join a crew or start a new expedition to weave your next masterpiece.
            </p>
        </div>
        
        <HomeMenu currentRoom={profile?.current_room_code} />
      </main>
    </div>
  );
}