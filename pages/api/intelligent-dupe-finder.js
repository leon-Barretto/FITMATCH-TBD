// pages/api/intelligent-dupe-finder-enhanced.js

/**
 * 🧠 ENHANCED INTELLIGENT DUPE FINDER
 * Now with detailed AI explanations that help users understand and problem-solve
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { itemUrl, context, proportions, budget, values } = req.body;

  if (!itemUrl) {
    return res.status(400).json({ error: 'Product URL required' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  try {
    console.log('🧠 ENHANCED INTELLIGENT DUPE FINDER ACTIVATED');
    console.log('📦 Product:', itemUrl);

    // Thinking log
    const thinkingLog = [];
    
    const addThought = (emoji, thought) => {
      console.log(`${emoji} ${thought}`);
      thinkingLog.push({ emoji, thought });
    };

    // STEP 1: Extract product info
    addThought('🔍', 'Analyzing product URL...');
    const productInfo = extractProductInfo(itemUrl);
    addThought('✅', `Detected: ${productInfo.name} from ${productInfo.brand}`);

    // STEP 2: Gather data
    addThought('📊', 'Gathering reviews and social media data...');
    const rawData = gatherMockData();
    addThought('✅', `Found ${rawData.reviews.length} reviews`);

    // STEP 3: Trust analysis
    addThought('🤔', 'Analyzing trust signals...');
    const trustAnalysis = analyzeTrustDetailed(rawData);
    addThought('📈', `Trust score: ${trustAnalysis.overallTrust}/10`);

    // STEP 4: Sentiment
    addThought('💭', 'Analyzing sentiment from genuine reviews only...');
    const sentiment = analyzeSentimentDetailed(rawData, trustAnalysis);
    addThought('✅', `Sentiment: ${sentiment.score}/5`);

    // STEP 5: Body type
    addThought('👗', `Analyzing fit for ${proportions || 'general'} body type...`);
    const bodyTypeMatch = analyzeBodyTypeDetailed(rawData, proportions);
    addThought(bodyTypeMatch.emoji, `Body match: ${bodyTypeMatch.score}/10`);

    // STEP 6: Features
    addThought('🎯', 'Extracting key features...');
    const features = extractFeatures(productInfo);
    addThought('✅', `Features: ${features.slice(0, 3).join(', ')}`);

    // STEP 7: Find dupes
    addThought('🔎', 'Searching for dupes...');
    const dupes = findDupesEnhanced(productInfo, proportions);
    addThought('✨', `Found ${dupes.length} dupes`);

    // STEP 8: AI Advice with reasoning
    addThought('💡', 'Generating detailed advice with reasoning...');
    const advice = generateAdviceDetailed(trustAnalysis, sentiment, bodyTypeMatch, dupes);
    addThought('✅', 'Analysis complete!');

    // Return enhanced results
    return res.status(200).json({
      success: true,
      thinking: thinkingLog,
      data: {
        product: productInfo,
        intelligence: {
          trustAnalysis,
          sentiment,
          bodyTypeMatch,
          features,
          advice
        },
        dupes,
        rawData: {
          reviews: rawData.reviews.slice(0, 5), // Show more reviews for evidence
          social: { tiktok: [], instagram: [] }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message
    });
  }
}

// Helper functions
function extractProductInfo(url) {
  let brand = 'Unknown';
  let name = 'Product';
  
  if (url.includes('garageclothing')) {
    brand = 'Garage Clothing';
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 3) {
      name = parts[parts.indexOf('p') + 1]
        .replace(/-/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  return { 
    brand, 
    name, 
    category: 'clothing', 
    url, 
    price: 24.95 
  };
}

function gatherMockData() {
  return {
    reviews: [
      {
        author: 'Sarah M.',
        rating: 5,
        text: 'This top lifts the girls perfectly! Super flattering. The plunge neckline is everything. #garagepartner',
        bodyType: 'curvy',
        height: '5\'4"',
        weight: '150 lbs',
        size: 'M',
        verified: true,
        isSponsored: true,
        fit: 'True to size',
        pros: ['Great support', 'Flattering neckline', 'Soft material'],
        cons: []
      },
      {
        author: 'Emma L.',
        rating: 5,
        text: 'Love the support! Material is soft and stretchy. Perfect for everyday wear.',
        bodyType: 'athletic',
        height: '5\'7"',
        weight: '135 lbs',
        size: 'S',
        verified: true,
        isSponsored: false,
        fit: 'True to size',
        pros: ['Soft material', 'Good stretch', 'Comfortable'],
        cons: []
      },
      {
        author: 'Jessica K.',
        rating: 4,
        text: 'Good but material is thin. You can see through it in bright light.',
        bodyType: 'petite',
        size: 'XS',
        verified: true,
        isSponsored: false,
        fit: 'True to size',
        pros: ['Cute style', 'Good fit'],
        cons: ['Thin material', 'See-through']
      },
      {
        author: 'Ashley R.',
        rating: 5,
        text: 'Amazing! Best purchase ever! Use code ASHLEY10 for 10% off! #ad #gifted',
        verified: false,
        isSponsored: true,
        pros: [],
        cons: []
      },
      {
        author: 'Megan T.',
        rating: 4,
        text: 'Pretty good for the price. Fits well but I wish the material was thicker.',
        bodyType: 'curvy',
        height: '5\'5"',
        weight: '160 lbs',
        size: 'M',
        verified: true,
        isSponsored: false,
        fit: 'True to size',
        pros: ['Good price', 'Nice fit'],
        cons: ['Thin fabric']
      }
    ]
  };
}

/**
 * ENHANCED Trust Analysis with detailed explanations
 */
