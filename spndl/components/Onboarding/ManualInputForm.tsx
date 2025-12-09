"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import InputTag, { SkillTag } from "./InputTags";
import { applyManualProfile } from "@/app/actions/applyManualProfile";

interface SkillObj {
  skill: string;
  experience_level: string;
}

interface ManualFormProps {
  initialSkills: SkillObj[];
}

export default function ManualInputForm({ initialSkills }: ManualFormProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!cardRef.current) return;
          const rect = cardRef.current.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      };
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const [skillTags, setSkillTags] = useState<SkillTag[]>(
    initialSkills.map(s => ({ skill: s.skill, experience_level: s.experience_level || "Mid" }))
);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [hours, setHours] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const formInfo = {
      skills: skillTags, 
      hobbies: hobbies,
      role_interest: interests,
      hours_per_week: hours
    };

    await applyManualProfile(formInfo);
};

  return (
    <div className="relative w-full max-w-4xl px-4 flex justify-center">
      
      <div className="relative group w-full">
        <div
          className="absolute -inset-1 rounded-3xl opacity-60 blur-3xl transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(1000px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.25), transparent 45%)`,
          }}
        />

        <div
          className="absolute -inset-[1.5px] rounded-3xl opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.5), transparent 40%)`,
          }}
        />

        <div
          ref={cardRef}
          className="relative flex flex-col w-full p-8 sm:p-10 bg-surface-dark/95 backdrop-blur-xl rounded-3xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          
          <div className="mb-8 text-center sm:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl text-white font-bold tracking-tight mb-2">
              Refine your thread
            </h1>
            <p className="text-white/40 text-sm">
              Adjust the threads we pulled from your resume to tailor your future projects.
            </p>
          </div>

          <div className="space-y-8">
            <InputTag
              label="Skills"
              tags={skillTags}
              onTagsChange={(newTags) => setSkillTags(newTags)}
              isSkillInput={true}
              placeholder="Add skills (e.g. Python, React)..."
            />

            <InputTag
              label="Hobbies & Passions"
              tags={hobbies}
              onTagsChange={setHobbies}
              placeholder="What do you love? (e.g. Anime, Chess, Hiking)..."
            />

            <InputTag
              label="Career Interests"
              tags={interests}
              onTagsChange={setInterests}
              placeholder="Roles you want? (e.g. Backend, AI Engineer)..."
            />

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-end">
                <label className="text-white/80 text-sm font-medium ml-1">
                  Hours per week committed to projects
                </label>
                <span className="text-primary font-bold text-xl font-serif">
                  {hours}h
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="40"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary-light transition-all"
              />
              <div className="flex justify-between text-xs text-white/20 px-1 font-mono">
                <span>1h</span>
                <span>20h</span>
                <span>40h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="hidden sm:flex absolute -right-24 top-1/2 -translate-y-1/2 flex-col items-center justify-center w-16 h-32 bg-primary hover:bg-primary-light text-white rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all duration-300 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin" />
        ) : (
          <ChevronRight className="w-8 h-8 group-hover:translate-x-0.5 transition-transform" />
        )}
      </button>

      <div className="fixed bottom-6 inset-x-6 sm:hidden z-50">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Weaving..." : "Complete Profile"}
        </button>
      </div>
    </div>
  );
}