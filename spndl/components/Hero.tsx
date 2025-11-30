import GitHubLoginButton from "./GitHubLoginButton";
import Logo from "./Logo";



export default function Hero() {
  return (
    <div className="layout-container flex h-full grow flex-col z-10 w-full relative">
      <header className="flex items-center justify-center whitespace-nowrap px-4 sm:px-10 py-6 absolute top-0 left-0 right-0">
        <Logo />
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="relative flex flex-col gap-8 items-center justify-center p-4 text-center">
          <div className="flex flex-col gap-4 z-10">
            <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] sm:text-5xl font-serif max-w-2xl drop-shadow-xl">
              Weave your careers,<br/>Together.
            </h1>
            <h2 className="text-white/80 text-lg font-normal leading-relaxed sm:text-xl max-w-2xl mx-auto">
              Your next masterpiece is waiting to be spun. <br/>
              Weave your passions into projects and create your tapestry.
            </h2>
          </div>
          <GitHubLoginButton/>
        </div>
      </main>
    </div>
  );
}