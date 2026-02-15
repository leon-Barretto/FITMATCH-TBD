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
    console.log('📝 Has Image:', hasImage);
    console.log('🔗 Has URL:', !!itemUrl);

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

${hasImage || itemUrl ? `
--- ENHANCED FEATURES (only include these since user provided image/URL) ---

13. "priceAlternatives": Array of exactly 3 similar items at different price points:
   - Budget option (30-50% cheaper than mid-range)
   - Mid-range option (baseline price)
   - Premium option (50-100% more expensive than mid-range)
   Each with: { "name": "specific item name", "price": "$XX", "tier": "budget|mid|premium", "description": "2-3 sentence description highlighting key features", "url": "#", "valueScore": X/10, "imageUrl": "placeholder" }

14. "socialContent": Array of exactly 3 diverse social media posts/videos about similar fashion items:
   Mix of platforms: 1 TikTok, 1 Instagram, 1 YouTube
   Each with: { "platform": "tiktok|instagram|youtube", "creator": "realistic creator name", "caption": "realistic post caption about the style/item", "views": "realistic number like 45K", "likes": "realistic number like 3.2K", "comments": "realistic number like 189", "url": "#", "isSponsored": true/false (make 1 sponsored), "verified": true/false }

15. "reviews": Array of exactly 4 realistic customer reviews with variety of ratings:
   Mix: 1 five-star, 1 four-star, 1 three-star, 1 two-star
   Each with: { "author": "First name or initials", "rating": 2-5, "title": "short review title", "text": "2-3 sentence realistic review", "date": "recent date like Jan 2025", "verified": true/false, "pros": ["specific pro 1", "specific pro 2"], "cons": ["specific con 1"] }

16. "reviewSummary": { "avgRating": 3.5-4.5, "totalReviews": 200-500, "recommendPercent": 70-85 }
` : ''}

IMPORTANT: Respond ONLY with valid JSON. No markdown formatting, no code blocks, no other text.`;

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
            content: 'You are a helpful assistant that responds only in valid JSON format. Generate realistic mock data for social media content, reviews, and price alternatives when requested.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.8, // Slightly higher for creative mock data
        max_tokens: 4000, // More tokens for enhanced data
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
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      return res.status(500).json({ 
        error: 'Failed to parse AI response', 
        rawResponse: fullText.substring(0, 500) 
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✨ Enhanced analysis complete!');

    // Return enhanced data structure
    return res.status(200).json({
      success: true,
      data: {
        // Core analysis
        recommendation: parsed.recommendation || 'Consider your values when making this choice.',
        valueAlignment: parsed.valueAlignment || 7,
        influencerRisk: parsed.influencerRisk || 5,
        budgetFeasibility: parsed.budgetFeasibility || 6,
        qualityScore: parsed.qualityScore || 6,
        versatilityScore: parsed.versatilityScore || 7,
        sustainabilityScore: parsed.sustainabilityScore || 5,
        overallScore: parsed.overallScore || 7,
        
        // Radar chart scores for visualization
        radarScores: {
          values: parsed.valueAlignment || 7,
          quality: parsed.qualityScore || 6,
          budget: parsed.budgetFeasibility || 6,
          versatility: parsed.versatilityScore || 7,
          sustainability: parsed.sustainabilityScore || 5,
        },
        
        // Critical thinking prompts
        tradeoffs: Array.isArray(parsed.tradeoffs) ? parsed.tradeoffs : [],
        reflectionPrompts: Array.isArray(parsed.reflectionPrompts) ? parsed.reflectionPrompts : [],
        biasWarnings: Array.isArray(parsed.biasWarnings) ? parsed.biasWarnings : [],
        actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : [],
        
        // Enhanced features (only if image/URL provided)
        priceAlternatives: hasImage || itemUrl ? (Array.isArray(parsed.priceAlternatives) ? parsed.priceAlternatives : []) : undefined,
        socialContent: hasImage || itemUrl ? (Array.isArray(parsed.socialContent) ? parsed.socialContent : []) : undefined,
        reviews: hasImage || itemUrl ? (Array.isArray(parsed.reviews) ? parsed.reviews : []) : undefined,
        reviewSummary: hasImage || itemUrl ? parsed.reviewSummary : undefined,
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message || 'AI service error',
      details: error.toString()
    });
  }
}
