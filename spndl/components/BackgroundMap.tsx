import Image from "next/image";

export default function BackgroundMap() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-0 h-full w-full pointer-events-none select-none opacity-60 mix-blend-screen">
      <div 
        className="relative w-full h-full"
        style={{
          maskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 80%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 80%)'
        }}
      >
        <Image
          src="/background.svg"
          alt="Background Map"
          className="h-full w-full object-cover object-bottom"
          fill={true}
        />
      </div>
    </div>
  );
}