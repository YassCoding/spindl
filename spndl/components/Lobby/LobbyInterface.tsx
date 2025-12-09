"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Play, LogOut } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import PlayerCard from "./PlayerCard";
import PlayerDetailModal from "./PlayerDetailModal"; 
import { updatePlayerScale, startGame, leaveLobby } from "@/app/actions/createJoinGame";

export default function LobbyInterface({ initialRoom, currentUser }: { initialRoom: any, currentUser: any }) {
  const [room, setRoom] = useState(initialRoom);
  
  const myProfile = initialRoom.players.find((p: any) => p.id === currentUser.id)?.profile;
  const [myScale, setMyScale] = useState(myProfile?.scale_preference_int || 5);
  
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null); 
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  const isHost = room.host_id === currentUser.id;

  // Realtime
  useEffect(() => {
    const channel = supabase.channel(`room:${room.code}`)
      .on("postgres_changes", 
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${room.code}` },
        (payload) => {
          setRoom(payload.new);
          if (payload.new.game_state?.phase > 0) {
             router.push(`/game/${room.code}/generating`);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room.code, supabase, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePlayerScale(room.code, myScale);
    }, 500);
    return () => clearTimeout(timer);
  }, [myScale, room.code]);

  const handleLeave = async () => {
    if(confirm("Are you sure you want to leave?")) {
        setIsLeaving(true);
        await leaveLobby(room.code);
    }
  }

  return (
    <>
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full min-h-[80vh] px-4 relative">
        
        <div className="relative text-center mb-12 pt-12">
          
          <button 
              onClick={handleLeave}
              disabled={isLeaving}
              className="absolute right-0 top-0 sm:top-12 flex items-center gap-2 text-xs font-bold text-red-100 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-4 py-2 rounded-lg transition-all"
          >
              <LogOut size={14} />
              {isLeaving ? "Leaving..." : "Leave Lobby"}
          </button>
  
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/50 mb-4">
            LOBBY
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-2 tracking-tight">
            {room.code}
          </h1>
          <p className="text-white/40">Waiting for new users...</p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-48">
          {room.players.map((player: any) => (
            <PlayerCard 
              key={player.id} 
              player={player} 
              isHost={player.id === room.host_id}
              isMe={player.id === currentUser.id}
              onClick={() => setSelectedPlayer(player)} // Open Modal
            />
          ))}
          
          {[...Array(Math.max(0, 3 - room.players.length))].map((_, i) => (
             <div key={`empty-${i}`} className="h-20 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/10 text-sm border-dashed">
                Open Slot
             </div>
          ))}
        </div>
  
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-40">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
              
              <div className="w-full bg-surface-dark border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-end mb-4">
                      <span className="text-white font-bold text-sm">Project Scale Preference</span>
                  </div>
                  <input 
                      type="range" min="1" max="10" value={myScale} 
                      onChange={(e) => setMyScale(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 mt-2 uppercase font-bold tracking-wider">
                      <span>Small Script</span>
                      <span>Large Startup</span>
                  </div>
              </div>
  
              {isHost ? (
                  <button 
                      onClick={() => { setIsStarting(true); startGame(room.code); }}
                      disabled={isStarting}
                      className="w-full py-4 bg-primary hover:bg-primary-light text-white font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                      {isStarting ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" size={20}/>}
                      Start Game
                  </button>
              ) : (
                  <div className="text-center text-white/30 text-sm animate-pulse pb-4">
                      Waiting for new members...
                  </div>
              )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedPlayer && (
            <PlayerDetailModal 
                player={selectedPlayer} 
                onClose={() => setSelectedPlayer(null)} 
            />
        )}
      </AnimatePresence>
    </>
  );
}