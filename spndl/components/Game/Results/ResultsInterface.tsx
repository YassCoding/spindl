"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Trophy, Crown, Medal, Loader2, MousePointerClick } from "lucide-react";
import { useRouter } from "next/navigation";
import { archiveGame } from "@/app/actions/archiveGame";
import WinnerCardModal from "./WinnerCardModal";

interface ResultsProps {
  roomCode: string;
  isHost: boolean;
  winners: any[]; 
}

export default function ResultsInterface({ roomCode, isHost, winners }: ResultsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<any>(null); // Track selected idea

  // Room Deletion Listener
  useEffect(() => {
    const channel = supabase.channel(`room:${roomCode}`)
      .on("postgres_changes", 
        { event: "DELETE", schema: "public", table: "rooms", filter: `code=eq.${roomCode}` },
        () => router.push("/homepage")
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomCode, router, supabase]);

  const handleGoHome = async () => {
    if (isHost) {
        setIsCleaningUp(true);
        await archiveGame(roomCode);
        router.push("/homepage");
    } else {
        router.push("/homepage");
    }
  };

  const first = winners[0];
  const second = winners[1];
  const third = winners[2];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background-dark relative overflow-hidden p-6">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12 text-center"
        >
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200 mb-2">
                The Winners
            </h1>
            <p className="text-white/50 flex items-center justify-center gap-2">
                <MousePointerClick size={16} /> Click any podium to view details
            </p>
        </motion.div>

        {/* PODIUM CONTAINER */}
        <div className="flex items-end justify-center gap-4 sm:gap-8 w-full h-[400px] mb-12">
            
            {second && (
                <PodiumColumn 
                    idea={second} rank={2} height="h-[60%]" delay={0.4} 
                    color="bg-slate-300" icon={<Medal className="text-slate-500" size={32} />}
                    onClick={() => setSelectedWinner(second)}
                />
            )}

            {first && (
                <PodiumColumn 
                    idea={first} rank={1} height="h-[85%]" delay={0.8} 
                    color="bg-yellow-400" icon={<Crown className="text-yellow-700 fill-yellow-700" size={48} />}
                    isWinner
                    onClick={() => setSelectedWinner(first)}
                />
            )}

            {third && (
                <PodiumColumn 
                    idea={third} rank={3} height="h-[45%]" delay={0.6} 
                    color="bg-amber-700" icon={<Trophy className="text-amber-900" size={28} />}
                    onClick={() => setSelectedWinner(third)}
                />
            )}

        </div>

        <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
            onClick={handleGoHome}
            disabled={isCleaningUp}
            className="group relative px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-lg flex items-center gap-3 transition-all"
        >
            {isCleaningUp ? <Loader2 className="animate-spin" /> : <Home className="group-hover:-translate-y-0.5 transition-transform" />}
            {isHost ? "Archive & Return Home" : "Return Home"}
        </motion.button>

      </div>

      {/* MODAL POPUP */}
      <AnimatePresence>
        {selectedWinner && (
            <WinnerCardModal 
                idea={selectedWinner} 
                onClose={() => setSelectedWinner(null)} 
            />
        )}
      </AnimatePresence>

    </div>
  );
}

function PodiumColumn({ idea, rank, height, delay, color, icon, isWinner = false, onClick }: any) {
    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "100%", opacity: 1 }}
            transition={{ duration: 0.8, delay, type: "spring", bounce: 0.3 }}
            onClick={onClick}
            className={`flex flex-col justify-end w-1/3 max-w-[200px] h-full group cursor-pointer`}
        >
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.6 }}
                className="mb-4 text-center group-hover:scale-105 transition-transform"
            >
                <div className={`font-serif font-bold text-white mb-1 leading-tight ${isWinner ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
                    {idea.title}
                </div>
                {isWinner && (
                     <span className="text-yellow-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Champion</span>
                )}
            </motion.div>

            <div className={`w-full ${height} rounded-t-2xl relative transition-all duration-300 group-hover:brightness-110 ${isWinner ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-[0_0_30px_rgba(250,204,21,0.2)]' : 'bg-surface-dark border border-white/10 bg-white/5 hover:bg-white/10'}`}>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    {icon}
                    <span className={`text-4xl font-black ${isWinner ? 'text-yellow-800' : 'text-white/20'}`}>
                        {rank}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}