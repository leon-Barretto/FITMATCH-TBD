import Layout from '../components/Layout';
import DecisionFlow from '../components/DecisionFlow';

export default function Home() {
  return (
    <Layout>
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="animate-slideUp">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Think before
              </span>
              <br />
              <span className="text-gray-900">you buy</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
              Deinfluence Reflect goes beyond recommendations. Explore trade-offs, question assumptions, and strengthen your critical thinking about everyday consumer choices.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <button className="btn-primary">Get Started</button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          {[
            { 
              icon: '🎯', 
              title: 'Structured Analysis', 
              desc: 'Break down decisions into context, body proportions, budget, and personal values.'
            },
            { 
              icon: '⚖️', 
              title: 'Trade-off Mapping', 
              desc: 'Understand competing priorities and how different factors influence your choice.'
            },
            { 
              icon: '🧠', 
              title: 'Critical Reflection', 
              desc: 'Deepen your thinking with guided prompts that challenge assumptions and biases.'
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

        {/* Main Decision Flow */}
        <DecisionFlow />
      </div>
    </Layout>
  );
}