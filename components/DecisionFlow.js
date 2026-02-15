import { useState } from 'react';
import AgentOutput from './AgentOutput';

function synthesizeAgent({ context, proportions, budget, social, values }) {
  const tradeoffs = [];
  if (budget.toLowerCase().includes('low')) tradeoffs.push('Prioritize durability over brand prestige');
  if (social.toLowerCase().includes('influencer')) tradeoffs.push('Short-term trend vs. long-term wardrobe fit');
  if (proportions.toLowerCase().includes('petite')) tradeoffs.push('Tailoring costs vs. off-the-rack fit');
  if (tradeoffs.length === 0) tradeoffs.push('Balance aesthetics, fit, and cost');

  const recommendation = `Consider a versatile piece that matches your ${values} and fits your stated budget.`;

  const reflection = [
    'Why does this option feel aligned with your identity?',
    'What long-term value does this purchase bring?',
    'Who benefits besides you from this choice?'
  ];

  return {
    situation: { context, proportions, budget, social, values },
    tradeoffs,
    recommendation,
    reflection
  };
}

export default function DecisionFlow() {
  const [inputs, setInputs] = useState({
    context: '',
    proportions: '',
    budget: '',
    social: '',
    values: ''
  });

  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setInputs((s) => ({ ...s, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleGenerate() {
    if (!inputs.context || !inputs.values) {
      setError('Please fill in at least Context and Values');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAgentData(result.data);
      } else {
        throw new Error(result.error || 'Failed to generate analysis');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to analyze. Make sure your Replicate API key is set in .env.local');
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInputs({ context: '', proportions: '', budget: '', social: '', values: '' });
    setAgentData(null);
    setError(null);
  }

  return (
    <section id="flow" className="animate-slideUp">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Decision Flow</h2>
          <p className="text-gray-600 mt-2">Describe your situation to receive AI-powered analysis and reflection prompts.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Context & Occasion <span className="text-indigo-600">*</span>
            </label>
            <input
              name="context"
              value={inputs.context}
              onChange={handleChange}
              placeholder="e.g., Casual weekend outings"
              className="glass-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Where and when will you wear this?</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Body & Proportions
            </label>
            <input
              name="proportions"
              value={inputs.proportions}
              onChange={handleChange}
              placeholder="e.g., Petite, curvy, athletic"
              className="glass-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Your body frame and proportions</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Budget Range
            </label>
            <input
              name="budget"
              value={inputs.budget}
              onChange={handleChange}
              placeholder="e.g., $50–$150"
              className="glass-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Your budget for this item</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Social Influences
            </label>
            <input
              name="social"
              value={inputs.social}
              onChange={handleChange}
              placeholder="e.g., Instagram, friends, work peers"
              className="glass-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Who or what influences your choices?</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Personal Values <span className="text-indigo-600">*</span>
            </label>
            <input
              name="values"
              value={inputs.values}
              onChange={handleChange}
              placeholder="e.g., Sustainability, comfort, minimalism, affordability"
              className="glass-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">What matters most to you in this purchase?</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={loading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
          <button onClick={handleClear} className="btn-secondary">
            Clear
          </button>
        </div>
      </div>

      <AgentOutput data={agentData} />
    </section>
  );
}