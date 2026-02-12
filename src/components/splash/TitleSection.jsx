export default function TitleSection() {
  return (
    <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight">
        <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
          SIGAP
        </span>
      </h1>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-700 tracking-wide">
        Gizi
      </h2>
      <div className="flex items-center justify-center gap-2 mt-4">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-300" />
        <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-widest">
          Sistem Informasi Gizi Anak Pintar
        </p>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-300" />
      </div>
    </div>
  );
}