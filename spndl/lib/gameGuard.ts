import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const PHASE_MAP: Record<number, string> = {
    0: "lobby",       
    1: "generating",   
    2: "round1",      
    3: "phase2generation", 
    4: "round2",
    5: "results"
};

export async function getRoomAndGuardPhase(code: string, currentPhaseName: string) {
    const supabase = await createClient();

    const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code)
        .single();

    if (!room) redirect("/homepage");

    const dbPhase = room.game_state?.phase || 0;
    const expectedPage = PHASE_MAP[dbPhase];

    if (!expectedPage) {
        console.warn(`Phase ${dbPhase} not handled in routing map.`);
        return room; 
    }

    if (expectedPage !== currentPhaseName) {
        if (expectedPage === "lobby") {
            redirect(`/lobby/${code}`);
        } else {
            redirect(`/game/${code}/${expectedPage}`);
        }
    }

    return room;
}