function analyzeTrustDetailed(rawData) {
  const reviews = rawData.reviews;
  let trustScore = 10.0;
  let sponsoredCount = 0;
  let verifiedCount = 0;
  let detailedReviewCount = 0;

  reviews.forEach(r => {
    if (r.isSponsored) {
      sponsoredCount++;
      trustScore -= 0.8;
    }
    if (r.verified) {
      verifiedCount++;
      trustScore += 0.3;
    }
    if (r.bodyType && r.height && r.size) {
      detailedReviewCount++;
      trustScore += 0.2;
    }
  });

  trustScore = Math.max(1, Math.min(10, trustScore));
  const sponsoredPercentage = ((sponsoredCount / reviews.length) * 100).toFixed(1);

  // Generate detailed explanation
  let explanation = '';
  if (trustScore >= 8) {
    explanation = `This product has strong trust signals. ${verifiedCount} out of ${reviews.length} reviews are from verified purchases, and only ${sponsoredPercentage}% are sponsored content. Most feedback appears to come from genuine customers sharing honest experiences.`;
  } else if (trustScore >= 6) {
    explanation = `This product has moderate trust signals. While ${verifiedCount} reviews are verified, ${sponsoredPercentage}% are sponsored content, which may indicate some bias. Consider focusing on the verified, non-sponsored reviews for the most honest feedback.`;
  } else {
    explanation = `⚠️ HIGH CAUTION: ${sponsoredPercentage}% of reviews are sponsored, which is unusually high. This suggests heavy influencer marketing. The actual product quality may differ from what sponsored reviews claim. Look for verified purchases from non-sponsored reviewers.`;
  }

  // Identify specific red flags
  const redFlags = [];
  if (sponsoredCount > 2) {
    redFlags.push(`${sponsoredCount} sponsored reviews detected - many reviewers were paid or given free products`);
  }
  if (sponsoredCount > verifiedCount) {
    redFlags.push('More sponsored reviews than verified purchases - unusual pattern');
  }
  if (detailedReviewCount < 2) {
    redFlags.push('Few detailed reviews with body measurements - harder to assess fit');
  }

  return {
    overallTrust: trustScore.toFixed(1),
    verdict: trustScore >= 7 ? 'Trustworthy' : trustScore >= 5 ? 'Moderately Trustworthy' : 'Low Trust - Caution Advised',
    sponsoredCount,
    sponsoredPercentage,
    verifiedCount,
    detailedReviewCount,
    totalReviews: reviews.length,
    explanation,
    redFlags,
    whatThisMeans: trustScore >= 7 
      ? 'Most reviews appear genuine. You can trust the feedback.'
      : trustScore >= 5
      ? 'Mixed signals. Focus on verified, non-sponsored reviews.'
      : 'Heavy influencer marketing detected. Be skeptical of positive reviews.',
    breakdown: [
      { factor: 'Verified purchases', impact: `+${(verifiedCount * 0.3).toFixed(1)}`, count: verifiedCount },
      { factor: 'Sponsored content', impact: `-${(sponsoredCount * 0.8).toFixed(1)}`, count: sponsoredCount },
      { factor: 'Detailed reviews', impact: `+${(detailedReviewCount * 0.2).toFixed(1)}`, count: detailedReviewCount }
    ]
  };
}

