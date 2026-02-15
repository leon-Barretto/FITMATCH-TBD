import { useState } from 'react';
import IntelligentResultsV2 from './IntelligentResultsV2';

export default function IntelligentDecisionFlow() {
  const [inputs, setInputs] = useState({
    itemUrl: '',
    context: '',
    proportions: '',
    budget: '',
    values: '',
  });

  const [results, setResults] = useState(null);
  const [thinking, setThinking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setInputs((s) => ({ ...s, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleAnalyze() {
    if (!inputs.itemUrl) {
      setError('Please provide a product URL');
      return;
    }

    if (!inputs.values) {
      setError('Please specify your personal values');
      return;
    }

    setLoading(true);
    setError(null);
    setThinking([]);
    setResults(null);

    try {
      // Simulate real-time thinking (in production, use Server-Sent Events)
      const response = await fetch('/api/intelligent-dupe-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setThinking(result.thinking || []);
        setResults(result.data);
        
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      } else {
        throw new Error(result.error || 'Failed to analyze product');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInputs({
      itemUrl: '',
      context: '',
      proportions: '',
      budget: '',
      values: '',
    });
    setResults(null);
    setThinking([]);
    setError(null);
  }

  return (
    <section id="flow" className="animate-slideUp">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🧠 Intelligent Dupe Finder
            <span className="text-lg font-normal text-gray-500">(AI-Powered)</span>
          </h2>
          <p className="text-gray-600 mt-2">
            Paste a product link. Our AI will analyze reviews, detect sponsored content, find cheaper dupes, and give you honest advice.
          </p>
        </div>

        {/* What Makes It Smart Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            ✨ What Makes This Smart?
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <p className="font-semibold text-gray-900">Detects Bias</p>
                <p className="text-gray-600">Spots #ad posts & fake reviews</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold text-gray-900">Body Type Smart</p>
                <p className="text-gray-600">Matches to your proportions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-semibold text-gray-900">Real Advice</p>
                <p className="text-gray-600">Honest recommendations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6 mb-8">
          {/* Product URL - Most Important */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Product URL <span className="text-indigo-600">*</span>
            </label>
            <input
              name="itemUrl"
              value={inputs.itemUrl}
              onChange={handleChange}
              placeholder="https://www.garageclothing.com/ca/p/active-plunge-cami-top/..."
              className="glass-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste the full URL from Garage Clothing, SHEIN, Zara, etc.
            </p>
          </div>

          {/* User Context Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Body Type / Proportions
              </label>
              <select
                name="proportions"
                value={inputs.proportions}
                onChange={handleChange}
                className="glass-input w-full"
              >
                <option value="">Select your body type...</option>
                <option value="petite">Petite</option>
                <option value="curvy">Curvy</option>
                <option value="athletic">Athletic</option>
                <option value="plus size">Plus Size</option>
                <option value="tall">Tall</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                We'll find reviews from similar body types
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Budget Range
              </label>
              <input
                name="budget"
                value={inputs.budget}
                onChange={handleChange}
                placeholder="e.g., $20-50"
                className="glass-input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Your price comfort zone</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Context/Occasion
              </label>
              <input
                name="context"
                value={inputs.context}
                onChange={handleChange}
                placeholder="e.g., Gym, casual wear, work"
                className="glass-input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Where will you wear this?</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Personal Values <span className="text-indigo-600">*</span>
              </label>
              <input
                name="values"
                value={inputs.values}
                onChange={handleChange}
                placeholder="e.g., Sustainability, quality, affordability"
                className="glass-input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">What matters most to you?</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none" 
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                  />
                </svg>
                AI is thinking...
              </>
            ) : (
              <>
                <span className="text-lg">🧠</span>
                Analyze & Find Dupes
              </>
            )}
          </button>
          <button 
            onClick={handleClear} 
            className="btn-secondary"
            disabled={loading}
          >
            Clear
          </button>
        </div>

        {/* Example Links */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">Try these examples:</p>
          <div className="space-y-1">
            <button
              onClick={() => setInputs({
                ...inputs,
                itemUrl: 'https://www.garageclothing.com/ca/p/snatch-booty-terry-pants/1001029688H5.html',
                proportions: 'curvy',
                values: 'comfort, affordability'
              })}
              className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              → Garage Clothing Snatch Booty Terry Pants
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <IntelligentResultsV2 data={results} thinking={thinking} />
      )}
    </section>
  );
}
