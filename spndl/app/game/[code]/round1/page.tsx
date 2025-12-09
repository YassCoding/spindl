import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackgroundMap from "@/components/Style/BackgroundMap";
import Logo from "@/components/Style/Logo";
import Round1Interface from "@/components/Game/Round1/Interface";
import { getRoomAndGuardPhase } from "@/lib/gameGuard";

export default async function Round1Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const room = await getRoomAndGuardPhase(code, "round1");

  const playerCount = room.players?.length || 1;
  const isHost = room.host_id === user.id;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark overflow-hidden font-display">
      <BackgroundMap />
      <header className="flex justify-center py-6 w-full z-10 relative pointer-events-none">
        <div className="pointer-events-auto"><Logo /></div>
      </header>
      <main className="flex-grow z-20 w-full px-4">
         <Round1Interface 
            roomCode={code} 
            userId={user.id} 
            deck={room.game_data?.deck || []} 
            initialVotes={room.game_state?.r1_votes || {}} 
            playerCount={playerCount}
            isHost={isHost}
         />
      </main>
    </div>
  );
}