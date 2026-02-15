export default function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            FM
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">FitMatch</h1>
            <p className="text-xs text-gray-500 font-medium leading-tight">Reflect</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#flow" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Flow</a>
          <a href="#agents" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Analysis</a>
          <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Resources</a>
        </nav>
      </div>
    </header>
  );
}
