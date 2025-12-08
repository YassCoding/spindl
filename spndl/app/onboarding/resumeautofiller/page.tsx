import BackgroundMap from "@/components/Style/BackgroundMap";
import Logo from "@/components/Style/Logo";
import ResumeCard from "@/components/Onboarding/ResumeCard";

export default function SkillsPage() {
  return (
    // Reusing the same layout structure as the main page
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-dark text-white font-display selection:bg-primary/30">
      <BackgroundMap />
      
      {/* Header with Logo placed absolutely at the top */}
      <header className="flex items-center justify-center whitespace-nowrap px-4 sm:px-10 py-6 absolute top-0 left-0 right-0 z-20">
        <Logo />
      </header>

      {/* Main content area centered on screen */}
      <main className="flex-grow flex items-center justify-center z-10 p-4">
        <ResumeCard />
      </main>
    </div>
  );
}