// pages/api/analyze-enhanced.js
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
    console.log('🚀 Enhanced Analysis Started');
    console.log('📷 Has Image:', hasImage);
    console.log('🔗 Has URL:', !!itemUrl);
    console.log('📸 Image data length:', imageData?.length || 0);

    // Determine if we should generate enhanced features
    const shouldEnhance = hasImage || itemUrl;
    console.log('⚡ Enhanced mode:', shouldEnhance);

    // Build enhanced prompt
    let enhancedPrompt = `You are an advanced fashion decision counselor with expertise in consumer psychology, fashion trends, and critical thinking. Analyze this situation deeply and provide comprehensive insights.

User's Situation:
- Context/Occasion: ${context}
- Body Proportions: ${proportions || 'Not specified'}
- Budget: ${budget || 'Not specified'}
- Social Influences: ${social || 'Not specified'}
- Personal Values: ${values}
${hasImage ? '- User has uploaded an image of an outfit they are considering' : ''}
${itemUrl ? `- User provided item URL: ${itemUrl}` : ''}

Generate a DETAILED structured JSON response with ALL of these fields:

CORE ANALYSIS (always include):
1. "recommendation": 2-3 sentence actionable recommendation aligned with their values
2. "valueAlignment": Score 1-10 how well potential purchases align with their stated values
3. "influencerRisk": Score 1-10 how much they should watch for influencer bias
4. "budgetFeasibility": Score 1-10 ease of finding quality items in their budget
5. "qualityScore": Score 1-10 for expected quality vs price ratio
6. "versatilityScore": Score 1-10 for how versatile the item would be
7. "sustainabilityScore": Score 1-10 for sustainability considerations
8. "overallScore": Overall FitMatch score 1-10 (weighted average)

9. "tradeoffs": Array of 6+ key trade-offs they should consider (strings)
10. "reflectionPrompts": Array of 8+ deep reflection questions (strings)
11. "biasWarnings": Array of 4+ psychological biases to watch for (strings)
12. "actionSteps": Array of 5+ concrete next steps (strings)
`;

    // Add enhanced features section if user uploaded image or URL
    if (shouldEnhance) {
      enhancedPrompt += `
--- ENHANCED FEATURES (REQUIRED - user provided image/URL) ---

13. "priceAlternatives": Array of EXACTLY 3 similar fashion items at different price points.
   Create realistic, specific product recommendations:
   [
     {
       "name": "Specific item name (e.g., 'Zara Textured Knit Sweater')",
       "price": "$XX (use realistic prices)",
       "tier": "budget",
       "description": "2-3 sentence description highlighting key features, material, and why it's a good budget option",
       "url": "#",
       "valueScore": "7/10",
       "imageUrl": "placeholder"
     },
     {
       "name": "Different specific mid-range item",
       "price": "$XX (50-100% more than budget)",
       "tier": "mid",
       "description": "2-3 sentences about quality improvements and features",
       "url": "#",
       "valueScore": "8/10",
       "imageUrl": "placeholder"
     },
     {
       "name": "Different specific premium item",
       "price": "$XX (200-300% of budget price)",
       "tier": "premium",
       "description": "2-3 sentences about luxury features and investment value",
       "url": "#",
       "valueScore": "9/10",
       "imageUrl": "placeholder"
     }
   ]

14. "socialContent": Array of EXACTLY 3 realistic social media posts from different platforms.
   Create diverse, believable content:
   [
     {
       "platform": "tiktok",
       "creator": "@fashionuser123",
       "caption": "Realistic TikTok caption about styling this type of item (1-2 sentences, use emojis)",
       "views": "125K",
       "likes": "8.4K",
       "comments": "342",
       "url": "#",
       "isSponsored": false,
       "verified": false
     },
     {
       "platform": "instagram",
       "creator": "@styleinspiration",
       "caption": "Realistic Instagram caption (1-2 sentences with relevant hashtags)",
       "views": "45K",
       "likes": "3.2K",
       "comments": "127",
       "url": "#",
       "isSponsored": true,
       "verified": true
     },
     {
       "platform": "youtube",
       "creator": "Fashion Hauls Daily",
       "caption": "Realistic YouTube video title about this type of item",
       "views": "89K",
       "likes": "5.6K",
       "comments": "234",
       "url": "#",
       "isSponsored": false,
       "verified": true
     }
   ]

15. "reviews": Array of EXACTLY 4 realistic customer reviews with mixed ratings.
   Create believable, specific reviews:
   [
     {
       "author": "Sarah M.",
       "rating": 5,
       "title": "Perfect fit and quality!",
       "text": "2-3 sentences with specific praise about fit, quality, comfort, or style",
       "date": "Jan 2025",
       "verified": true,
       "pros": ["specific positive 1", "specific positive 2"],
       "cons": ["minor critique if any"]
     },
     {
       "author": "Jennifer K.",
       "rating": 4,
       "title": "Good but...",
       "text": "2-3 sentences with mostly positive but some reservations",
       "date": "Dec 2024",
       "verified": true,
       "pros": ["specific positive"],
       "cons": ["specific critique"]
     },
     {
       "author": "Mike R.",
       "rating": 3,
       "title": "Mixed feelings",
       "text": "2-3 sentences with balanced pros and cons",
       "date": "Dec 2024",
       "verified": false,
       "pros": ["one positive"],
       "cons": ["specific issue 1", "specific issue 2"]
     },
     {
       "author": "Emma L.",
       "rating": 2,
       "title": "Disappointed",
       "text": "2-3 sentences explaining specific disappointments",
       "date": "Nov 2024",
       "verified": true,
       "pros": [],
       "cons": ["specific problem 1", "specific problem 2"]
     }
   ]

16. "reviewSummary": {
     "avgRating": 3.8,
     "totalReviews": 347,
     "recommendPercent": 76
   }

CRITICAL: You MUST include ALL enhanced features (priceAlternatives, socialContent, reviews, reviewSummary) with the exact structure shown above. Do not skip any fields.
`;
    }

    enhancedPrompt += `

IMPORTANT: 
- Respond ONLY with valid JSON
- No markdown formatting, no code blocks (no \`\`\`json), no other text
- Start directly with {
- Ensure all arrays have the specified number of items
${shouldEnhance ? '- MUST include all enhanced features (priceAlternatives, socialContent, reviews, reviewSummary)' : ''}`;

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
            content: 'You are a helpful assistant that responds ONLY in valid JSON format. Generate realistic mock data for social media content, reviews, and price alternatives when requested. Do not use markdown code blocks - respond with raw JSON only.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error:', response.status, errorText);
      return res.status(500).json({ 
        error: `Groq API error: ${response.status}`,
        details: errorText.substring(0, 200)
      });
    }

    const data = await response.json();
    console.log('✅ Groq response received');

    const fullText = data.choices[0].message.content;
    console.log('📄 Response preview:', fullText.substring(0, 200));

    // Clean the response - remove markdown code blocks if present
    let cleanedText = fullText.trim();
    cleanedText = cleanedText.replace(/```json\s*/g, '');
    cleanedText = cleanedText.replace(/```\s*/g, '');
    cleanedText = cleanedText.trim();

    // Extract JSON from the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      console.error('Full response:', fullText.substring(0, 1000));
      return res.status(500).json({ 
        error: 'Failed to parse AI response', 
        rawResponse: fullText.substring(0, 500) 
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✨ Successfully parsed JSON!');
    
    // Log enhanced features presence
    if (shouldEnhance) {
      console.log('🔍 Enhanced features check:');
      console.log('  - priceAlternatives:', Array.isArray(parsed.priceAlternatives) ? `${parsed.priceAlternatives.length} items` : 'MISSING');
      console.log('  - socialContent:', Array.isArray(parsed.socialContent) ? `${parsed.socialContent.length} items` : 'MISSING');
      console.log('  - reviews:', Array.isArray(parsed.reviews) ? `${parsed.reviews.length} items` : 'MISSING');
      console.log('  - reviewSummary:', parsed.reviewSummary ? 'present' : 'MISSING');
    }

    // Build response with proper defaults
    const responseData = {
      success: true,
      data: {
        // Core analysis (always present)
        recommendation: parsed.recommendation || 'Consider your values when making this choice.',
        valueAlignment: parsed.valueAlignment || 7,
        influencerRisk: parsed.influencerRisk || 5,
        budgetFeasibility: parsed.budgetFeasibility || 6,
        qualityScore: parsed.qualityScore || 6,
        versatilityScore: parsed.versatilityScore || 7,
        sustainabilityScore: parsed.sustainabilityScore || 5,
        overallScore: parsed.overallScore || 7,
        
        // Radar chart scores
        radarScores: {
          values: parsed.valueAlignment || 7,
          quality: parsed.qualityScore || 6,
          budget: parsed.budgetFeasibility || 6,
          versatility: parsed.versatilityScore || 7,
          sustainability: parsed.sustainabilityScore || 5,
        },
        
        // Critical thinking prompts (always present)
        tradeoffs: Array.isArray(parsed.tradeoffs) ? parsed.tradeoffs : [],
        reflectionPrompts: Array.isArray(parsed.reflectionPrompts) ? parsed.reflectionPrompts : [],
        biasWarnings: Array.isArray(parsed.biasWarnings) ? parsed.biasWarnings : [],
        actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : [],
      },
    };

    // Add enhanced features if they were requested AND generated
    if (shouldEnhance) {
      if (Array.isArray(parsed.priceAlternatives) && parsed.priceAlternatives.length > 0) {
        responseData.data.priceAlternatives = parsed.priceAlternatives;
      } else {
        console.warn('⚠️ priceAlternatives missing or empty');
      }

      if (Array.isArray(parsed.socialContent) && parsed.socialContent.length > 0) {
        responseData.data.socialContent = parsed.socialContent;
      } else {
        console.warn('⚠️ socialContent missing or empty');
      }

      if (Array.isArray(parsed.reviews) && parsed.reviews.length > 0) {
        responseData.data.reviews = parsed.reviews;
      } else {
        console.warn('⚠️ reviews missing or empty');
      }

      if (parsed.reviewSummary) {
        responseData.data.reviewSummary = parsed.reviewSummary;
      } else {
        console.warn('⚠️ reviewSummary missing');
      }
    }

    console.log('📦 Final response data keys:', Object.keys(responseData.data));
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message || 'AI service error',
      details: error.toString()
    });
  }
}