/**
 * ENHANCED Sentiment Analysis with context
 */
function analyzeSentimentDetailed(rawData, trustAnalysis) {
  const genuine = rawData.reviews.filter(r => !r.isSponsored);
  const avgRating = genuine.reduce((sum, r) => sum + r.rating, 0) / genuine.length;

  // Extract common themes
  const allPros = genuine.flatMap(r => r.pros || []);
  const allCons = genuine.flatMap(r => r.cons || []);
  
  const prosCounts = {};
  allPros.forEach(pro => {
    prosCounts[pro] = (prosCounts[pro] || 0) + 1;
  });
  
  const consCounts = {};
  allCons.forEach(con => {
    consCounts[con] = (consCounts[con] || 0) + 1;
  });

  const topPros = Object.entries(prosCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pro, count]) => `${pro} (${count} mentions)`);

  const topCons = Object.entries(consCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([con, count]) => `${con} (${count} mentions)`);

  let interpretation = '';
  if (avgRating >= 4.5) {
    interpretation = `Genuine customers love this product! With an average of ${avgRating.toFixed(1)}/5 stars from ${genuine.length} unsponsored reviews, the feedback is overwhelmingly positive.`;
  } else if (avgRating >= 3.5) {
    interpretation = `Genuine customers are generally satisfied (${avgRating.toFixed(1)}/5), but there are some concerns mentioned in reviews. Pay attention to the common complaints.`;
  } else {
    interpretation = `⚠️ Genuine customers are mixed or disappointed (${avgRating.toFixed(1)}/5). The issues mentioned in reviews are worth considering seriously.`;
  }

  return {
    score: avgRating.toFixed(1),
    label: avgRating >= 4.5 ? 'Highly Positive' : avgRating >= 3.5 ? 'Positive' : avgRating >= 2.5 ? 'Mixed' : 'Negative',
    interpretation,
    topPros,
    topCons,
    genuineReviewCount: genuine.length,
    allReviewCount: rawData.reviews.length,
    keyFindings: [
      `${genuine.length} genuine reviews analyzed (excluded ${rawData.reviews.length - genuine.length} sponsored)`,
      topPros.length > 0 ? `Most loved: ${topPros[0]}` : 'No consistent pros found',
      topCons.length > 0 ? `Main concern: ${topCons[0]}` : 'No major concerns'
    ],
    whatToWatch: topCons.length > 0 
      ? `Multiple people mentioned: ${topCons.join(', ')}. This is a genuine pattern worth considering.`
      : 'No consistent issues reported across reviews.'
  };
}

/**
 * ENHANCED Body Type Analysis with evidence
 */
