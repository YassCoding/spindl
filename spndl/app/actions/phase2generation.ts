"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function triggerPhase3Transition(roomCode: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("rooms")
    .update({ 
      game_state: { 
        phase: 3, 
        r1_votes: { total_swipes: 9999, map: {} },
        is_generating: false 
      } 
    })
    .eq("code", roomCode);

  if (error) return { error: "Failed to transition" };
  
  revalidatePath(`/game/${roomCode}/round1`);
  return { success: true };
}


const Phase2IdeaSchema = z.object({
  id: z.string().describe("The ID of the idea being updated."),
  cool_features: z.array(z.string()).length(3).describe("3 really cool, distinct features for this idea."),
  risk: z.string().describe("One major risk associated with this idea."),
  killer_pitch: z.string().describe("A short, punchy, killer marketing pitch."),
});

const GenerationResponseSchema = z.object({
  generated_ideas: z.array(Phase2IdeaSchema),
});

export async function generatePhase2(roomCode: string) {
  const supabase = await createClient();
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

  const { data: room } = await supabase
    .from("rooms")
    .select("game_data, game_state")
    .eq("code", roomCode)
    .single();

  if (!room) return { error: "Room not found" };

  if (room.game_state?.phase >= 4) {
      return { success: true };
  }
  
  if (room.game_state?.is_generating) {
      return { success: true, message: "Already running" };
  }

  await supabase
    .from("rooms")
    .update({ 
        game_state: { ...room.game_state, is_generating: true } 
    })
    .eq("code", roomCode);

  const deck = room.game_data.deck || [];
  const votesMap = room.game_state.r1_votes?.map || {};
  const deckWithVotes = deck.map((card: any) => {
    const cardVotes = votesMap[card.id] || {};
    const totalVotes = Object.values(cardVotes).reduce((sum: number, weight: any) => sum + (Number(weight) || 0), 0);
    return { ...card, votes: totalVotes };
  });

  const sortedDeck = [...deckWithVotes].sort((a: any, b: any) => b.votes - a.votes);
  
  let winningIdeas: any[] = [];
  if (sortedDeck.length <= 8) {
    winningIdeas = sortedDeck;
  } else {
    const cutoffVotes = sortedDeck[7].votes;
    const guaranteed = sortedDeck.filter((i: any) => i.votes > cutoffVotes);
    const contenders = sortedDeck.filter((i: any) => i.votes === cutoffVotes);
    const spotsRemaining = 8 - guaranteed.length;
    const luckyWinners = contenders.sort(() => Math.random() - 0.5).slice(0, spotsRemaining);
    winningIdeas = [...guaranteed, ...luckyWinners];
  }

  const promptContext = winningIdeas.map(i => `ID: ${i.id} | Title: ${i.title} | Desc: ${i.description}`).join("\n");
  const prompt = `
    You are a Startup Accelerator AI.
    I have selected the "Winning 8" ideas.
    For EACH idea listed below, generate: 3 cool features, 1 risk, 1 killer pitch.
    INPUT IDEAS: ${promptContext}
    Return strictly valid JSON matching the schema.
  `;

  let generatedData: any[] = [];
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }],
      config: { responseMimeType: "application/json", responseJsonSchema: z.toJSONSchema(GenerationResponseSchema) },
    });
    const parsed = JSON.parse(response.text!);
    generatedData = GenerationResponseSchema.parse(parsed).generated_ideas;
  } catch (e) {
    console.error("AI Error", e);
  }

  const updatedDeck = deck.map((card: any) => {
    const isWinner = winningIdeas.some((w: any) => w.id === card.id);
    if (isWinner) {
      const g = generatedData.find((x: any) => x.id === card.id);
      return {
        ...card,
        is_winner: true,
        features: g?.cool_features || [],
        risk: g?.risk || "N/A",
        pitch: g?.killer_pitch || "N/A"
      };
    }
    return { ...card, is_winner: false };
  });

  const { error } = await supabase
    .from("rooms")
    .update({
      game_data: { ...room.game_data, deck: updatedDeck },
      game_state: { ...room.game_state, phase: 4, is_generating: false } 
    })
    .eq("code", roomCode);

  if (error) return { error: "Failed to save" };

  revalidatePath(`/game/${roomCode}/phase2generation`);
  return { success: true };
}