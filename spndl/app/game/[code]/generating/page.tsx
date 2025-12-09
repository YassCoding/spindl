import { getRoomAndGuardPhase } from "@/lib/gameGuard";
import { createClient } from "@/lib/supabase/server";
import GenerationUI from "./GenerationUI";

export default async function GeneratingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const room = await getRoomAndGuardPhase(code, "generating");

  return (
    <GenerationUI 
      code={code} 
      room={room} 
      userId={user?.id || ""} 
    />
  );
}