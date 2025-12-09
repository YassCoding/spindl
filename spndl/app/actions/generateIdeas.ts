"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const IdeaSchema = z.object({
  title: z.string().describe("Catchy, modern startup name for the project."),
  description: z.string().describe("A concise 2-sentence pitch of what the app does."),
  tech_stack: z.array(z.string()).describe("List of specific technologies that might be used for this app (e.g. Next.js, Python, Supabase)."),
  time_estimate: z.string().describe("Estimated time string, e.g. '15 hours'."),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).describe("The difficulty tag based on skill overlap."),
});

const GenerationSchema = z.object({
  ideas: z.array(IdeaSchema),
});

export async function generateIdeas(roomCode: string) {
  const supabase = await createClient();
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

  const { data: room } = await supabase
    .from("rooms")
    .select("players, game_state")
    .eq("code", roomCode)
    .single();

  if (!room || !room.players) return { error: "Room not found" };

  if (room.game_state && room.game_state.phase >= 2) {
    return { success: true, message: "Round already started" };
  }
  
  if (room.game_state?.is_generating) {
    return { success: true, message: "Generation already in progress" };
  }

  await supabase
    .from("rooms")
    .update({ 
        game_state: { ...room.game_state, is_generating: true } 
    })
    .eq("code", roomCode);

  const players = room.players as any[];
  const playerCount = players.length;
  if (playerCount === 0) return { error: "No players in room" };

  const ideasPerUser = Math.ceil(40 / playerCount);

  const promptPromises = players.map(async (player: any) => {
    
    const randomTemp = 0.6 + Math.random() * 0.5;

    const userProfile = {
      skills: player.profile.skills || [],
      hobbies: player.profile.hobbies || [],
      interests: player.profile.role_interest || [],
      hours: player.profile.hours_per_week || 10,
      scale: player.profile.scale_preference_int || 5
    };

    const prompt = `
      You are an expert Hackathon Idea Generator. 
      Generate exactly ${ideasPerUser} distinct project ideas tailored for this specific developer.

      ### USER PROFILE
      - **Skills:** ${JSON.stringify(userProfile.skills)}
      - **Hobbies/Interests:** ${JSON.stringify(userProfile.hobbies)} + ${JSON.stringify(userProfile.interests)}
      - **Time Commitment:** ${userProfile.hours} hours/week
      - **Scale Preference (1-10):** ${userProfile.scale} (1=Tiny script, 10=Startup MVP)

      ### DATA CLEANING RULES (CRITICAL)
      - **Ignore Garbage:** If skills/hobbies contain nonsense (e.g., "eating", "sleeping", random keys), completely ignore them and default to "General Web Development".
      - **Sanitize:** Do not generate ideas based on offensive or non-technical joke entries.

      ### IDEA ARCHETYPES (CRITICAL)
      For each idea, randomly assign it one of these "Vibes" (ensure a diverse mix in the output):
      1. **Novel (20%):** An idea that feels fresh, innovative, or "never done before."
      2. **Corporate (B2B) (20%):** A serious, high-revenue SaaS or internal tool. Professional tone.
      3. **Goofy & Fun (20%):** A meme app, a party game, or something silly but technically impressive.
      4. **Useful (20%):** A high-utility life hack, productivity tool, or student aid.
      5. **Problem-Centric (20%):** Focuses purely on solving a painful, specific real-world itch or social issue.

      ### DIFFICULTY DISTRIBUTION
      Generate a mix of ideas based on "Skill Overlap" (how well the tech stack matches the user's current skills):
      
      1. **33% EASY (Low Skill Overlap):** - Tech Stack: Mostly NEW technologies the user DOES NOT know.
         - Goal: Pure learning / exploration.
      
      2. **33% MEDIUM (Medium Skill Overlap):**
         - Tech Stack: Mix of known skills and 1-2 new tech.
         - Goal: Balanced challenge.

      3. **33% HARD (High Skill Overlap):**
         - Tech Stack: Uses almost exclusively the user's EXISTING skills.
         - Goal: Execution speed and complexity (since they know the stack, the app logic should be harder).

      ### FORMAT
      Return strictly valid JSON matching the schema.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(GenerationSchema),
          temperature: randomTemp,
        },
      });

      const result = GenerationSchema.parse(JSON.parse(response.text!));
      return result.ideas;

    } catch (error) {
      console.error(`AI Generation failed for player ${player.name}:`, error);
      return [];
    }
  });

  const results = await Promise.all(promptPromises);
  const rawDeck = results.flat();
  
  const deck = rawDeck
    .map((idea) => ({
      ...idea,
      id: crypto.randomUUID(),
      status: "active"
    }))
    .sort(() => Math.random() - 0.5);

  const { error: updateError } = await supabase
    .from("rooms")
    .update({
      game_data: { deck: deck },
      game_state: { 
        phase: 2, 
        is_generating: false,
        r1_votes: { total_swipes: 0, map: {} }
      }
    })
    .eq("code", roomCode);

  if (updateError) {
    return { error: "Failed to save deck" };
  }

  revalidatePath(`/game/${roomCode}/generating`);
  revalidatePath(`/game/${roomCode}/round1`);

  return { success: true };
}