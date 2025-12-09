import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackgroundMap from "@/components/Style/BackgroundMap";
import Logo from "@/components/Style/Logo";
import LobbyInterface from "@/components/Lobby/LobbyInterface";
import { getRoomAndGuardPhase } from "@/lib/gameGuard"; // Import the guard

export default async function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  
  const room = await getRoomAndGuardPhase(code, "lobby");

  const isPlayer = room.players.some((p: any) => p.id === user.id);
  if (!isPlayer) redirect("/homepage?error=access_denied");

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark overflow-hidden font-display">
      <BackgroundMap />
      <header className="flex justify-center py-6 w-full z-10 relative pointer-events-none">
        <div className="pointer-events-auto"><Logo /></div>
      </header>
      <main className="flex-grow z-20 w-full overflow-y-auto">
         <LobbyInterface key={room.code} initialRoom={room} currentUser={user} />
      </main>
    </div>
  );
}