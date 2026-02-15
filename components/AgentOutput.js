import { useState } from 'react';

export default function AgentOutput({ data }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!data) return null;

  const ScoreBar = ({ score, label }) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-bold text-indigo-600">{score}/10</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <section id="agents" className="mt-12 animate-scaleIn">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 md:px-12 py-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-3xl font-bold text-gray-900">Analysis Results</h3>
              <p className="text-sm text-gray-600 mt-1">Deep reflection to guide your thoughtful decision</p>
            </div>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
              {showRaw ? 'Hide' : 'Show'} JSON
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 md:px-12 py-8 space-y-8">
          {/* Recommendation */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex gap-3 items-start">
              <div className="text-3xl">💡</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-base mb-2">Recommendation</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{data.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Scoring Section */}
          {(data.valueAlignment || data.influencerRisk || data.budgetFeasibility) && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <ScoreBar score={data.valueAlignment || 7} label="Value Alignment" />
                <p className="text-xs text-gray-500 mt-2">How well purchases align with your values</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <ScoreBar score={data.influencerRisk || 5} label="Influencer Risk" />
                <p className="text-xs text-gray-500 mt-2">Susceptibility to influencer bias</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <ScoreBar score={data.budgetFeasibility || 6} label="Budget Feasibility" />
                <p className="text-xs text-gray-500 mt-2">Ease of finding items in budget</p>
              </div>
            </div>
          )}

          {/* Trade-offs */}
          {data.tradeoffs && data.tradeoffs.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <span>⚖️</span> Key Trade-offs
              </h4>
              <div className="grid gap-3">
                {data.tradeoffs.map((t, i) => (
                  <div
                    key={i}
                    className="flex gap-3 items-start p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                  >
                    <span className="text-indigo-600 font-bold flex-shrink-0 text-lg">vs</span>
                    <p className="text-sm text-gray-700 pt-0.5">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bias Warnings */}
          {data.biasWarnings && data.biasWarnings.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <span>⚠️</span> Psychological Biases to Watch
              </h4>
              <div className="grid gap-3">
                {data.biasWarnings.map((bias, i) => (
                  <div key={i} className="flex gap-3 items-start p-4 rounded-lg bg-amber-50 border border-amber-100">
                    <span className="text-amber-600 font-bold flex-shrink-0">!</span>
                    <p className="text-sm text-amber-900">{bias}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflection Prompts */}
          {data.reflectionPrompts && data.reflectionPrompts.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <span>🔍</span> Reflection Prompts
              </h4>
              <div className="space-y-3">
                {data.reflectionPrompts.map((r, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 pt-0.5 leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Steps */}
          {data.actionSteps && data.actionSteps.length > 0 && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h4 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <span>✓</span> Next Steps
              </h4>
              <ol className="space-y-2">
                {data.actionSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    <span className="text-sm text-green-900">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Raw JSON */}
        {showRaw && (
          <div className="border-t border-gray-100 animate-slideUp">
            <div className="px-6 md:px-12 py-8 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 mb-3">Raw Data (JSON)</p>
              <pre className="overflow-auto text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-4 leading-relaxed font-mono max-h-72">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
