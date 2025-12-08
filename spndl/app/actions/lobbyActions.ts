"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Helper to generate 6-char code
function generateLobbyCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createLobby() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const playerSnapshot = {
    id: user.id,
    name: profile.username || "Unknown User",
    avatar_url: profile.avatar_url,
    is_host: true,
    status: "ready",
    profile: {
      skills: profile.skills,
      role_interest: profile.role_interest,
      hobbies: profile.hobbies,
      hours_per_week: profile.hours_per_week
    }
  };

  const roomCode = generateLobbyCode();

  const { error: roomError } = await supabase
    .from("rooms")
    .insert({
      code: roomCode,
      host_id: user.id,
      players: [playerSnapshot],
      game_state: { phase: 0 }, 
      game_data: { deck: [] }
    });

  if (roomError) {
    console.log("Error creating room: ",roomError);
    return { error: "Failed to create room" };
  };

  await supabase
    .from("profiles")
    .update({ current_room_code: roomCode })
    .eq("id", user.id);

  redirect(`/lobby/${roomCode}`);
}

export async function joinLobby(formData: FormData) {
  const code = formData.get("roomCode") as string;
  if (!code || code.length !== 6) return { error: "Invalid Room Code" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: room } = await supabase
    .from("rooms")
    .select("players, game_state")
    .eq("code", code)
    .single();

  if (!room) return { error: "Room not found" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const currentPlayers = room.players as any[];
  const isAlreadyIn = currentPlayers.some((p: any) => p.id === user.id);

  if (!isAlreadyIn) {
    const playerSnapshot = {
      id: user.id,
      name: profile.username,
      avatar_url: profile.avatar_url,
      is_host: false,
      status: "ready",
      profile: {
        skills: profile.skills,
        role_interest: profile.role_interest,
        hobbies: profile.hobbies,
        hours_per_week: profile.hours_per_week
      }
    };

    const { error: updateError } = await supabase
      .from("rooms")
      .update({ players: [...currentPlayers, playerSnapshot] })
      .eq("code", code);

    if (updateError) return { error: "Failed to join room" };
  }

  await supabase
    .from("profiles")
    .update({ current_room_code: code })
    .eq("id", user.id);

  redirect(`/lobby/${code}`);
}