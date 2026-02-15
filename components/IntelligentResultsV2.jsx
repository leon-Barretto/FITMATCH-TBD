{/* ADVICE TAB - ENHANCED WITH FULL DETAILS */}
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

    {/* DETAILED REASONING SECTION */}
    {advice.reasoning && (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <h4 className="text-2xl font-bold text-gray-900 mb-6">
          📊 Why We Recommend This:
        </h4>
        
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

        {/* Consider This Section */}
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

    {/* Fallback for old data */}
    {!advice.reasoning && advice.advice && (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <p className="text-lg text-gray-700 leading-relaxed">
          {advice.advice}
        </p>
      </div>
    )}

    {/* Link to Dupes */}
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