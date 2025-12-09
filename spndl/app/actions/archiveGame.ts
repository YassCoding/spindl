"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function archiveGame(roomCode: string) {
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single();

  if (!room) return { error: "Room already closed" };

  const deck = room.game_data.deck || [];
  const allocations = room.game_state.r2_allocations || {};

  const scores = deck.map((card: any) => {
    const tokens = allocations[card.id] || [];
    return { ...card, score: tokens.length };
  });

  scores.sort((a: any, b: any) => b.score - a.score);

  const finalDeck = scores.map((card: any, index: number) => {
    if (index === 0) return { ...card, podium_rank: 1 };
    if (index === 1) return { ...card, podium_rank: 2 };
    if (index === 2) return { ...card, podium_rank: 3 };
    return card;
  });

  const historyEntry = {
    room_code: roomCode,
    played_at: new Date().toISOString(),
    final_game_data: { 
        deck: finalDeck, 
        players: room.players,
        scores: allocations 
    }
  };

  const { error: histError } = await supabase
    .from("history")
    .insert(historyEntry);

  if (histError) {
    console.error("History Archive Error:", histError);
  }

  await supabase.from("rooms").delete().eq("code", roomCode);

  const playerIds = room.players.map((p: any) => p.id);
  await supabase
    .from("profiles")
    .update({ current_room_code: null })
    .in("id", playerIds);

  return { success: true };
}