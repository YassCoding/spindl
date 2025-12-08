"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// Schema validation matching DB structure
const ProfileSchema = z.object({
  skills: z.array(z.object({
    skill: z.string(),
    experience_level: z.string() 
  })),
  hobbies: z.array(z.string()),
  role_interest: z.array(z.string()),
  hours_per_week: z.number().min(1).max(40),
});

export async function applyManualProfile(formData: any) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Validate input
  const validatedData = ProfileSchema.parse(formData);

  const { error } = await supabase
    .from("profiles")
    .update({
      skills: validatedData.skills,
      hobbies: validatedData.hobbies,
      role_interest: validatedData.role_interest,
      hours_per_week: validatedData.hours_per_week,
      onboarding_stage: 2, 
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update failed:", error);
    return { error: "Failed to save profile." };
  }

  // redirect to home
  redirect("/");
}