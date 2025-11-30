import BackgroundMap from "@/components/BackgroundMap";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-dark text-white font-display selection:bg-primary/30">
      <BackgroundMap />
      <Hero />
    </div>
  );
}