"use client";

import { Clock, Code2 } from "lucide-react";
import { motion } from "framer-motion";  

interface Idea {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  time_estimate: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface SwipeCardProps {
  idea: Idea;
}

export default function SwipeCard({ idea }: SwipeCardProps) {
  
  const diffColor = {
    Easy: "bg-green-500/20 text-green-300 border-green-500/30",
    Medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Hard: "bg-red-500/20 text-red-300 border-red-500/30"
  }[idea.difficulty] || "bg-white/10 text-white";

  return (
    <div className="w-full h-full bg-surface-dark border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col relative overflow-hidden">
      
      <div className="flex-grow overflow-y-auto pr-2 space-y-6 custom-scrollbar">
        
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${diffColor}`}>
            {idea.difficulty}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white/60 flex items-center gap-1">
            <Clock size={12} /> {idea.time_estimate}
          </span>
        </div>

        <div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight mb-4">
            {idea.title}
            </h2>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
            {idea.description}
            </p>
        </div>

        <div className="h-px w-full bg-white/10" />
        
        <div>
          <p className="text-xs uppercase font-bold text-white/30 mb-3 flex items-center gap-2">
            <Code2 size={14}/> Recommended Stack
          </p>
          <div className="flex flex-wrap gap-2">
            {idea.tech_stack.map((tech, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary-light text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface-dark to-transparent pointer-events-none rounded-b-3xl" />
    </div>
  );
}