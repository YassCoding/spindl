"use client";

import { Crown, User, ChevronRight } from "lucide-react";  
import { motion } from "framer-motion";

interface PlayerCardProps {
  player: any;
  isHost: boolean;
  isMe: boolean;
  onClick: () => void;
}

export default function PlayerCard({ player, isHost, isMe, onClick }: PlayerCardProps) {
  
  const borderClass = isHost 
    ? "border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.15)]" 
    : isMe 
      ? "border-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
      : "border-white/10 hover:border-white/30";

  const bgClass = isMe ? "bg-white/5" : "bg-surface-dark/60";

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-xl border backdrop-blur-md transition-all duration-300 cursor-pointer overflow-hidden group p-4 ${borderClass} ${bgClass}`}
    >
      <div className="flex items-center gap-4">
        
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-full overflow-hidden border-2 bg-black/40 flex items-center justify-center ${isHost ? 'border-yellow-400' : 'border-white/20'}`}>
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <User className="text-white/50" size={20} />
            )}
          </div>
          {isHost && (
            <div className="absolute -top-2 -right-2 bg-black rounded-full p-1 border border-yellow-400 shadow-lg rotate-12 z-10">
              <Crown size={10} className="text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-base truncate ${isHost ? "text-yellow-100" : "text-white"}`}>
              {player.name}
            </h3>
            {isMe && (
              <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 truncate">
             {player.profile.role_interest?.[0] || "Creator"}
          </p>
        </div>

        <div className="text-white/20 group-hover:text-white transition-colors">
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </div>

      </div>
    </motion.div>
  );
}