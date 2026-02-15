import { useState } from 'react';
import AgentOutputEnhanced from './AgentOutputEnhanced';

export default function DecisionFlowEnhanced() {
  const [inputs, setInputs] = useState({
    context: '',
    proportions: '',
    budget: '',
    social: '',
    values: '',
    imageFile: null,
    imagePreview: null,
    itemUrl: '',
  });

  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setInputs((s) => ({ ...s, [e.target.name]: e.target.value }));
    setError(null);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputs((s) => ({
          ...s,
          imageFile: file,
          imagePreview: reader.result, // This will be base64
        }));
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage() {
    setInputs((s) => ({
      ...s,
      imageFile: null,
      imagePreview: null,
    }));
  }

  async function handleGenerate() {
    if (!inputs.context || !inputs.values) {
      setError('Please fill in at least Context and Values');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare request data
      const requestData = {
        context: inputs.context,
        proportions: inputs.proportions,
        budget: inputs.budget,
        social: inputs.social,
        values: inputs.values,
        itemUrl: inputs.itemUrl,
        hasImage: !!inputs.imagePreview,
        imageData: inputs.imagePreview, // Base64 image with data:image prefix
      };

      console.log('📤 Sending request with:', {
        ...requestData,
        imageData: requestData.imageData ? '(base64 data present)' : null,
      });

      const response = await fetch('/api/analyze-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('📥 Received response:', result);

      if (!response.ok) {
        throw new Error(result.error || `API error: ${response.status}`);
      }

      if (result.success && result.data) {
        setAgentData(result.data);
        
        // Debug: Check if enhanced features are present
        console.log('✅ Enhanced features:', {
          priceAlternatives: result.data.priceAlternatives?.length || 0,
          socialContent: result.data.socialContent?.length || 0,
          reviews: result.data.reviews?.length || 0,
        });

        // Scroll to results
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      } else {
        throw new Error(result.error || 'Failed to generate analysis');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInputs({
      context: '',
      proportions: '',
      budget: '',
      social: '',
      values: '',
      imageFile: null,
      imagePreview: null,
      itemUrl: '',
    });
    setAgentData(null);
    setError(null);
  }

  const hasEnhancedInput = inputs.imagePreview || inputs.itemUrl;

  return (
    <section id="flow" className="animate-slideUp">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Enhanced Decision Flow</h2>
          <p className="text-gray-600 mt-2">
            Upload an image or paste a link for AI-powered analysis, price comparisons, and social media insights.
          </p>
        </div>

        {/* Image Upload Section - OPTIONAL */}
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-indigo-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            📸 Want Price Comparisons & Social Media Insights?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload an image or paste a URL to unlock enhanced features (completely optional!)
          </p>
          
          {!inputs.imagePreview ? (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload outfit image
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    We'll find similar items at different price points
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Max 5MB • JPG, PNG, WEBP
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={inputs.imagePreview}
                alt="Uploaded outfit"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 shadow-lg"
              >
                ✕ Remove
              </button>
              <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-lg">
                ✓ Image Ready
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Or paste item URL (for reviews & social media)
            </label>
            <input
              name="itemUrl"
              value={inputs.itemUrl}
              onChange={handleChange}
              placeholder="e.g., https://zara.com/... or Instagram post link"
              className="glass-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll extract reviews and find related social media content
            </p>
          </div>
        </div>

        {/* Original Form Fields */}
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
              placeholder="e.g., Instagram, TikTok, friends"
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                ✨ Analyze {hasEnhancedInput && '(Enhanced Mode)'}
              </>
            )}
          </button>
          <button onClick={handleClear} className="btn-secondary">
            Clear
          </button>
        </div>
        
        {hasEnhancedInput && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium flex items-center gap-2">
              <span>⚡</span> 
              Enhanced features enabled: You'll get price alternatives, social media insights, and customer reviews!
            </p>
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {agentData && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <strong>Debug:</strong> Enhanced data present: 
            Prices={agentData.priceAlternatives?.length || 0}, 
            Social={agentData.socialContent?.length || 0}, 
            Reviews={agentData.reviews?.length || 0}
          </div>
        )}
      </div>

      {agentData && <AgentOutputEnhanced data={agentData} />}
    </section>
  );
}