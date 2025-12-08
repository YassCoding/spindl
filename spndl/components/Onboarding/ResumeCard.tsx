"use client";

import { useState, useRef } from "react";
import { FileTextIcon, Loader2 } from "lucide-react";
import { ArrowUpRightIcon } from "lucide-react";
import { useEffect } from "react";
import { resumeExtractor } from "@/app/actions/resumeExtractor";
import { useRouter } from "next/navigation";

export default function SkillsCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter()

  useEffect(() => {
    // We attach the listener to the window so it tracks movement 
    // across the entire page, not just the card.
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      
      // Calculate position relative to the card's top-left corner
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    // Cleanup listener on component unmount
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 3. Trigger the hidden input when user clicks the cool button
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 4. Handle the actual file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("pdfFile", file);

      // Call the Server Action
      const response = await resumeExtractor(formData);

      if (response?.error) {
        setError(response.error);
      } 
      else {
        router.push("/onboarding/manualprofilefill")
      }
    } 
    catch (err) {
      setError("Something went wrong uploading the file.");
    } 
    finally {
      setIsUploading(false);
      // Clear the input so they can select the same file again if they want
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative w-full max-w-2xl group">
      {/* LAYER 1: The "Shadow" Glow 
        - Creates the ambient light behind the card.
        - Has -inset-4 (sticks out further) and blur-2xl to look like a shadow.
      */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-50 blur-2xl transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.3), transparent 40%)`,
        }}
      />

      {/* LAYER 2: The Sharp Border 
        - Creates the defined edge line.
        - Has -inset-[1px] (just barely larger than content) to act as a border.
      */}
      <div
        className="absolute -inset-[2.5px] rounded-3xl opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.6), transparent 40%)`,
        }}
      />

      {/* LAYER 3: Main Content 
        - The solid card sitting on top.
        - bg-surface-dark ensures the text is readable.
      */}
      <div 
        ref={cardRef}
        className="relative flex flex-col items-center justify-center w-full p-12 bg-surface-dark/95 backdrop-blur-md rounded-3xl border border-white/5"
      >
        <h1 className="text-white font-serif text-4xl sm:text-5xl font-bold mb-10 tracking-tight text-center">
          Let’s Add Your Skills.
        </h1>

        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden" 
        />

        <button 
          onClick={handleButtonClick}
          disabled={isUploading}
          className="group relative flex items-center gap-3 px-8 py-4 mb-6 bg-primary/80 hover:bg-primary text-white rounded-full text-lg font-semibold transition-all duration-300 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] border border-primary-light/50 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">

          {isUploading ? (
            // Loading State UI
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Analyzing Resume...</span>
            </>
          ) : (
            // Default UI
            <>
              <FileTextIcon className="w-6 h-6" />
              <span>Upload Resume to Auto-fill Skills</span>
              <ArrowUpRightIcon className="w-5 h-5 text-primary-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </>
          )}
          
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-light/20 to-transparent opacity-50 blur-md pointer-events-none"></div>
        </button>

        {/* Error Message Display */}
        {error && (
          <p className="text-red-400 text-sm mb-6 animate-pulse">
            {error}
          </p>
        )}

        <button onClick={() => {router.push("/onboarding/manualprofilefill")}}className="text-white/70 hover:text-white underline-offset-4 hover:underline transition-colors text-sm font-medium mb-12 cursor-pointer">
          Skip and Type Skills Manually
        </button>

        <div className="w-full h-px bg-white/10 mb-8"></div>

        <div className="text-center text-white/40 text-sm leading-relaxed space-y-1 font-display">
          <p>Generated skills can be changed at any time.</p>
          <p>
            Your resume is sent to Google (Gemini) for processing and then
            permanently discarded.
          </p>
        </div>
      </div>
    </div>
  );
}