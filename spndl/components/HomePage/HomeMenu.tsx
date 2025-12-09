"use client";

import { useState } from "react";
import { Loader2, ArrowRight, History, Gamepad2 } from "lucide-react";
import { createLobby, joinLobby } from "@/app/actions/createJoinGame";
import Link from "next/link";

export default function HomeMenu({ currentRoom }: { currentRoom?: string | null }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    const res = await createLobby();
    if (res?.error) {
      setError(res.error);
      setIsCreating(false);
    }
  };

  const handleJoin = async (formData: FormData) => {
    setIsJoining(true);
    setError(null);
    const res = await joinLobby(formData);
    if (res?.error) {
      setError(res.error);
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md relative z-10">
      
      {currentRoom && (
        <div className="w-full p-4 rounded-2xl bg-primary/20 border border-primary/50 flex items-center justify-between mb-4 animate-in slide-in-from-top-4">
          <div>
            <p className="text-primary-light text-xs font-bold uppercase tracking-wider">Active Session</p>
            <p className="text-white text-sm">You are in room <span className="font-mono text-primary-light">{currentRoom}</span></p>
          </div>
          <Link 
            href={`/lobby/${currentRoom}`}
            className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-sm font-bold rounded-lg transition-colors"
          >
            Rejoin
          </Link>
        </div>
      )}

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
        <div className="relative flex flex-col gap-4 p-6 bg-surface-dark/90 backdrop-blur-xl border border-white/10 rounded-2xl">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Gamepad2 className="text-primary-light" size={20}/> 
                Join a Game
            </h2>
            
            <form action={handleJoin} className="flex flex-col gap-3">
                <input 
                    name="roomCode"
                    type="text" 
                    placeholder="Enter Game Code (eg dj29d2)" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono uppercase"
                    maxLength={6}
                    required
                />
                <button 
                    disabled={isJoining}
                    className="w-full py-3 bg-white/10 hover:bg-primary text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isJoining ? <Loader2 className="animate-spin" /> : "Join Game"}
                </button>
            </form>
            
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>
      </div>

      <button 
        onClick={handleCreate}
        disabled={isCreating}
        className="group relative w-full py-5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-light hover:to-purple-500 text-white text-lg font-bold rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed border border-white/10"
      >
        <span className="flex items-center justify-center gap-3">
            {isCreating ? <Loader2 className="animate-spin" /> : (
                <>
                    Create New Game
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
            )}
        </span>
      </button>
{/*
      <Link href="/gallery" className="text-white/40 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors py-2">
        <History size={16}/> View Past Games
      </Link>
*/}
    </div>
  );
}