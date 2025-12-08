import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackgroundMap from "@/components/Style/BackgroundMap";
import Logo from "@/components/Style/Logo";
import ManualInputForm from "@/components/Onboarding/ManualInputForm";

export default async function ManualProfilePage() {
  const supabase = await createClient();

  // get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // get skills from resume
  const { data: profile } = await supabase
    .from("profiles")
    .select("skills")
    .eq("id", user.id)
    .single();

  // make array even if empty
  const initialSkills = profile?.skills || [];

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-dark text-white font-display selection:bg-primary/30">
      <BackgroundMap />
      
      {/* header */}
      <header className="flex items-center justify-center whitespace-nowrap px-4 sm:px-10 py-6 absolute top-0 left-0 right-0 z-20">
        <Logo />
      </header>

      {/* content */}
      <main className="flex-grow flex items-center justify-center z-10 w-full py-20">
        <ManualInputForm initialSkills={initialSkills} />
      </main>
    </div>
  );
}