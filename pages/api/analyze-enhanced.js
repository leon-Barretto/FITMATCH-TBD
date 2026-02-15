// pages/api/analyze-enhanced-real.js

/**
 * HYBRID APPROACH: AI Analysis + Real Links
 * 
 * This combines:
 * 1. AI-powered analysis from Groq
 * 2. Real, clickable links to TikTok/Instagram/YouTube
 * 3. Direct links to product reviews
 * 4. Real alternative product searches
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { context, proportions, budget, social, values, itemUrl, hasImage, imageData } = req.body;

  if (!context || !values) {
    return res.status(400).json({ error: 'Context and Values are required' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ 
      error: 'API key not configured',
      hint: 'Create .env.local file with GROQ_API_KEY=your_key_here'
    });
  }

  try {
    console.log('🚀 Enhanced Analysis with Real Links Started');
    console.log('🔗 Item URL:', itemUrl);

    // Extract product info from URL if provided
    let productInfo = null;
    if (itemUrl) {
      productInfo = extractProductInfoFromUrl(itemUrl);
      console.log('📦 Product extracted:', productInfo);
    }

    // Build prompt for AI
    const prompt = buildAnalysisPrompt(context, proportions, budget, social, values, productInfo);

    console.log('🤖 Calling Groq API...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a fashion analysis expert. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = parseAIResponse(data);

    // Generate real social media links
    const socialContent = productInfo ? generateRealSocialLinks(productInfo) : [];
    
    // Generate real price alternative links
    const priceAlternatives = productInfo ? generateRealPriceAlternatives(productInfo, budget) : [];
    
    // Add real review link
    const reviews = productInfo ? generateRealReviewData(productInfo, itemUrl) : [];

    return res.status(200).json({
      success: true,
      data: {
        ...aiResponse,
        socialContent: socialContent.length > 0 ? socialContent : aiResponse.socialContent,
        priceAlternatives: priceAlternatives.length > 0 ? priceAlternatives : aiResponse.priceAlternatives,
        reviews: reviews.length > 0 ? reviews : aiResponse.reviews,
        reviewSummary: itemUrl ? { 
          avgRating: '—', 
          totalReviews: 'View on site', 
          recommendPercent: '—',
          reviewUrl: itemUrl 
        } : aiResponse.reviewSummary,
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message || 'AI service error',
    });
  }
}

/**
 * Extract product information from URL
 */
