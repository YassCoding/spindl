"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const handleLogin = async () => {
  const supabase = createClient()
  
  await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${location.origin}/auth/callback`, 
    },
  })
}

export default function GitHubLoginButton(){
    return (
        <button onClick={handleLogin} className="z-10 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-8 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary-light transition-all duration-300 border-2 border-primary-light/50 shadow-[0_0_20px_rgba(139,92,246,0.6),0_0_40px_rgba(167,139,250,0.4)] hover:shadow-[0_0_30px_rgba(167,139,250,0.8),0_0_50px_rgba(167,139,250,0.6)] group">
            <span className="truncate">Sign in with GitHub</span>
            <Image className="w-6 h-6 ml-2" src="./github_logo.svg" width={24} height={24} alt="Github Logo"/>
        </button>
    )
}