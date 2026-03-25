import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../Auth/LoginForm';
import SignupForm from '../Auth/SignupForm';

const LandingPage = ({ onNavigateToApp }) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      onNavigateToApp?.();
    }
  }, [user, onNavigateToApp]);

  const openLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const openSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const switchMode = () => {
    setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  const features = [
    {
      icon: 'fa-calendar-check',
      title: 'Smart Scheduling',
      description: 'Schedule posts across all platforms from a single dashboard. Our intelligent system finds the optimal posting times for maximum engagement.'
    },
    {
      icon: 'fa-chart-line',
      title: 'Advanced Analytics',
      description: 'Track performance metrics, engagement rates, and audience growth. Get detailed insights to optimize your content strategy.'
    },
    {
      icon: 'fa-robot',
      title: 'AI-Powered Insights',
      description: 'Our AI analyzes your audience behavior to suggest the best times to post and the most effective content strategies.'
    },
    {
      icon: 'fa-globe',
      title: 'Multi-Platform Support',
      description: 'Publish to Twitter, Instagram, LinkedIn, Facebook, and more - all from one unified interface with platform-specific optimization.'
    },
    {
      icon: 'fa-users',
      title: 'Team Collaboration',
      description: 'Invite team members, assign roles, and collaborate on content creation with real-time presence indicators and approval workflows.'
    },
    {
      icon: 'fa-magic',
      title: 'AI Content Generation',
      description: 'Generate engaging captions, hashtags, and content ideas with our built-in AI assistant. Save time while maintaining quality.'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      description: 'Perfect for individuals starting out',
      features: [
        'Up to 10 posts per month',
        '3 social platforms',
        'Basic analytics',
        'Email support'
      ],
      cta: 'Get Started',
      popular: false,
      onClick: openSignup
    },
    {
      name: 'Professional',
      price: '$19',
      period: '/month',
      description: 'For growing businesses and creators',
      features: [
        'Unlimited posts',
        'All social platforms',
        'Advanced analytics',
        'AI-powered insights',
        'Team collaboration (up to 5)',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true,
      onClick: openSignup
    },
    {
      name: 'Enterprise',
      price: '$49',
      period: '/month',
      description: 'For teams and agencies',
      features: [
        'Everything in Professional',
        'Unlimited team members',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
        'Custom reporting'
      ],
      cta: 'Contact Sales',
      popular: false,
      onClick: openSignup
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '2M+', label: 'Posts Published' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-bolt text-white text-lg"></i>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">ContentCadence</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Testimonials</a>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={openLogin}
                className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={openSignup}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300/30 dark:bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/30 dark:bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Trusted by 50,000+ content creators</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              Schedule Smarter.
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Publish Faster.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              The all-in-one social media scheduler that uses AI to find the perfect posting times and create engaging content automatically.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button 
                onClick={openSignup}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Start Free Trial
              </button>
              <button 
                onClick={openLogin}
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-lg font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:-translate-y-1"
              >
                View Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-gray-900 via-transparent to-transparent z-10"></div>
            <div className="mx-auto max-w-5xl">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 min-h-[300px] flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-chart-dashboard text-6xl mb-4 opacity-50"></i>
                    <p className="text-lg">Interactive Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to streamline your social media workflow and maximize your reach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:shadow-xl"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <i className={`fas ${feature.icon} text-white text-2xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 ${
                  plan.popular 
                    ? 'ring-2 ring-indigo-500 shadow-2xl scale-105 md:scale-110' 
                    : 'border border-gray-200 dark:border-gray-700 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center text-gray-600 dark:text-gray-300">
                      <i className="fas fa-check text-green-500 mr-3"></i>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={plan.onClick}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join thousands of content creators who are saving time and growing their audience with ContentCadence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={openSignup}
              className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-bolt text-white text-sm"></i>
                </div>
                <span className="text-lg font-bold text-white">ContentCadence</span>
              </div>
              <p className="text-sm">Making social media management effortless for creators and businesses.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm">&copy; 2024 ContentCadence. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="fab fa-twitter text-xl"></i></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="fab fa-github text-xl"></i></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="fab fa-linkedin text-xl"></i></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-12 right-0 text-gray-400 hover:text-white text-2xl"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
              {authMode === 'login' ? (
                <LoginForm onSwitchToSignup={switchMode} />
              ) : (
                <SignupForm onSwitchToLogin={switchMode} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;