function extractProductInfoFromUrl(url) {
  console.log('🔍 Parsing URL:', url);

  let brand = 'Unknown';
  let productName = 'Item';
  let category = 'clothing';

  // Brand detection
  if (url.includes('garageclothing.com')) {
    brand = 'Garage Clothing';
  } else if (url.includes('zara.com')) {
    brand = 'Zara';
  } else if (url.includes('hm.com')) {
    brand = 'H&M';
  } else if (url.includes('shein.com')) {
    brand = 'SHEIN';
  } else if (url.includes('urbanoutfitters.com')) {
    brand = 'Urban Outfitters';
  } else if (url.includes('everlane.com')) {
    brand = 'Everlane';
  } else if (url.includes('patagonia.com')) {
    brand = 'Patagonia';
  }

  // Extract product name from URL path
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Garage Clothing format: /ca/p/snatch-booty-terry-pants/...
    if (brand === 'Garage Clothing' && pathParts.length >= 3) {
      productName = pathParts[2]
        .replace(/-/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    } else {
      // Generic: take last meaningful path segment
      const lastSegment = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
      if (lastSegment) {
        productName = lastSegment
          .replace(/\.html?$/, '')
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }
  } catch (e) {
    console.warn('Could not parse URL:', e);
  }

  // Category detection
  const urlLower = url.toLowerCase();
  if (urlLower.includes('pant') || urlLower.includes('jean') || urlLower.includes('trouser')) {
    category = 'pants';
  } else if (urlLower.includes('top') || urlLower.includes('shirt') || urlLower.includes('blouse')) {
    category = 'tops';
  } else if (urlLower.includes('dress')) {
    category = 'dresses';
  } else if (urlLower.includes('sweater') || urlLower.includes('hoodie') || urlLower.includes('cardigan')) {
    category = 'sweaters';
  }

  // Generate search terms and hashtags
  const productSlug = productName.toLowerCase().replace(/\s+/g, '');
  const brandSlug = brand.toLowerCase().replace(/\s+/g, '');

  return {
    brand,
    productName,
    category,
    url,
    hashtags: [
      `#${brandSlug}`,
      `#${productSlug}`,
      `#${brandSlug}haul`,
      `#${category}`,
      `#fashion`,
      `#ootd`
    ],
    searchTerms: [
      productName,
      `${brand} ${productName}`,
      `${brand} ${category}`,
      `${productName} review`,
      `${productName} try on`,
      `${productName} dupe`
    ]
  };
}

/**
 * Generate REAL social media links that actually work
 */
function generateRealSocialLinks(productInfo) {
  const links = [];

  // TikTok searches - these will actually open TikTok search
  const tiktokSearches = [
    productInfo.hashtags[1], // product name hashtag
    `${productInfo.brand} haul`,
    `${productInfo.productName} try on`
  ];

  tiktokSearches.slice(0, 2).forEach((searchTerm, i) => {
    const cleanSearch = searchTerm.replace('#', '');
    links.push({
      platform: 'tiktok',
      creator: `Search TikTok`,
      caption: `Find "${searchTerm}" videos on TikTok - See try-ons, reviews, and real people wearing this!`,
      views: 'Click to view',
      likes: '—',
      comments: '—',
      url: `https://www.tiktok.com/search?q=${encodeURIComponent(cleanSearch)}`,
      isSponsored: false,
      verified: false,
      isRealLink: true,
      searchTerm: searchTerm,
    });
  });

  // Instagram hashtag - opens Instagram explore
  const mainHashtag = productInfo.hashtags[1].replace('#', '');
  links.push({
    platform: 'instagram',
    creator: `Instagram Posts`,
    caption: `Browse ${productInfo.hashtags[1]} on Instagram - See how others style this item!`,
    views: 'Click to view',
    likes: '—',
    comments: '—',
    url: `https://www.instagram.com/explore/tags/${mainHashtag}/`,
    isSponsored: false,
    verified: false,
    isRealLink: true,
    searchTerm: productInfo.hashtags[1],
  });

  // YouTube search - opens YouTube search results
  links.push({
    platform: 'youtube',
    creator: `YouTube Reviews`,
    caption: `Watch "${productInfo.productName}" try-on hauls and reviews on YouTube`,
    views: 'Click to view',
    likes: '—',
    comments: '—',
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(productInfo.productName + ' review')}`,
    isSponsored: false,
    verified: false,
    isRealLink: true,
    searchTerm: `${productInfo.productName} review`,
  });

  // Dupe search on TikTok
  links.push({
    platform: 'tiktok',
    creator: `Find Dupes`,
    caption: `Search for "${productInfo.productName} dupe" to find cheaper alternatives!`,
    views: 'Click to view',
    likes: '—',
    comments: '—',
    url: `https://www.tiktok.com/search?q=${encodeURIComponent(productInfo.productName + ' dupe')}`,
    isSponsored: false,
    verified: false,
    isRealLink: true,
    searchTerm: `${productInfo.productName} dupe`,
    isDupeSearch: true,
  });

  return links;
}

/**
 * Generate REAL price alternative links
 */
