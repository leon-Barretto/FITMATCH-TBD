import Header from './Header';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        {children}
      </main>
      
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-4 gap-8 text-sm text-gray-600">
            <div>
              <div className="font-semibold text-gray-900 mb-3">Deinfluence</div>
              <p className="text-xs">Decision support for thoughtful consumers</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-3">Product</div>
              <ul className="space-y-1 text-xs">
                <li><a href="#" className="hover:text-gray-900">Decision Flow</a></li>
                <li><a href="#" className="hover:text-gray-900">Analysis</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-3">Learn</div>
              <ul className="space-y-1 text-xs">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Docs</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-3">Legal</div>
              <ul className="space-y-1 text-xs">
                <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 flex items-center justify-between text-xs text-gray-500">
            <div>© {new Date().getFullYear()} Deinfluence. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-900">Twitter</a>
              <a href="#" className="hover:text-gray-900">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
