"use client";

import { X, Briefcase, Heart, Clock, Crown } from "lucide-react";
import { motion } from "framer-motion";

interface PlayerDetailModalProps {
  player: any;
  onClose: () => void;
}

export default function PlayerDetailModal({ player, onClose }: PlayerDetailModalProps) {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-surface-dark border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="h-24 bg-gradient-to-r from-primary/20 to-purple-900/20" />

        <div className="px-8 pb-8 -mt-12">
          <div className="flex justify-between items-end">
             <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-surface-dark bg-black shadow-xl overflow-hidden">
                    <img 
                        src={player.avatar_url || "/default-avatar.png"} 
                        alt={player.name}
                        className="w-full h-full object-cover" 
                    />
                </div>
                {player.is_host && (
                    <div className="absolute -top-2 -right-2 bg-black p-1.5 rounded-full border border-yellow-400 shadow-lg">
                        <Crown size={16} className="text-yellow-400 fill-yellow-400" />
                    </div>
                )}
             </div>
             
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
             >
                <X size={20} />
             </button>
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-serif font-bold text-white">{player.name}</h2>
            <p className="text-white/40 text-sm flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                {player.profile.hours_per_week || 0} hours/week commitment
            </p>
          </div>

          <div className="mt-8 space-y-6">
            
            <div>
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">Top Skills</h3>
                <div className="flex flex-wrap gap-2">
                    {player.profile.skills?.map((s: any, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 shadow-sm">
                            {s.skill} <span className="text-white/30 text-[10px] ml-1 uppercase">{s.experience_level}</span>
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase size={12} /> Roles & Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                    {player.profile.role_interest?.map((role: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
                            {role}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Heart size={12} /> Hobbies
                </h3>
                <div className="flex flex-wrap gap-2">
                    {player.profile.hobbies?.map((hobby: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-200">
                            {hobby}
                        </span>
                    ))}
                </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}