import { getRoomAndGuardPhase } from "@/lib/gameGuard";
import { createClient } from "@/lib/supabase/server";
import Phase2GenerationUI from "./Phase2GenerationUI";

export default async function Phase2GenerationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const room = await getRoomAndGuardPhase(code, "phase2generation");

  return (
    <Phase2GenerationUI 
      code={code} 
      room={room} 
      userId={user?.id || ""} 
    />
  );
}