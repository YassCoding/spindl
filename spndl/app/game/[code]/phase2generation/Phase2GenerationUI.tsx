"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { generatePhase2 } from "@/app/actions/phase2generation";
import { Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Phase2GenerationUI({ code, room, userId }: any) {
  const [status, setStatus] = useState("Preparing Analysis...");
  const hasTriggeredRef = useRef(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRedirect = () => {
     router.refresh();
     router.replace(`/game/${code}/round2`);
  };

  useEffect(() => {
    if (room.game_state?.phase >= 4) {
        handleRedirect();
        return;
    }

    if (room.game_state?.is_generating) {
        setStatus("Resume: Calculating Winners...");
    }

    const channel = supabase.channel(`room:${code}`)
      .on("postgres_changes", 
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          if (payload.new.game_state?.phase >= 4) {
             handleRedirect();
          }
        }
      ).subscribe();

    const interval = setInterval(async () => {
        const { data } = await supabase
            .from("rooms")
            .select("game_state")
            .eq("code", code)
            .single();
        
        if (data && data.game_state?.phase >= 4) {
            handleRedirect();
        }
    }, 3000);

    if (room.host_id === userId) {
        if(!room.game_state?.is_generating && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            
            const run = async () => {
                setStatus("Calculating Winners...");
                await new Promise(r => setTimeout(r, 1500)); 
                setStatus("Generating Pitches (Gemini)...");
                
                const result = await generatePhase2(code);
                
                if (result?.success) {
                   handleRedirect();
                }
            };
            run();
        }
    } else {
        if (!room.game_state?.is_generating) {
            setStatus("Waiting for Host...");
        } else {
            setStatus("Host is evolving the winners...");
        }
    }

    return () => { 
        supabase.removeChannel(channel); 
        clearInterval(interval);
    };
  }, [code, room, userId, router, supabase]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background-dark text-white relative overflow-hidden font-display">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-background-dark to-background-dark animate-pulse" />
      <div className="z-10 flex flex-col items-center gap-6 text-center max-w-md px-6">
        <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/50 blur-xl rounded-full animate-pulse" />
            <Zap className="w-16 h-16 text-blue-300 relative z-10 animate-bounce" />
        </div>
        <h1 className="text-3xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">Phase 2 Generation</h1>
        <div className="space-y-2">
          <p className="text-lg text-blue-200 font-medium flex items-center justify-center gap-2">{status} <Loader2 className="w-4 h-4 animate-spin" /></p>
          <p className="text-sm text-white/30">Selecting the Winning 8 and generating risks...</p>
        </div>
        
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mt-4 relative">
          <motion.div 
            initial={{ x: "-100%" }} 
            animate={{ x: "200%" }} 
            transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: "easeInOut" 
            }} 
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" 
          />
        </div>
      </div>
    </div>
  );
}