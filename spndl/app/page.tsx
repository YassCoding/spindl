import BackgroundMap from "@/components/Style/BackgroundMap";
import Hero from "@/components/Landing/Hero";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-dark text-white font-display selection:bg-primary/30">
      <BackgroundMap />
      <Hero />
    </div>
  );
}