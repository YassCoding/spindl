"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Coins, AlertTriangle, Zap, Clock, Code2, CheckCircle } from "lucide-react";
import { placeToken, checkRoundCompletion } from "@/app/actions/placeToken";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TokenVotingProps {
  roomCode: string;
  userId: string;
  winners: any[];
  allocations: Record<string, string[]>;
  playerCount: number;
}

export default function TokenVotingInterface({ roomCode, userId, winners, allocations, playerCount }: TokenVotingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tokensLeft, setTokensLeft] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let used = 0;
    Object.values(allocations).forEach((users) => {
      used += users.filter(u => u === userId).length;
    });
    setTokensLeft(2 - used);
    
    let totalUsed = 0;
    Object.values(allocations).forEach(users => totalUsed += users.length);
    if (totalUsed >= playerCount * 2) {
       checkRoundCompletion(roomCode, playerCount);
    }
  }, [allocations, userId, playerCount, roomCode]);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomCode}`)
      .on("postgres_changes", 
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${roomCode}` },
        (payload) => {
           if (payload.new.game_state.phase >= 5) {
               router.push(`/game/${roomCode}/results`);
           }
           router.refresh();
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomCode, router, supabase]);

  const handleTokenAction = async (action: "ADD" | "REMOVE") => {
    if (isSubmitting) return;
    const card = winners[currentIndex];
    
    if (action === "ADD" && tokensLeft <= 0) {
        toast.error("No tokens left!");
        return;
    }
    
    setIsSubmitting(true);
    const res = await placeToken(roomCode, card.id, action);
    setIsSubmitting(false);

    if (res?.error) {
        toast.error(res.error);
    } else {
        toast.success(action === "ADD" ? "Token Invested" : "Token Removed");
    }
  };

  const nextCard = () => setCurrentIndex((prev) => (prev + 1) % winners.length);
  const prevCard = () => setCurrentIndex((prev) => (prev - 1 + winners.length) % winners.length);

  const currentCard = winners[currentIndex];
  const currentCardTokens = allocations[currentCard.id] || [];
  const myInvestmentsInCard = currentCardTokens.filter(u => u === userId).length;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden relative">
      
      <div className="w-full p-6 flex justify-between items-start z-10">
         <div>
            <h1 className="text-2xl font-serif font-bold text-white">Final Round</h1>
            <p className="text-white/50 text-sm">Invest in the best ideas.</p>
         </div>
         <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
                <Coins size={16} className="text-yellow-400" />
                <span className="font-bold text-yellow-100">{tokensLeft} Left</span>
            </div>
         </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center relative px-4 sm:px-12 pb-10">
        
        <button onClick={prevCard} className="absolute left-2 sm:left-8 z-20 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors top-1/2 -translate-y-1/2">
            <ChevronLeft size={32} />
        </button>
        
        <button onClick={nextCard} className="absolute right-2 sm:right-8 z-20 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors top-1/2 -translate-y-1/2">
            <ChevronRight size={32} />
        </button>

        <div className="w-full max-w-4xl h-[60vh] relative mb-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentCard.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full bg-surface-dark border border-white/10 rounded-3xl overflow-y-auto custom-scrollbar relative shadow-2xl"
                >
                    <div className="absolute top-6 right-6 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <Coins size={14} className="text-yellow-400" />
                        <span className="font-mono font-bold text-white">{currentCardTokens.length}</span>
                    </div>

                    <div className="p-8 sm:p-10 space-y-6">
                        
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2.5 py-1 rounded text-xs font-bold uppercase border border-white/10 bg-white/5 text-white/60">
                                    {currentCard.difficulty}
                                </span>
                                <span className="px-2.5 py-1 rounded text-xs font-bold uppercase border border-white/10 bg-white/5 text-white/60 flex items-center gap-1">
                                    <Clock size={12} /> {currentCard.time_estimate}
                                </span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight mb-4">
                                {currentCard.title}
                            </h2>
                            <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                                {currentCard.description}
                            </p>
                        </div>

                        {currentCard.pitch && (
                            <div className="p-5 bg-primary/10 border-l-4 border-primary rounded-r-xl italic text-base sm:text-lg text-primary-light">
                                "{currentCard.pitch}"
                            </div>
                        )}

                        <div className="w-full h-px bg-white/10" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold uppercase text-white/40 mb-3 flex items-center gap-2">
                                    <Zap size={14} /> Key Features
                                </h3>
                                <ul className="space-y-3">
                                    {currentCard.features?.map((f: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-white/90">
                                            <CheckCircle size={16} className="mt-0.5 text-green-400/70 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-6">
                                {currentCard.risk && (
                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                                        <h3 className="text-xs font-bold uppercase text-red-400 mb-2 flex items-center gap-2">
                                            <AlertTriangle size={14} /> Major Risk
                                        </h3>
                                        <p className="text-sm text-red-100">{currentCard.risk}</p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-bold uppercase text-white/40 mb-3 flex items-center gap-2">
                                        <Code2 size={14} /> Tech Stack
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {currentCard.tech_stack?.map((t: string, i: number) => (
                                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>

        <div className="flex gap-4 z-30">
            {myInvestmentsInCard > 0 && (
                <button 
                    onClick={() => handleTokenAction("REMOVE")}
                    disabled={isSubmitting}
                    className="px-6 py-4 rounded-xl border border-white/10 bg-surface-dark hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200 text-white/60 font-bold text-base transition-all shadow-lg"
                >
                    Remove Token
                </button>
            )}

            {tokensLeft > 0 ? (
                    <button 
                    onClick={() => handleTokenAction("ADD")}
                    disabled={isSubmitting}
                    className="px-10 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all flex items-center gap-2 transform hover:scale-105"
                    >
                    <Coins size={20} fill="black" />
                    Invest Token
                    </button>
            ) : (
                    <div className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-white/30 font-bold text-base cursor-not-allowed">
                    No Tokens Left
                    </div>
            )}
        </div>

      </div>
    </div>
  );
}