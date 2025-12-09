"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { generateIdeas } from "@/app/actions/generateIdeas";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function GenerationUI({ code, room, userId }: any) {
  const [status, setStatus] = useState("Initializing Loom...");
  const hasTriggeredRef = useRef(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRedirect = () => {
     router.refresh();
     router.replace(`/game/${code}/round1`);
  };

  useEffect(() => {
    if (room.game_state && room.game_state.phase >= 2) {
        handleRedirect();
        return;
    }

    if (room.game_state?.is_generating) {
        setStatus("Resume: Weaving Project Threads...");
    }

    const channel = supabase.channel(`room:${code}`)
      .on("postgres_changes", 
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          if (payload.new.game_state?.phase >= 2) {
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
        
        if (data && data.game_state?.phase >= 2) {
            handleRedirect();
        }
    }, 3000);

    if (room.host_id === userId) {
        if(room.game_state.phase === 1 && !room.game_state.is_generating && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            
            const run = async () => {
                setStatus("Weaving Project Threads...");
                const result = await generateIdeas(code);
                if (result?.success) {
                   handleRedirect();
                }
            };
            run();
        }
    } else {
        if (!room.game_state?.is_generating) setStatus("Waiting for Host...");
        else setStatus("Host is weaving the threads...");
    }

    return () => { 
        supabase.removeChannel(channel); 
        clearInterval(interval);
    };
  }, [code, room, userId, router, supabase]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background-dark text-white relative overflow-hidden font-display">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background-dark to-background-dark animate-pulse" />
      <div className="z-10 flex flex-col items-center gap-6 text-center max-w-md px-6">
        <div className="relative">
            <div className="absolute -inset-4 bg-primary/50 blur-xl rounded-full animate-pulse" />
            <Sparkles className="w-16 h-16 text-primary-light relative z-10 animate-spin-slow" />
        </div>
        <h1 className="text-3xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Constructing the Deck
        </h1>
        <div className="space-y-2">
          <p className="text-lg text-primary-light font-medium">{status}</p>
          <p className="text-sm text-white/30">
            AI is weaving threads...
          </p>
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
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>
      </div>
    </div>
  );
}