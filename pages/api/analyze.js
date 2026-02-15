// pages/api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { context, proportions, budget, social, values } = req.body;

  if (!context || !values) {
    return res.status(400).json({ error: 'Context and Values are required' });
  }

  // Check if API key exists
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found');
    return res.status(500).json({ 
      error: 'API key not configured',
      hint: 'Create .env.local with GROQ_API_KEY and restart server'
    });
  }

  try {
    console.log('🔧 API Key present:', !!process.env.GROQ_API_KEY);
    console.log('📝 Inputs:', { context, proportions, budget, social, values });

    const prompt = `You are a fashion decision counselor helping someone make thoughtful, intentional purchases. Analyze their situation deeply.

User's Situation:
- Context/Occasion: ${context}
- Body Proportions: ${proportions || 'Not specified'}
- Budget: ${budget || 'Not specified'}
- Social Influences: ${social || 'Not specified'}
- Personal Values: ${values}

Generate a DETAILED structured JSON response with:
1. "recommendation": 2-3 sentence actionable recommendation aligned with their values
2. "valueAlignment": Score 1-10 how well potential purchases align with their stated values
3. "influencerRisk": Score 1-10 how much they should watch for influencer bias
4. "budgetFeasibility": Score 1-10 ease of finding quality items in their budget
5. "tradeoffs": Array of 5+ key trade-offs they should consider (as strings)
6. "reflectionPrompts": Array of 6+ deep reflection questions (as strings)
7. "biasWarnings": Array of 3+ psychological biases to watch for (as strings)
8. "actionSteps": Array of 4+ concrete next steps (as strings)

Respond ONLY with valid JSON, no markdown formatting, no other text.`;

    console.log('🚀 Calling Groq API...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Updated model name!
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that responds only in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error:', response.status, errorText);
      return res.status(500).json({ 
        error: `Groq API error: ${response.status}`,
        details: errorText.substring(0, 200),
        hint: 'Check if your API key is valid at console.groq.com'
      });
    }

    const data = await response.json();
    console.log('✅ Groq response received');

    const fullText = data.choices[0].message.content;
    console.log('📄 Response length:', fullText.length);

    // Extract JSON from the response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      return res.status(500).json({ 
        error: 'Failed to parse AI response', 
        rawResponse: fullText.substring(0, 500) 
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✨ Successfully parsed JSON!');

    return res.status(200).json({
      success: true,
      data: {
        recommendation: parsed.recommendation || 'Consider your values when making this choice.',
        valueAlignment: parsed.valueAlignment || 7,
        influencerRisk: parsed.influencerRisk || 5,
        budgetFeasibility: parsed.budgetFeasibility || 6,
        tradeoffs: Array.isArray(parsed.tradeoffs) ? parsed.tradeoffs : [],
        reflectionPrompts: Array.isArray(parsed.reflectionPrompts) ? parsed.reflectionPrompts : [],
        biasWarnings: Array.isArray(parsed.biasWarnings) ? parsed.biasWarnings : [],
        actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : [],
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