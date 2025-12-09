"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
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
      hours_per_week: profile.hours_per_week,
      scale_preference_int: 5 
    }
  };

  const roomCode = generateLobbyCode();
  const { error: roomError } = await supabase.from("rooms").insert({
    code: roomCode,
    host_id: user.id,
    players: [playerSnapshot],
    game_state: { phase: 0 }, 
    game_data: { deck: [] }
  });

  if (roomError) {
    console.log("Error creating room: ", roomError);
    return { error: "Failed to create room" };
  };

  await supabase.from("profiles").update({ current_room_code: roomCode }).eq("id", user.id);
  redirect(`/lobby/${roomCode}`);
}

export async function joinLobby(formData: FormData) {
  const capsCode = formData.get("roomCode") as string;
  const code = capsCode?.trim().toUpperCase();

  if (!code || code.length !== 6) return { error: "Invalid Room Code" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: room } = await supabase.from("rooms").select("players, game_state").eq("code", code).single();
  if (!room) return { error: "Room not found" };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const currentPlayers = room.players as any[];
  const isAlreadyIn = currentPlayers.some((p: any) => p.id === user.id);

  if (!isAlreadyIn) {
    if (room.game_state?.phase && room.game_state.phase > 0) {
        return { error: "Game already in progress" };
    }

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
        hours_per_week: profile.hours_per_week,
        scale_preference_int: 5
      }
    };
    const { error: updateError } = await supabase
      .from("rooms")
      .update({ players: [...currentPlayers, playerSnapshot] })
      .eq("code", code);

    if (updateError) return { error: "Failed to join room" };
  }

  // If we are already in, or just successfully joined, update profile and redirect
  await supabase.from("profiles").update({ current_room_code: code }).eq("id", user.id);
  redirect(`/lobby/${code}`);
}

export async function updatePlayerScale(roomCode: string, scaleValue: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: room } = await supabase.from("rooms").select("players").eq("code", roomCode).single();
  if (!room) return;

  const updatedPlayers = (room.players as any[]).map((p: any) => {
    if (p.id === user.id) {
      return { ...p, profile: { ...p.profile, scale_preference_int: scaleValue } };
    }
    return p;
  });

  await supabase.from("rooms").update({ players: updatedPlayers }).eq("code", roomCode);
}

export async function startGame(roomCode: string) {
  const supabase = await createClient();
  const { data: room } = await supabase.from("rooms").select("players").eq("code", roomCode).single();
  if (!room) return;

  const players = room.players as any[];
  const totalScale = players.reduce((sum, p) => sum + (p.profile.scale_preference_int || 5), 0);
  const avgScale = Math.round(totalScale / players.length);

  await supabase.from("rooms").update({
    game_state: { phase: 1, config: { avg_scale: avgScale } }
  }).eq("code", roomCode);
  
  // frontend handles redirect w/ realtime
}

export async function leaveLobby(roomCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: room } = await supabase
    .from("rooms")
    .select("players, host_id")
    .eq("code", roomCode)
    .single();

  if (!room) {
    await supabase.from("profiles").update({ current_room_code: null }).eq("id", user.id);
    redirect("/homepage");
    return;
  }

  const currentPlayers = room.players as any[];
  const wasHost = user.id === room.host_id;

  const updatedPlayers = currentPlayers.filter((p: any) => p.id !== user.id);

  if (updatedPlayers.length === 0) {
    await supabase
      .from("rooms")
      .delete()
      .eq("code", roomCode);
  } else {
    let newHostId = room.host_id;

    if (wasHost) {
      updatedPlayers[0].is_host = true; 
      newHostId = updatedPlayers[0].id;
    }

    await supabase
      .from("rooms")
      .update({ 
        players: updatedPlayers,
        host_id: newHostId 
      })
      .eq("code", roomCode);
  }

  await supabase
    .from("profiles")
    .update({ current_room_code: null })
    .eq("id", user.id);

  redirect("/homepage");
}