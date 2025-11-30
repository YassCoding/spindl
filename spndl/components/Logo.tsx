import {Spool} from 'lucide-react'

export default function Logo() {
  return (
    <div className="flex items-center gap-1 text-white">
      <div className="w-10 h-10 text-primary">
        <Spool size={40} strokeWidth={1}/>
      </div>
      <h2 className="text-white text-2xl font-bold leading-none tracking-[-0.015em] font-serif">
        Spndl
      </h2>
    </div>
  );
}