"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function placeToken(roomCode: string, cardId: string, action: "ADD" | "REMOVE") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("place_token", {
    p_room_code: roomCode,
    p_user_id: user.id,
    p_card_id: cardId,
    p_action: action
  });

  if (error) {
    console.error("Token error:", error);
    return { error: error.message };
  }

  revalidatePath(`/game/${roomCode}/results`);
  return { success: true };
}

export async function checkRoundCompletion(roomCode: string, playerCount: number) {
  const supabase = await createClient();
  
  const { data: room } = await supabase
    .from("rooms")
    .select("game_state")
    .eq("code", roomCode)
    .single();

  if (!room) return;

  const allocations = room.game_state.r2_allocations || {};
  
  // count total tokens placed
  let totalTokens = 0;
  Object.values(allocations).forEach((v: any) => {
    if (Array.isArray(v)) totalTokens += v.length;
  });

  if (totalTokens >= playerCount * 2) {
      await supabase
        .from("rooms")
        .update({
             game_state: { ...room.game_state, phase: 5 } 
        })
        .eq("code", roomCode);
  }
}