import { useState } from 'react';

export default function IntelligentResultsV2({ data, thinking }) {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [showThinking, setShowThinking] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  if (!data) return null;

  const { product, intelligence, dupes } = data;
  const { trustAnalysis, sentiment, bodyTypeMatch, advice } = intelligence;

  // Enhanced dupes with REAL product URLs
  const enhancedDupes = dupes.map(dupe => {
    // Generate real search URLs based on product name and platform
    let realUrl = '#';
    
    if (dupe.platform === 'Amazon') {
      realUrl = `https://www.amazon.com/s?k=${encodeURIComponent(dupe.name)}`;
    } else if (dupe.platform === 'SHEIN') {
      realUrl = `https://www.shein.com/search?q=${encodeURIComponent(dupe.name)}`;
    } else if (dupe.platform === 'Fashion Nova') {
      realUrl = `https://www.fashionnova.com/search?q=${encodeURIComponent(product.name)}`;
    }
    
    return { ...dupe, url: realUrl };
  });

  return (
    <section id="results" className="mt-12 animate-scaleIn">
      {/* AI Thinking Process */}
      {thinking && thinking.length > 0 && showThinking && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🧠 AI Thinking Process
            </h3>
            <button
              onClick={() => setShowThinking(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          <div className="space-y-2 font-mono text-sm max-h-64 overflow-y-auto">
            {thinking.map((thought, i) => (
              <div 
                key={i} 
                className="flex gap-2 items-start animate-slideUp"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-lg">{thought.emoji}</span>
                <span className="text-gray-700 pt-0.5">{thought.thought}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Results Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 md:px-12 py-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-semibold">{product.brand}</span>
                <span>•</span>
                <span className="text-2xl font-bold text-indigo-600">${product.price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 px-6 md:px-12 overflow-x-auto">
            {[
              { id: 'intelligence', label: '🧠 Intelligence', show: true },
              { id: 'dupes', label: '💰 Dupes', show: enhancedDupes?.length > 0 },
              { id: 'unfiltered', label: '📸 Unfiltered Content', show: true },
              { id: 'tiktok', label: '🎵 TikTok', show: true },
              { id: 'youtube', label: '▶️ YouTube', show: true },
              { id: 'store-reviews', label: '⭐ Store Reviews', show: true },
              { id: 'advice', label: '💡 Advice', show: advice },
            ].filter(tab => tab.show).map((tab) => (
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
          {/* INTELLIGENCE TAB */}
          {activeTab === 'intelligence' && (
            <div className="space-y-8">
              {/* Trust Analysis */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4">🔍 Trust Analysis</h4>
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {trustAnalysis.overallTrust}/10
                  </div>
                  <p className="text-gray-700">{trustAnalysis.verdict}</p>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4">💭 Sentiment Analysis</h4>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    {sentiment.score}/5
                  </div>
                  <p className="text-gray-700">{sentiment.label}</p>
                </div>
              </div>

              {/* Body Type Match */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4">👗 Body Type Analysis</h4>
                <div className="flex items-center gap-4">
                  <div className="text-6xl">{bodyTypeMatch.emoji}</div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {bodyTypeMatch.score}/10
                    </div>
                    <p className="text-gray-700">{bodyTypeMatch.reasoning}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DUPES TAB - WITH REAL LINKS */}
          {activeTab === 'dupes' && enhancedDupes && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  💰 High-Similarity Dupes Ranked by Value
                </h4>
                <p className="text-sm text-gray-600">
                  Click "View on [Platform]" to search for these items. Links open real product searches.
                </p>
              </div>

              {enhancedDupes.map((dupe, i) => (
                <div key={i} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-indigo-300 transition-colors">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">#{dupe.rank}</span>
                      <span className="text-lg font-semibold">{dupe.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${dupe.price}</div>
                      <div className="text-xs opacity-90">{dupe.savingsPercent}% cheaper</div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(dupe.similarity * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Similarity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{dupe.avgRating}</div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {dupe.bodyTypeRating.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">Body Type</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{dupe.valueScore}</div>
                        <div className="text-xs text-gray-600">Value Score</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Why it matches:</p>
                      <p className="text-sm text-gray-700">{dupe.reasoning}</p>
                    </div>

                    {dupe.sustainabilityScore !== null && (
                      <div className="p-3 rounded-lg mb-4 bg-green-50 border border-green-200">
                        <p className="text-xs font-semibold text-gray-900">
                          🌱 Sustainability Score: {dupe.sustainabilityScore}/10
                        </p>
                      </div>
                    )}

                    {/* REAL LINK - OPENS ACTUAL PRODUCT SEARCH */}
                    <a
                      href={dupe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View on {dupe.platform} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* UNFILTERED CONTENT TAB */}
          {activeTab === 'unfiltered' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  📸 Unfiltered Content - Real People, Real Reviews
                </h4>
                <p className="text-sm text-gray-600">
                  No filters, no edits. See what real customers say about fit, sizing, and quality across all body types.
                </p>
              </div>

              {/* Review Cards with Photos */}
              <div className="grid gap-6">
                {getMockUnfilteredReviews().map((review, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="p-6">
                      {/* Reviewer Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-900">{review.author}</span>
                            {review.verified && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✓ Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Height: {review.height}</span>
                            <span>Weight: {review.weight}</span>
                            <span>Size: {review.size}</span>
                            <span className="font-semibold text-purple-600">{review.bodyType}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <span key={j} className={j < review.rating ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
                      <p className="text-gray-700 mb-4">{review.text}</p>

                      {/* Photo Gallery */}
                      {review.photos && review.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Customer Photos:</p>
                          <div className="grid grid-cols-4 gap-2">
                            {review.photos.map((photo, j) => (
                              <div key={j} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-4xl">📸</span>
                                </div>
                                <p className="absolute bottom-1 left-1 right-1 text-xs text-gray-600 bg-white bg-opacity-75 rounded px-1 text-center">
                                  {photo.caption}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fit Feedback */}
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-semibold text-blue-900">Fit:</span>
                        <span className="text-sm text-blue-800">{review.fit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIKTOK TAB */}
          {activeTab === 'tiktok' && (
            <div className="space-y-6">
              <div className="bg-black text-white rounded-xl p-6">
                <h4 className="text-xl font-bold mb-2">🎵 TikTok Reviews</h4>
                <p className="text-sm text-gray-300">
                  Real try-ons and honest reviews from TikTok creators
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {getMockTikTokVideos().map((video, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    {/* Video Player Placeholder */}
                    <div className="relative aspect-[9/16] bg-black cursor-pointer group">
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-white text-6xl mb-2">▶️</div>
                        <p className="text-white text-sm px-4 text-center">{video.caption}</p>
                      </div>
                      {video.isSponsored && (
                        <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          #ad
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">@{video.creator}</span>
                        {video.verified && <span className="text-blue-500">✓</span>}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>👁️ {video.views}</span>
                        <span>❤️ {video.likes}</span>
                        <span>💬 {video.comments}</span>
                      </div>
                      {video.aiSummary && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs font-semibold text-blue-900">AI Summary:</p>
                          <p className="text-sm text-blue-800 mt-1">{video.aiSummary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YOUTUBE TAB */}
          {activeTab === 'youtube' && (
            <div className="space-y-6">
              <div className="bg-red-600 text-white rounded-xl p-6">
                <h4 className="text-xl font-bold mb-2">▶️ YouTube Reviews</h4>
                <p className="text-sm text-red-100">
                  In-depth try-on hauls and detailed reviews
                </p>
              </div>

              <div className="grid gap-6">
                {getMockYouTubeVideos().map((video, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    {/* Embedded YouTube Player Placeholder */}
                    <div className="relative aspect-video bg-black cursor-pointer group">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-7xl">▶️</div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <p className="text-white font-semibold">{video.title}</p>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{video.creator}</span>
                        {video.verified && <span className="text-red-500">✓</span>}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>👁️ {video.views} views</span>
                        <span>👍 {video.likes}</span>
                      </div>
                      {video.aiSummary && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-xs font-semibold text-red-900">AI Summary:</p>
                          <p className="text-sm text-red-800 mt-1">{video.aiSummary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STORE REVIEWS TAB */}
          {activeTab === 'store-reviews' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                <h4 className="text-xl font-bold text-gray-900 mb-2">⭐ Official Store Reviews</h4>
                <p className="text-sm text-gray-600">
                  Reviews directly from {product.brand}'s website with verified purchase badges
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-3xl font-bold text-gray-900">4.6/5</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-3xl font-bold text-gray-900">247</div>
                  <div className="text-sm text-gray-600">Total Reviews</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">83%</div>
                  <div className="text-sm text-gray-600">Would Recommend</div>
                </div>
              </div>

              {/* Link to actual reviews */}
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                View All Reviews on {product.brand} Website →
              </a>
            </div>
          )}

          {/* ADVICE TAB - FIXED TO SHOW ALL DATA */}
          {activeTab === 'advice' && advice && (
            <div className="space-y-6">
              {/* Headline Box */}
              <div className={`rounded-xl p-8 border-2 ${
                advice.recommendation === 'buy_dupe'
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
              }`}>
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {advice.headline}
                  </h3>
                </div>
              </div>

              {/* DETAILED REASONING - THIS WAS MISSING! */}
              {advice.reasoning && (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">
                    📊 Why We Recommend This:
                  </h4>
                  
                  {/* Show reasoning with proper formatting */}
                  <div className="space-y-4 mb-8">
                    {advice.reasoning.split('\n\n').map((paragraph, i) => (
                      <div key={i} className="text-gray-700 text-lg leading-relaxed">
                        {paragraph.split('\n').map((line, j) => (
                          <p key={j} className={j > 0 ? 'mt-2' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Action Steps */}
                  {advice.actionSteps && advice.actionSteps.length > 0 && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
                      <h5 className="font-bold text-blue-900 mb-4 text-xl">
                        ✅ What To Do Next:
                      </h5>
                      <ol className="space-y-3">
                        {advice.actionSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="font-bold text-blue-600 text-lg min-w-[28px]">
                              {i + 1}.
                            </span>
                            <span className="text-gray-700 text-base leading-relaxed">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Consider This */}
                  {advice.considerThis && advice.considerThis.length > 0 && (
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-6 rounded-r-lg">
                      <h5 className="font-bold text-purple-900 mb-4 text-xl">
                        💭 Things To Consider:
                      </h5>
                      <ul className="space-y-3">
                        {advice.considerThis.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-purple-500 text-xl font-bold min-w-[20px]">
                              •
                            </span>
                            <span className="text-gray-700 text-base leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bottom Line */}
                  {advice.bottomLine && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-6 mb-6">
                      <p className="text-xl font-semibold text-gray-900 text-center">
                        {advice.bottomLine}
                      </p>
                    </div>
                  )}

                  {/* Savings Callout */}
                  {advice.savingsIfDupe && (
                    <div className="bg-green-100 border-2 border-green-500 rounded-xl p-5 text-center">
                      <p className="text-2xl font-bold text-green-800">
                        {advice.savingsIfDupe}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback for old data format */}
              {!advice.reasoning && advice.advice && (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
                  <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    {advice.advice}
                  </p>
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      💡 <strong>Tip:</strong> The detailed analysis is available. Make sure your API is returning the enhanced data format.
                    </p>
                  </div>
                </div>
              )}

              {/* Link to Dupes tab */}
              {advice.recommendation === 'buy_dupe' && dupes && dupes.length > 0 && (
                <button
                  onClick={() => setActiveTab('dupes')}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-lg shadow-lg"
                >
                  👉 View Recommended Alternatives
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Mock data functions
function getMockUnfilteredReviews() {
  return [
    {
      author: 'Sarah M.',
      rating: 5,
      title: 'Perfect for curvy girls!',
      text: 'This top is AMAZING! The plunge neckline is so flattering and the built-in support actually works. I\'m a 34DD and don\'t need a bra underneath. Runs true to size.',
      height: '5\'4"',
      weight: '150 lbs',
      size: 'M',
      bodyType: 'Curvy',
      fit: 'True to size',
      verified: true,
      photos: [
        { caption: 'Front view' },
        { caption: 'Side view' },
        { caption: 'Back view' },
        { caption: 'With jeans' }
      ]
    },
    {
      author: 'Emma L.',
      rating: 4,
      title: 'Good but thin',
      text: 'Love the style and fit but the material is pretty thin. You can see my bra through it in bright light. Still cute though!',
      height: '5\'7"',
      weight: '135 lbs',
      size: 'S',
      bodyType: 'Athletic',
      fit: 'True to size',
      verified: true,
      photos: [
        { caption: 'Wearing it' },
        { caption: 'Fabric detail' }
      ]
    }
  ];
}

function getMockTikTokVideos() {
  return [
    {
      creator: 'fitnessgirl',
      caption: 'Honest Garage Clothing try-on haul 👀 Not sponsored!',
      views: '89K',
      likes: '12K',
      comments: '342',
      verified: false,
      isSponsored: false,
      aiSummary: 'Creator tries on 5 items. Says this top is her favorite - great support and flattering fit. Mentions it runs true to size.'
    },
    {
      creator: 'fashionhauls',
      caption: 'Garage haul with code FASHION10 💕 #ad',
      views: '245K',
      likes: '34K',
      comments: '891',
      verified: true,
      isSponsored: true,
      aiSummary: 'Sponsored content. Creator shows multiple items but doesn\'t provide detailed fit feedback. Focuses on aesthetic.'
    }
  ];
}

function getMockYouTubeVideos() {
  return [
    {
      creator: 'StyleReviews',
      title: 'HONEST Garage Clothing Try-On Haul 2025 | Size M Review',
      views: '45K',
      likes: '3.2K',
      verified: true,
      aiSummary: '15-minute detailed review. Shows fit on camera, discusses pros (support, neckline) and cons (thin material). Recommends for casual wear.'
    }
  ];
}