function generateRealPriceAlternatives(productInfo, budgetStr) {
  const alternatives = [];

  // Budget: SHEIN/AliExpress
  alternatives.push({
    name: `Budget Alternative`,
    price: '$15-35',
    tier: 'budget',
    description: `Find affordable versions of "${productInfo.productName}" on SHEIN. Click to search their catalog.`,
    url: `https://www.shein.com/search?q=${encodeURIComponent(productInfo.category)}`,
    valueScore: '6/10',
    imageUrl: 'placeholder',
    isRealLink: true,
    platform: 'SHEIN',
  });

  // Mid-range: Similar brand
  const midBrand = productInfo.brand === 'Garage Clothing' ? 'Zara' : 'H&M';
  const midUrl = midBrand === 'Zara' 
    ? `https://www.zara.com/us/en/search?searchTerm=${encodeURIComponent(productInfo.category)}`
    : `https://www2.hm.com/en_us/search-results.html?q=${encodeURIComponent(productInfo.category)}`;

  alternatives.push({
    name: `Mid-Range Option`,
    price: '$40-70',
    tier: 'mid',
    description: `Browse similar styles at ${midBrand}. Quality basics at reasonable prices.`,
    url: midUrl,
    valueScore: '8/10',
    imageUrl: 'placeholder',
    isRealLink: true,
    platform: midBrand,
  });

  // Premium: Everlane/Patagonia
  alternatives.push({
    name: `Premium Sustainable`,
    price: '$80-150',
    tier: 'premium',
    description: `High-quality, ethically-made alternatives from Everlane. Better materials, fair trade production.`,
    url: `https://www.everlane.com/search?q=${encodeURIComponent(productInfo.category)}`,
    valueScore: '9/10',
    imageUrl: 'placeholder',
    isRealLink: true,
    platform: 'Everlane',
  });

  return alternatives;
}

/**
 * Generate real review link
 */
function generateRealReviewData(productInfo, itemUrl) {
  return [{
    author: 'Real Customer Reviews',
    rating: 0,
    title: 'View reviews on product page',
    text: `This product has real customer reviews on ${productInfo.brand}'s website. Click the link below to read reviews with height, weight, size ordered, fit feedback, and verified purchase status.`,
    date: 'Visit site',
    verified: true,
    pros: ['Real customer feedback with body measurements', 'Verified purchase reviews', 'Fit and sizing information'],
    cons: [],
    reviewUrl: itemUrl,
  }];
}

/**
 * Build AI analysis prompt
 */
function buildAnalysisPrompt(context, proportions, budget, social, values, productInfo) {
  let prompt = `You are a fashion decision counselor. Analyze this situation and respond with ONLY valid JSON (no markdown).

User's Situation:
- Context/Occasion: ${context}
- Body Proportions: ${proportions || 'Not specified'}
- Budget: ${budget || 'Not specified'}
- Social Influences: ${social || 'Not specified'}
- Personal Values: ${values}`;

  if (productInfo) {
    prompt += `
- Specific Item: ${productInfo.productName} from ${productInfo.brand}
- Item URL: ${productInfo.url}`;
  }

  prompt += `

Generate JSON with these fields:
{
  "recommendation": "2-3 sentence recommendation",
  "valueAlignment": 7,
  "influencerRisk": 5,
  "budgetFeasibility": 6,
  "qualityScore": 7,
  "versatilityScore": 8,
  "sustainabilityScore": 6,
  "overallScore": 7,
  "radarScores": {
    "values": 7,
    "quality": 7,
    "budget": 6,
    "versatility": 8,
    "sustainability": 6
  },
  "tradeoffs": ["trade-off 1", "trade-off 2", "..."],
  "reflectionPrompts": ["question 1", "question 2", "..."],
  "biasWarnings": ["bias 1", "bias 2", "..."],
  "actionSteps": ["step 1", "step 2", "..."]
}

Respond with JSON only, no markdown.`;

  return prompt;
}

/**
 * Parse AI response
 */
function parseAIResponse(data) {
  const fullText = data.choices[0].message.content;
  const cleanedText = fullText.replace(/```json|```/g, '').trim();
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    recommendation: parsed.recommendation || 'Consider your values when making this choice.',
    valueAlignment: parsed.valueAlignment || 7,
    influencerRisk: parsed.influencerRisk || 5,
    budgetFeasibility: parsed.budgetFeasibility || 6,
    qualityScore: parsed.qualityScore || 7,
    versatilityScore: parsed.versatilityScore || 8,
    sustainabilityScore: parsed.sustainabilityScore || 6,
    overallScore: parsed.overallScore || 7,
    radarScores: parsed.radarScores || {
      values: 7,
      quality: 7,
      budget: 6,
      versatility: 8,
      sustainability: 6,
    },
    tradeoffs: parsed.tradeoffs || [],
    reflectionPrompts: parsed.reflectionPrompts || [],
    biasWarnings: parsed.biasWarnings || [],
    actionSteps: parsed.actionSteps || [],
    socialContent: [],
    priceAlternatives: [],
    reviews: [],
    reviewSummary: null,
  };
}