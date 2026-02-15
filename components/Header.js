export default function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md border-b border-gray-200 bg-white/80">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
            DI
          </div>
          <h1 className="text-xl font-bold text-gray-900">Deinfluence</h1>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#flow" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
            Analyze
          </a>
          <a href="#results" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
            Results
          </a>
        </nav>
      </div>
    </header>
  );
}