function analyzeBodyTypeDetailed(rawData, userBodyType) {
  if (!userBodyType) {
    return {
      score: 5,
      emoji: '❓',
      reasoning: 'No body type specified - unable to match',
      evidence: [],
      reviewCount: 0,
      recommendation: 'Specify your body type to get personalized fit analysis'
    };
  }

  const relevant = rawData.reviews.filter(r => 
    r.bodyType && r.bodyType.toLowerCase() === userBodyType.toLowerCase()
  );

  if (relevant.length === 0) {
    return {
      score: 5,
      emoji: '❓',
      reasoning: `No reviews found from ${userBodyType} body types`,
      evidence: [],
      reviewCount: 0,
      recommendation: `We couldn't find reviews from people with ${userBodyType} body types. Consider looking at similar body types or being cautious about fit.`,
      whatThisMeans: 'Without reviews from similar body types, it\'s harder to predict how this will fit you.'
    };
  }

  const avgRating = relevant.reduce((sum, r) => sum + r.rating, 0) / relevant.length;
  const score = (avgRating / 5) * 10;

  // Fit analysis
  const fitCounts = {};
  relevant.forEach(r => {
    if (r.fit) {
      fitCounts[r.fit] = (fitCounts[r.fit] || 0) + 1;
    }
  });
  
  const mostCommonFit = Object.entries(fitCounts).length > 0
    ? Object.entries(fitCounts).sort((a, b) => b[1] - a[1])[0][0]
    : 'Unknown';

  let reasoning = '';
  let recommendation = '';
  
  if (score >= 8) {
    reasoning = `Perfect Match! ${relevant.length} ${userBodyType} reviewers gave it ${avgRating.toFixed(1)}/5 stars on average.`;
    recommendation = `This is a great fit for ${userBodyType} body types. Most reviews from similar body types are very positive. ${mostCommonFit !== 'Unknown' ? `Typically fits ${mostCommonFit.toLowerCase()}.` : ''}`;
  } else if (score >= 6) {
    reasoning = `Good Match. ${relevant.length} ${userBodyType} reviewers rated it ${avgRating.toFixed(1)}/5.`;
    recommendation = `Generally works well for ${userBodyType} body types, but read the reviews carefully for sizing details. ${mostCommonFit !== 'Unknown' ? `Most say it fits ${mostCommonFit.toLowerCase()}.` : ''}`;
  } else {
    reasoning = `Caution Advised. ${relevant.length} ${userBodyType} reviewers gave it ${avgRating.toFixed(1)}/5.`;
    recommendation = `⚠️ Reviews from ${userBodyType} body types are mixed or negative. Read the detailed feedback carefully before purchasing. ${mostCommonFit !== 'Unknown' ? `Fit is reported as ${mostCommonFit.toLowerCase()}.` : ''}`;
  }

  return {
    score: score.toFixed(1),
    emoji: score >= 8 ? '🟢' : score >= 6 ? '🟡' : '🔴',
    reasoning,
    recommendation,
    whatThisMeans: score >= 8 
      ? `People with ${userBodyType} body types consistently love this product.`
      : score >= 6
      ? `It works for some ${userBodyType} body types, but experiences vary.`
      : `Many ${userBodyType} body types found issues with this product.`,
    evidence: relevant.slice(0, 3).map(r => ({ 
      text: r.text.substring(0, 100), 
      rating: r.rating,
      height: r.height,
      weight: r.weight,
      size: r.size,
      fit: r.fit
    })),
    reviewCount: relevant.length,
    fitAnalysis: {
      mostCommonFit,
      fitBreakdown: Object.entries(fitCounts).map(([fit, count]) => ({
        fit,
        count,
        percentage: ((count / relevant.length) * 100).toFixed(0)
      }))
    }
  };
}

function extractFeatures(productInfo) {
  // In real implementation, extract from product description
  return ['plunge neckline', 'built-in support', 'thick straps', 'high stretch', 'soft material'];
}

