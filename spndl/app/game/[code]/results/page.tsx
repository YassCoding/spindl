import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResultsInterface from "@/components/Game/Results/ResultsInterface";

export default async function ResultsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (!room) {
    redirect("/homepage");
  }

  const deck = room.game_data.deck || [];
  const allocations = room.game_state.r2_allocations || {};

  const scores = deck.map((card: any) => {
    const tokens = allocations[card.id] || [];
    return { ...card, score: tokens.length };
  });

  scores.sort((a: any, b: any) => b.score - a.score);

  const winners = scores.slice(0, 3);
  const isHost = room.host_id === user.id;

  return (
    <ResultsInterface 
        roomCode={code} 
        isHost={isHost} 
        winners={winners} 
    />
  );
}