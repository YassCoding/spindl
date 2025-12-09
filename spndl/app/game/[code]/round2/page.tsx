import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TokenVotingInterface from "@/components/Game/Round2/TokenVoting";
import { getRoomAndGuardPhase } from "@/lib/gameGuard";

export default async function ResultsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const room = await getRoomAndGuardPhase(code, "round2");

  const deck = room.game_data?.deck || [];
  const winners = deck.filter((c: any) => c.is_winner);
  
  const allocations = room.game_state?.r2_allocations || {};

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark overflow-hidden font-display">
       <div className="absolute inset-0 bg-[url('/background.svg')] opacity-10 pointer-events-none" />
       
       <TokenVotingInterface 
          roomCode={code}
          userId={user.id}
          winners={winners}
          allocations={allocations}
          playerCount={room.players.length}
       />
    </div>
  );
}