function findDupesEnhanced(productInfo, bodyType) {
  return [
    {
      rank: 1,
      name: 'CRZ YOGA Matte Brushed Plunge Sports Bra',
      brand: 'CRZ YOGA',
      platform: 'Amazon',
      price: 18.00,
      originalPrice: productInfo.price,
      savings: (productInfo.price - 18.00).toFixed(2),
      savingsPercent: Math.round(((productInfo.price - 18.00) / productInfo.price) * 100),
      features: ['plunge neckline', 'thick straps', 'built-in support', 'soft material'],
      matchingFeatures: 4,
      totalFeatures: 5,
      similarity: 0.94,
      bodyTypeRating: 9.5,
      sustainabilityScore: 7,
      reviewCount: 3456,
      avgRating: 4.6,
      url: `https://www.amazon.com/s?k=${encodeURIComponent('CRZ YOGA Matte Brushed Plunge Sports Bra')}`,
      reasoning: 'Nearly identical design with plunge neckline and built-in support. Known as a premium dupe with better durability. Many reviewers say it\'s higher quality than the original.',
      valueScore: 92,
      whyBetter: 'Better material quality, more durable, same style, $6.95 cheaper'
    },
    {
      rank: 2,
      name: 'GLOWMODE FeatherFit Plunge Active Cami',
      brand: 'SHEIN',
      platform: 'SHEIN',
      price: 14.50,
      originalPrice: productInfo.price,
      savings: (productInfo.price - 14.50).toFixed(2),
      savingsPercent: Math.round(((productInfo.price - 14.50) / productInfo.price) * 100),
      features: ['plunge neckline', 'soft material', 'high stretch'],
      matchingFeatures: 3,
      totalFeatures: 5,
      similarity: 0.89,
      bodyTypeRating: 8.5,
      sustainabilityScore: 3,
      reviewCount: 892,
      avgRating: 4.3,
      url: `https://www.shein.com/search?q=${encodeURIComponent('GLOWMODE FeatherFit Plunge Active Cami')}`,
      reasoning: 'Visually very similar with buttery-soft material. Lower price but less durable than original.',
      valueScore: 85,
      whyBetter: 'Much cheaper ($10.45 savings), good for trend pieces you won\'t wear long-term'
    },
    {
      rank: 3,
      name: 'Rush Hour Plunge Seamless Top',
      brand: 'Fashion Nova',
      platform: 'Fashion Nova',
      price: 12.99,
      originalPrice: productInfo.price,
      savings: (productInfo.price - 12.99).toFixed(2),
      savingsPercent: Math.round(((productInfo.price - 12.99) / productInfo.price) * 100),
      features: ['plunge neckline', 'seamless', 'ribbed'],
      matchingFeatures: 3,
      totalFeatures: 5,
      similarity: 0.85,
      bodyTypeRating: 7.0,
      sustainabilityScore: 2,
      reviewCount: 234,
      avgRating: 4.1,
      url: `https://www.fashionnova.com/search?q=${encodeURIComponent(productInfo.name)}`,
      reasoning: 'Same Instagram aesthetic with more ribbed texture. Budget option but quality concerns in reviews.',
      valueScore: 78,
      whyBetter: 'Cheapest option ($11.96 savings), good if you just want the look'
    }
  ];
}

/**
 * ENHANCED Advice Generation with detailed reasoning
 */
