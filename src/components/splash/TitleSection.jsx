export default function TitleSection() {
  return (
    <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          MBG
        </span>
      </h1>
      <h2 className="text-lg sm:text-xl font-bold text-slate-700 tracking-widest uppercase">
        Nutrition Support
      </h2>
      <div className="flex items-center justify-center gap-2">
        <div className="h-px w-8 bg-blue-200" />
        <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-[0.2em]">
          Sistem Pendukung Gizi Nasional
        </p>
        <div className="h-px w-8 bg-blue-200" />
      </div>
    </div>
  );
}