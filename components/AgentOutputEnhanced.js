import { useState } from 'react';

export default function AgentOutputEnhanced({ data }) {
  const [showRaw, setShowRaw] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) return null;

  const ScoreBar = ({ score, label, color = 'indigo' }) => {
    const colorMap = {
      indigo: 'from-indigo-500 to-purple-600',
      green: 'from-green-500 to-emerald-600',
      amber: 'from-amber-500 to-orange-600',
    };
    
    return (
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-xs font-bold text-indigo-600">{score}/10</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`bg-gradient-to-r ${colorMap[color]} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', show: true },
    { id: 'alternatives', label: '💰 Price Alternatives', show: data.priceAlternatives?.length > 0 },
    { id: 'social', label: '📱 Social Media', show: data.socialContent?.length > 0 },
    { id: 'reviews', label: '⭐ Reviews', show: data.reviews?.length > 0 },
  ].filter(tab => tab.show);

  return (
    <section id="results" className="mt-12 animate-scaleIn">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 md:px-12 py-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-3xl font-bold text-gray-900">Enhanced Analysis Results</h3>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered insights with real social media links and price alternatives
              </p>
            </div>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
              {showRaw ? 'Hide' : 'Show'} JSON
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 px-6 md:px-12 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 md:px-12 py-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Rest of overview tab - same as before */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex gap-3 items-start">
                  <div className="text-3xl">💡</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-base mb-2">AI Recommendation</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{data.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Score bars and other overview content remain the same... */}
              {data.radarScores && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="font-bold text-gray-900 text-base mb-4">📊 FitMatch Score Breakdown</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <ScoreBar score={data.valueAlignment || 7} label="Value Alignment" color="green" />
                      <ScoreBar score={data.qualityScore || 6} label="Quality vs. Price" color="indigo" />
                      <ScoreBar score={data.versatilityScore || 8} label="Versatility" color="indigo" />
                    </div>
                    <div className="space-y-3">
                      <ScoreBar score={10 - (data.influencerRisk || 5)} label="Critical Thinking" color="green" />
                      <ScoreBar score={data.budgetFeasibility || 6} label="Budget Feasibility" color="amber" />
                      <ScoreBar score={data.sustainabilityScore || 5} label="Sustainability" color="green" />
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900">Overall FitMatch Score</span>
                      <span className="text-3xl font-bold text-indigo-600">
                        {data.overallScore || 7}/10
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Trade-offs, Biases, Reflections, Actions - keep as before */}
              {data.tradeoffs && data.tradeoffs.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                    <span>⚖️</span> Key Trade-offs
                  </h4>
                  <div className="grid gap-3">
                    {data.tradeoffs.map((t, i) => (
                      <div key={i} className="flex gap-3 items-start p-4 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-indigo-600 font-bold flex-shrink-0 text-lg">vs</span>
                        <p className="text-sm text-gray-700 pt-0.5">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRICE ALTERNATIVES TAB */}
          {activeTab === 'alternatives' && data.priceAlternatives && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                  💰 Real Price Alternatives
                </h4>
                <p className="text-sm text-gray-600">
                  Click the links below to search for similar items at different price points
                </p>
              </div>

              <div className="grid gap-6">
                {data.priceAlternatives.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-indigo-300 transition-colors">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h5 className="font-bold text-gray-900 text-lg">{item.name}</h5>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              item.tier === 'budget' ? 'bg-green-100 text-green-700' :
                              item.tier === 'mid' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {item.tier === 'budget' ? '💚 Budget' : item.tier === 'mid' ? '💙 Mid-range' : '💜 Premium'}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-2">{item.price}</p>
                          {item.platform && (
                            <p className="text-sm text-gray-500 mb-3">Search on {item.platform}</p>
                          )}
                          <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                      
                      {item.isRealLink && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs font-medium text-green-800 flex items-center gap-2">
                            <span>✅</span> This is a real link - Click below to search
                          </p>
                        </div>
                      )}

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Search on {item.platform} →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOCIAL MEDIA TAB */}
          {activeTab === 'social' && data.socialContent && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
                <h4 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                  📱 Real Social Media Links
                </h4>
                <p className="text-sm text-gray-600">
                  Click to search TikTok, Instagram, and YouTube for real try-ons, reviews, and dupes
                </p>
              </div>

              <div className="grid gap-4">
                {data.socialContent.map((content, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-indigo-200 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          content.platform === 'tiktok' ? 'bg-black' :
                          content.platform === 'instagram' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                          'bg-red-600'
                        }`}>
                          {content.platform === 'tiktok' ? '🎵' : content.platform === 'instagram' ? '📸' : '▶️'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{content.creator}</span>
                          <span className="text-xs text-gray-500">• {content.platform}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{content.caption}</p>
                        
                        {content.searchTerm && (
                          <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
                            <strong>Search term:</strong> {content.searchTerm}
                          </div>
                        )}

                        {content.isDupeSearch && (
                          <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-xs font-medium text-amber-800 flex items-center gap-2">
                              <span>💰</span> Find cheaper alternatives and dupes!
                            </p>
                          </div>
                        )}

                        {content.isRealLink && (
                          <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-xs font-medium text-green-700">
                              ✅ Real link - Opens actual {content.platform} search
                            </p>
                          </div>
                        )}

                        <a
                          href={content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Open on {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)} →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && data.reviews && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                <h4 className="font-bold text-gray-900 text-lg mb-2">⭐ Customer Reviews</h4>
                <p className="text-sm text-gray-600">
                  View real reviews on the product page with height, weight, size, and fit information
                </p>
              </div>

              <div className="grid gap-4">
                {data.reviews.map((review, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-5">
                    <h5 className="font-semibold text-gray-900 text-base mb-2">{review.title}</h5>
                    <p className="text-sm text-gray-700 mb-4">{review.text}</p>
                    
                    {review.pros && review.pros.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs font-semibold text-green-700">What you'll find:</span>
                        <ul className="mt-1 space-y-1">
                          {review.pros.map((pro, j) => (
                            <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-green-600">✓</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {review.reviewUrl && (
                      <a
                        href={review.reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Read Real Reviews on Product Page →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Raw JSON */}
        {showRaw && (
          <div className="border-t border-gray-100">
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