function generateAdviceDetailed(trustAnalysis, sentiment, bodyTypeMatch, dupes) {
  const trustScore = parseFloat(trustAnalysis.overallTrust);
  const sentimentScore = parseFloat(sentiment.score);
  const bodyScore = parseFloat(bodyTypeMatch.score);
  
  let recommendation = '';
  let headline = '';
  let reasoning = '';
  let actionSteps = [];
  let considerThis = [];

  // Decision logic with detailed explanations
  if (trustScore < 6.5) {
    // HIGH SPONSORED CONTENT
    recommendation = 'buy_dupe';
    headline = '⚠️ Consider a Dupe - Heavy Influencer Marketing Detected';
    reasoning = `Here's why we recommend looking at alternatives:\n\n1. **Trust Concerns**: ${trustAnalysis.explanation}\n\n2. **Marketing vs Reality**: ${trustAnalysis.sponsoredPercentage}% of reviews are sponsored. This means most positive feedback is from people who were paid or given free products. The actual customer experience may be different.\n\n3. **Better Value**: The top dupe (${dupes[0].name}) costs $${dupes[0].price} vs $${dupes[0].originalPrice} and has ${dupes[0].reviewCount} reviews with ${dupes[0].avgRating}/5 rating. ${dupes[0].whyBetter}`;
    
    actionSteps = [
      `Check out ${dupes[0].name} on ${dupes[0].platform} - it's highly similar but $${dupes[0].savings} cheaper`,
      'Read the verified, non-sponsored reviews for honest feedback',
      'Compare features side-by-side before deciding'
    ];

    considerThis = [
      `You're paying extra for influencer marketing costs, not better quality`,
      `${trustAnalysis.redFlags.length} red flags found in review patterns`,
      `Top dupe has ${dupes[0].reviewCount} reviews vs genuine feedback`
    ];

  } else if (bodyScore < 6 && bodyTypeMatch.reviewCount > 0) {
    // POOR BODY TYPE MATCH
    recommendation = 'buy_dupe';
    headline = `⚠️ Not Great For ${bodyTypeMatch.reasoning.split(' ')[0]} Body Types`;
    reasoning = `Here's what we found:\n\n1. **Body Type Mismatch**: ${bodyTypeMatch.reasoning}\n\n2. **What Similar People Said**: ${bodyTypeMatch.recommendation}\n\n3. **Alternative Option**: ${dupes[0].name} has a ${dupes[0].bodyTypeRating}/10 rating for your body type, which is better than the original's ${bodyScore}/10.`;
    
    actionSteps = [
      'Read the detailed reviews from people with your body type',
      `Consider ${dupes[0].name} which fits ${bodyTypeMatch.fitAnalysis.mostCommonFit}`,
      'Check the sizing chart carefully if you still want the original'
    ];

    considerThis = [
      bodyTypeMatch.whatThisMeans,
      `${bodyTypeMatch.reviewCount} reviews from your body type averaged ${bodyScore}/10`,
      'Fit issues are common with this product for your body type'
    ];

  } else {
    // GOOD CHOICE
    recommendation = 'buy_original';
    headline = '✅ Good Choice - Solid Product';
    reasoning = `This looks like a good purchase:\n\n1. **Trust**: ${trustAnalysis.explanation}\n\n2. **Customer Satisfaction**: ${sentiment.interpretation}\n\n3. **Body Type Fit**: ${bodyTypeMatch.recommendation || 'Generally works well across body types'}`;
    
    actionSteps = [
      'Check the sizing chart to confirm your size',
      sentiment.topCons.length > 0 ? `Note: Some customers mentioned ${sentiment.topCons[0]} - decide if that's a dealbreaker` : 'Read recent reviews for latest feedback',
      'Consider buying from a store with good return policy'
    ];

    considerThis = [
      `${trustAnalysis.verifiedCount} verified purchases support this`,
      sentiment.topPros.length > 0 ? `Most loved feature: ${sentiment.topPros[0]}` : 'Consistently positive feedback',
      `But you could save $${dupes[0].savings} with ${dupes[0].name} if budget matters`
    ];
  }

  return {
    recommendation,
    headline,
    reasoning,
    actionSteps,
    considerThis,
    bottomLine: recommendation === 'buy_dupe'
      ? `💡 Bottom line: You can get the same look and quality for less money without paying for influencer marketing costs.`
      : `💡 Bottom line: This is a solid choice based on genuine customer feedback. The positive reviews appear authentic.`,
    savingsIfDupe: recommendation === 'buy_dupe' ? `💰 Potential savings: $${dupes[0].savings} (${dupes[0].savingsPercent}%)` : null
  };
}