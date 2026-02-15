import Layout from '../components/Layout';
import IntelligentDecisionFlow from '../components/IntelligentDecisionFlow';

export default function Home() {
  return (
    <Layout>
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="animate-slideUp">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Find Dupes
              </span>
              <br />
              <span className="text-gray-900">with AI</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
              Our AI detects fake reviews, finds cheaper dupes, and gives you honest advice. Stop paying for influencer marketing.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <a href="#flow" className="btn-primary">Try It Now</a>
              <button className="btn-secondary">Learn More</button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          {[
            { 
              icon: '🔍', 
              title: 'Detects Fake Reviews', 
              desc: 'AI spots #ad posts, suspicious patterns, and sponsored content to show you the truth.'
            },
            { 
              icon: '💰', 
              title: 'Finds Real Dupes', 
              desc: 'Search across Amazon, SHEIN, Fashion Nova for 90%+ similar items at lower prices.'
            },
            { 
              icon: '🧠', 
              title: 'Smart Advice', 
              desc: 'Get honest recommendations based on trust scores, body type match, and your values.'
            }
          ].map((item, i) => (
            <div 
              key={i} 
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-indigo-200 transition-colors duration-200 animate-slideUp"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Main Intelligent Decision Flow */}
        <IntelligentDecisionFlow />
      </div>
    </Layout>
  );
}