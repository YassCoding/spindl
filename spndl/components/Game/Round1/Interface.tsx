"use client";

import { useState, useEffect } from "react";
import { X, Heart, Star, FastForward, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import SwipeCard from "./SwipeCard";
import { toast } from "sonner"; 
import { useRouter } from "next/navigation";
import { triggerPhase3Transition } from "@/app/actions/phase2generation"; 

interface Round1Props {
  roomCode: string;
  userId: string;
  deck: any[];
  initialVotes?: any;
  playerCount: number;
  isHost: boolean;
}

export default function Round1Interface({ roomCode, userId, deck, initialVotes, playerCount, isHost }: Round1Props) {
  const supabase = createClient();
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | "up" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasUsedSuperLike, setHasUsedSuperLike] = useState(false);
  
  const [totalSwipes, setTotalSwipes] = useState(initialVotes?.total_swipes || 0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalPossibleSwipes = deck.length * playerCount;
  const swipesLeft = Math.max(0, totalPossibleSwipes - totalSwipes);
  const globalProgress = Math.min(100, (totalSwipes / totalPossibleSwipes) * 100);
  const currentCard = deck[currentIndex];

  useEffect(() => {
    if (initialVotes && initialVotes.map) {
        const firstUnvoted = deck.findIndex(card => {
           const cardVotes = initialVotes.map[card.id];
           return !(cardVotes && cardVotes[userId] !== undefined); 
        });
        setCurrentIndex(firstUnvoted === -1 ? deck.length : firstUnvoted);

        const used = Object.values(initialVotes.map).some((cardVotes: any) => 
            cardVotes[userId] === 2
        );
        if (used) setHasUsedSuperLike(true);
    }
  }, []);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomCode}`)
      .on("postgres_changes", 
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${roomCode}` },
        (payload) => {
           const newState = payload.new.game_state;
           
           if (newState.r1_votes?.total_swipes !== undefined) {
              setTotalSwipes(newState.r1_votes.total_swipes);
           }

           if (newState.phase >= 3) {
              router.refresh();
              router.push(`/game/${roomCode}/phase2generation`);
           }
        }
      ).subscribe();

    
    const interval = setInterval(async () => {
        const { data } = await supabase
            .from("rooms")
            .select("game_state")
            .eq("code", roomCode)
            .single();
        
        if (data?.game_state) {
            if (data.game_state.r1_votes?.total_swipes !== undefined) {
                setTotalSwipes(data.game_state.r1_votes.total_swipes);
            }
            if (data.game_state.phase >= 3) {
                router.refresh();
                router.push(`/game/${roomCode}/phase2generation`);
            }
        }
    }, 4000);

    return () => { 
        supabase.removeChannel(channel); 
        clearInterval(interval);
    };
  }, [roomCode, router, supabase]);

  useEffect(() => {
    if (isHost && !isTransitioning) {
        if (totalSwipes >= totalPossibleSwipes) {
            handleForceNext();
        }
    }
  }, [totalSwipes, isHost, isTransitioning, totalPossibleSwipes]);

  const handleVote = async (dir: "left" | "right" | "up") => {
    if (dir === "up" && hasUsedSuperLike) return;
    if (currentIndex >= deck.length || isAnimating) return;

    setIsAnimating(true);
    if (dir === "up") setHasUsedSuperLike(true);

    const card = deck[currentIndex];
    setExitDirection(dir);

    await new Promise(r => setTimeout(r, 200));

    const prevIndex = currentIndex;
    setCurrentIndex((prev) => prev + 1);
    setTotalSwipes((prev: number) => prev + 1); 

    setExitDirection(null);
    setIsAnimating(false); 

    const weight = dir === "right" ? 1 : dir === "up" ? 2 : 0;
    
    const { error } = await supabase.rpc("cast_vote", {
        room_code: roomCode,
        card_id: card.id,
        user_id: userId,
        vote_weight: weight
    });

    if (error) {
        console.error("Vote failed:", error);
        if (error.message.includes("SUPER_LIKE_USED") || dir === "up") {            
            if (dir === "up") setHasUsedSuperLike(false);
            setCurrentIndex(prevIndex); 
            setTotalSwipes((prev: number) => prev - 1);
        } else {
             toast.error("Vote failed to submit");
        }
    }
  };

  const handleForceNext = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    toast.info("Wrapping up the round...");
    
    const result = await triggerPhase3Transition(roomCode);
    if(result?.error) {
        toast.error(result.error);
        setIsTransitioning(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative pb-10">
      
      <div className="text-center mb-6 pt-4">
        <h1 className="text-3xl font-serif font-bold text-white">Speed Filter</h1>
        {currentCard ? (
          <p className="text-white/50 text-sm mt-1">
            Idea {Math.min(currentIndex + 1, deck.length)} of {deck.length}
          </p>
        ) : (
          <p className="text-green-400 text-sm mt-1 font-bold animate-pulse">
            Waiting for others...
          </p>
        )}
      </div>

      <div className="relative flex-grow w-full h-[60vh]">
        <AnimatePresence mode="popLayout">
          {currentCard ? (
            <motion.div
              key={currentCard.id}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ 
                x: exitDirection === "left" ? -200 : exitDirection === "right" ? 200 : 0,
                y: exitDirection === "up" ? -200 : 0,
                opacity: 0, 
                rotate: exitDirection === "left" ? -10 : exitDirection === "right" ? 10 : 0 
              }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-20"
            >
              <SwipeCard idea={currentCard} />
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-3xl bg-white/5 backdrop-blur-md animate-in fade-in space-y-8">
                
                <div>
                  <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                     <Heart size={32} fill="currentColor" />
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-2">You&apos;re done!</h2>
                  <p className="text-white/50 text-sm">
                     Waiting for the rest of the crew...
                  </p>
                </div>

                <div className="w-full space-y-2">
                   <div className="flex justify-between text-xs uppercase font-bold tracking-wider text-white/40">
                      <span>Total Swipes</span>
                      <span>{totalSwipes} / {totalPossibleSwipes}</span>
                   </div>
                   <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${globalProgress}%` }}
                          className="h-full bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                      />
                   </div>
                </div>

                {isHost && (
                  <button
                      onClick={handleForceNext}
                      disabled={isTransitioning}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 group"
                  >
                      {isTransitioning ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <FastForward size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      )}
                      Force Next Round
                  </button>
                )}

            </div>
          )}
        </AnimatePresence>

        {currentCard && deck[currentIndex + 1] && (
            <div className="absolute inset-0 z-10 scale-[0.98] translate-y-3 opacity-50 pointer-events-none">
                <SwipeCard idea={deck[currentIndex + 1]} />
            </div>
        )}
      </div>

      {currentCard && (
        <div className="flex justify-center items-center gap-6 mt-8">
            <button 
                disabled={isAnimating}
                onClick={() => handleVote("left")}
                className="group w-16 h-16 rounded-full bg-surface-dark/60 backdrop-blur-md border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
                <X size={28} className="group-hover:scale-110 transition-transform"/>
            </button>
            
            <button 
                disabled={isAnimating || hasUsedSuperLike}
                onClick={() => handleVote("up")}
                className={`group w-14 h-14 rounded-full bg-surface-dark/60 backdrop-blur-md border border-blue-500/30 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] active:scale-95 -mt-6 disabled:opacity-30 disabled:scale-100 ${hasUsedSuperLike ? 'opacity-30 cursor-not-allowed border-white/10 text-white/20' : ''}`}
            >
                <Star size={24} fill={hasUsedSuperLike ? "none" : "currentColor"} className="group-hover:scale-110 transition-transform"/>
            </button>

            <button 
                disabled={isAnimating}
                onClick={() => handleVote("right")}
                className="group w-16 h-16 rounded-full bg-surface-dark/60 backdrop-blur-md border border-green-500/30 text-green-400 flex items-center justify-center hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
                <Heart size={28} fill="currentColor" className="group-hover:scale-110 transition-transform"/>
            </button>
        </div>
      )}

    </div>
  );
}