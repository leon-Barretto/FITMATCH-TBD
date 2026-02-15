import { useState } from 'react';

export default function AgentOutputEnhanced({ data }) {
  const [showRaw, setShowRaw] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, alternatives, social, reviews

  if (!data) return null;

  const ScoreBar = ({ score, label, color = 'indigo' }) => {
    const colorMap = {
      indigo: 'from-indigo-500 to-purple-600',
      green: 'from-green-500 to-emerald-600',
      amber: 'from-amber-500 to-orange-600',
      red: 'from-red-500 to-rose-600',
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
                AI-powered insights with price comparisons and social validation
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
              {/* Recommendation */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex gap-3 items-start">
                  <div className="text-3xl">💡</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-base mb-2">AI Recommendation</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{data.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Visual Score Radar Chart */}
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
                  
                  {/* Overall FitMatch Score */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900">Overall FitMatch Score</span>
                      <span className="text-3xl font-bold text-indigo-600">
                        {data.overallScore || Math.round(
                          ((data.valueAlignment || 7) + 
                           (data.qualityScore || 6) + 
                           (10 - (data.influencerRisk || 5)) + 
                           (data.budgetFeasibility || 6)) / 4
                        )}/10
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Based on weighted analysis of all decision factors
                    </p>
                  </div>
                </div>
              )}

              {/* Trade-offs */}
              {data.tradeoffs && data.tradeoffs.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                    <span>⚖️</span> Key Trade-offs to Consider
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
                    <span>🧠</span> Psychological Biases to Watch
                  </h4>
                  <div className="grid gap-3">
                    {data.biasWarnings.map((bias, i) => (
                      <div key={i} className="flex gap-3 items-start p-4 rounded-lg bg-amber-50 border border-amber-100">
                        <span className="text-amber-600 font-bold flex-shrink-0 text-xl">⚠️</span>
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
                    <span>🤔</span> Deep Reflection Questions
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
                    <span>✅</span> Your Action Plan
                  </h4>
                  <ol className="space-y-3">
                    {data.actionSteps.map((step, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="text-green-600 font-bold flex-shrink-0 bg-green-100 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                          {i + 1}
                        </span>
                        <span className="text-sm text-green-900 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* PRICE ALTERNATIVES TAB */}
          {activeTab === 'alternatives' && data.priceAlternatives && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                  💰 Smart Shopping Alternatives
                </h4>
                <p className="text-sm text-gray-600">
                  We found similar items at different price points to match your budget and values
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {data.priceAlternatives.map((alt, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-indigo-300 transition-colors">
                    {alt.imageUrl && (
                      <div className="w-full h-48 bg-gray-100">
                        <img src={alt.imageUrl} alt={alt.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-gray-900 text-sm">{alt.name}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          alt.tier === 'budget' ? 'bg-green-100 text-green-700' :
                          alt.tier === 'mid' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {alt.tier === 'budget' ? '💚 Budget' : alt.tier === 'mid' ? '💙 Mid-range' : '💜 Premium'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">{alt.price}</p>
                      <p className="text-xs text-gray-600 mb-3">{alt.description}</p>
                      <div className="flex gap-2">
                        {alt.url && (
                          <a
                            href={alt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
                          >
                            View Item
                          </a>
                        )}
                      </div>
                      {alt.valueScore && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Value Score:</span>
                            <span className="font-bold text-indigo-600">{alt.valueScore}/10</span>
                          </div>
                        </div>
                      )}
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
                  📱 Social Media Insights
                </h4>
                <p className="text-sm text-gray-600">
                  Real people sharing their experiences with similar items
                </p>
              </div>

              <div className="grid gap-4">
                {data.socialContent.map((content, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 transition-colors">
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
                          {content.verified && <span className="text-blue-500">✓</span>}
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{content.caption}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>👁️ {content.views}</span>
                          <span>❤️ {content.likes}</span>
                          <span>💬 {content.comments}</span>
                        </div>
                        {content.url && (
                          <a
                            href={content.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            Watch on {content.platform} →
                          </a>
                        )}
                        {content.isSponsored && (
                          <div className="mt-3 pt-3 border-t border-amber-100 bg-amber-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
                            <p className="text-xs text-amber-800 flex items-center gap-2">
                              <span>⚠️</span>
                              <strong>Sponsored Content</strong> - This creator may be paid to promote this item
                            </p>
                          </div>
                        )}
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
                <h4 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                  ⭐ Customer Reviews Analysis
                </h4>
                <p className="text-sm text-gray-600">
                  Real customer feedback to help you make an informed decision
                </p>
              </div>

              {/* Review Summary */}
              {data.reviewSummary && (
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-3xl font-bold text-gray-900">{data.reviewSummary.avgRating}/5</div>
                    <div className="text-xs text-gray-500 mt-1">Average Rating</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-3xl font-bold text-gray-900">{data.reviewSummary.totalReviews}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Reviews</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{data.reviewSummary.recommendPercent}%</div>
                    <div className="text-xs text-gray-500 mt-1">Would Recommend</div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {data.reviews.map((review, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{review.author}</span>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              ✓ Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    {review.title && (
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">{review.title}</h5>
                    )}
                    <p className="text-sm text-gray-700 mb-3">{review.text}</p>
                    {review.pros && review.pros.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-green-700">Pros: </span>
                        <span className="text-xs text-gray-600">{review.pros.join(', ')}</span>
                      </div>
                    )}
                    {review.cons && review.cons.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-red-700">Cons: </span>
                        <span className="text-xs text-gray-600">{review.cons.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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