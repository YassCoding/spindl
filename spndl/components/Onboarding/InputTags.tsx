"use client";

import { X, Plus, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface SkillTag {
  skill: string;
  experience_level: string;
}

interface InputTagProps {
  label: string;
  tags: (string | SkillTag)[]; 
  onTagsChange: (newTags: any[]) => void;
  placeholder?: string;
  isSkillInput?: boolean; 
}

export default function InputTag({ label, tags, onTagsChange, placeholder, isSkillInput }: InputTagProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); 

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === inputRef.current) {
      inputRef.current?.focus();
    }
  };

  const addTag = () => {
    if (!inputValue.trim()) return;
    
    const exists = tags.some(t => 
      typeof t === 'string' ? t === inputValue.trim() : t.skill === inputValue.trim()
    );

    if (!exists) {
      if (isSkillInput) {
        onTagsChange([...tags, { skill: inputValue.trim(), experience_level: "Mid" }]);
      } else {
        onTagsChange([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, i) => i !== indexToRemove));
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between items-end ml-1">
        <label className="text-white/80 text-sm font-medium">{label}</label>
        {tags.length > 0 && (
            <button 
                onClick={clearAll} 
                title="Clear all items"
                className="text-white/30 hover:text-red-400 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
                <Trash2 size={12} /> Clear
            </button>
        )}
      </div>
      
      <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative group rounded-xl bg-white/5 border border-white/10 focus-within:border-primary/50 focus-within:bg-white/10 transition-all duration-300 p-2 cursor-text min-h-[50px]"
      >
        <div className="flex flex-wrap gap-2 pointer-events-none"> 
          {tags.map((tag, index) => (
            <ItemTag 
                key={index} 
                tag={tag} 
                index={index} 
                removeTag={removeTag} 
                isSkillInput={isSkillInput}
                updateTag={(updated) => {
                    const newTags = [...tags];
                    newTags[index] = updated;
                    onTagsChange(newTags);
                }}
            />
          ))}
          
          <div className="flex-grow flex items-center min-w-[120px] h-8 pointer-events-auto">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : ""}
              className="bg-transparent border-none outline-none text-white text-sm w-full h-full placeholder:text-white/20 px-1"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); addTag(); }}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-primary text-white/50 hover:text-white transition-all duration-300 ml-auto flex-shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemTag({ tag, index, removeTag, isSkillInput, updateTag }: any) {
    const [isHovering, setIsHovering] = useState(false);
    
    const openTimer = useRef<NodeJS.Timeout | null>(null);
    const closeTimer = useRef<NodeJS.Timeout | null>(null);

    const isObject = typeof tag !== 'string';
    const label = isObject ? tag.skill : tag;
    const level = isObject ? tag.experience_level : "";

    const handleMouseEnter = () => {
        if (!isSkillInput) return;
        
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        if (!isSkillInput) return;

        closeTimer.current = setTimeout(() => {
            setIsHovering(false);
        }, 300);
    };

    const getLevelColor = (lvl: string) => {
        switch(lvl.toLowerCase()) {
            case "senior": return "text-purple-300 border-purple-500/50";
            case "mid": return "text-blue-300 border-blue-500/50";
            case "junior": return "text-green-300 border-green-500/50";
            case "college-level": return "text-yellow-300 border-yellow-500/50";
            default: return "text-primary-light border-primary/30";
        }
    };

    return (
        <div 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => removeTag(index)}
            className={`pointer-events-auto relative cursor-pointer select-none flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg bg-primary/20 text-sm font-medium border animate-in fade-in zoom-in duration-200 hover:bg-red-500/20 hover:border-red-500/50 transition-colors group ${isObject ? getLevelColor(level) : "text-primary-light border-primary/30"}`}
        >
            <span className="flex flex-col leading-none py-0.5">
                {label}
                {isObject && <span className="text-[9px] opacity-70 uppercase tracking-wider">{level}</span>}
            </span>

            <button type="button" className="hover:bg-black/20 rounded-md p-0.5 ml-1">
                <X size={14} />
            </button>

            {isHovering && isSkillInput && (
                <div 
                    onClick={(e) => e.stopPropagation()} // Stop delete click
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 flex flex-col bg-surface-dark border border-white/20 rounded-lg shadow-xl overflow-hidden min-w-[100px]"
                >
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-dark border-r border-b border-white/20 rotate-45"></div>

                    {["College-Level", "Junior", "Mid", "Senior"].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => {
                                updateTag({ ...tag, experience_level: lvl });
                                setIsHovering(false);
                            }}
                            className={`px-3 py-1.5 text-xs text-left hover:bg-primary/20 transition-colors ${level === lvl ? "text-primary font-bold bg-primary/10" : "text-white/70"}`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}