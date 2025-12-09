"use client";

import { motion } from "framer-motion";
import { X, Clock, Zap, AlertTriangle, Code2, CheckCircle, Coins } from "lucide-react";

export default function WinnerCardModal({ idea, onClose }: { idea: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl h-[70vh] bg-surface-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white/50 hover:text-white rounded-full transition-colors"
        >
            <X size={24} />
        </button>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-8 sm:p-10 space-y-6">
            
            <div className="max-w-3xl pr-12">
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded text-xs font-bold uppercase border border-white/10 bg-white/5 text-white/60">
                        {idea.difficulty || "Medium"}
                    </span>
                    <span className="px-2.5 py-1 rounded text-xs font-bold uppercase border border-white/10 bg-white/5 text-white/60 flex items-center gap-1">
                        <Clock size={12} /> {idea.time_estimate || "10h"}
                    </span>
                    <span className="px-2.5 py-1 rounded text-xs font-bold uppercase border border-yellow-500/20 bg-yellow-500/10 text-yellow-200 flex items-center gap-1">
                        <Coins size={12} /> {idea.score} Tokens
                    </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight mb-4">
                    {idea.title}
                </h2>
                <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                    {idea.description}
                </p>
            </div>

            {idea.pitch && (
                <div className="p-5 bg-primary/10 border-l-4 border-primary rounded-r-xl italic text-base sm:text-lg text-primary-light">
                    &quot;{idea.pitch}&quot;
                </div>
            )}

            <div className="w-full h-px bg-white/10" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xs font-bold uppercase text-white/40 mb-3 flex items-center gap-2">
                        <Zap size={14} /> Key Features
                    </h3>
                    <ul className="space-y-3">
                        {idea.features?.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-white/90">
                                <CheckCircle size={16} className="mt-0.5 text-green-400/70 shrink-0" />
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-6">
                    {idea.risk && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                            <h3 className="text-xs font-bold uppercase text-red-400 mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} /> Major Risk
                            </h3>
                            <p className="text-sm text-red-100">{idea.risk}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xs font-bold uppercase text-white/40 mb-3 flex items-center gap-2">
                            <Code2 size={14} /> Tech Stack
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {idea.tech_stack?.map((t: string, i: number) => (
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
    </div>
  );
}