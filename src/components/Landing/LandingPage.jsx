import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../Auth/LoginForm';
import SignupForm from '../Auth/SignupForm';

// Reusable Inline Button Component
const Button = React.forwardRef(({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-white text-black hover:bg-gray-100",
    secondary: "bg-gray-800 text-white hover:bg-gray-700",
    ghost: "hover:bg-gray-800/50 text-white",
    gradient: "bg-gradient-to-b from-white via-white/95 to-white/60 text-black hover:scale-105 active:scale-95"
  };
  
  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-10 px-5 text-sm",
    lg: "h-12 px-8 text-base"
  };
  
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";

// Custom SVG Icons
const ArrowRight = ({ className = "", size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const MenuIcon = ({ className = "", size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const XIcon = ({ className = "", size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const PlusIcon = ({ className = "", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const MinusIcon = ({ className = "", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
  </svg>
);

const LandingPage = ({ onNavigateToApp }) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [scrolled, setScrolled] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState('twitter');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [postsPerWeek, setPostsPerWeek] = useState(5);
  const [channelsCount, setChannelsCount] = useState(3);
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0);

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
      price: isAnnual ? '$15' : '$19',
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
      price: isAnnual ? '$39' : '$49',
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

  const testimonials = [
    {
      quote: "ContentCadence cut our weekly content planning workflow from 6 hours to under 45 minutes. The AI timing predictions are incredibly accurate.",
      author: "Sarah Jenkins",
      role: "Social Media Director @ GrowthSpurt",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
    },
    {
      quote: "The approval workspace feature is a lifesaver. Our copywriters draft posts, and our legal reviewers approve them with a single click. Zero friction.",
      author: "Marcus Chen",
      role: "Founder @ FinScale",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
    }
  ];

  const faqItems = [
    {
      q: "How does the AI post scheduler find optimal times?",
      a: "Our AI engine analyzes historical engagement profiles across your connected channels and tracks global audience patterns to map the precise minute your posts will gain maximum visibility."
    },
    {
      q: "Which social media networks are supported?",
      a: "ContentCadence fully supports Twitter / X, LinkedIn, and Instagram. We offer platform-specific preview layers so you can inspect your exact post before publishing."
    },
    {
      q: "Can I customize post formats per platform?",
      a: "Yes! You can draft one core content concept and optimize it with individual hashtags, visual assets, and character counts tailored specifically to each social network."
    },
    {
      q: "Does ContentCadence support team collaboration?",
      a: "Absolutely. Our plans include shared team workspaces, presence indicators, commenting boards, and custom role approval workflows (Draft -> Pending Review -> Approved)."
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(prev => prev === index ? null : index);
  };

  const roadmapSteps = [
    {
      title: "1. Link Channels",
      subtitle: "Secure Profile Connection",
      description: "Connect your Twitter, LinkedIn, and Instagram accounts in seconds. We use official OAuth APIs to guarantee absolute security and privacy for your data.",
      icon: "fa-link",
      badge: "Step 1",
      color: "from-blue-500 to-cyan-400 text-blue-400",
      accent: "blue",
      visual: (
        <div className="bg-black/50 p-6 rounded-xl border border-gray-800 space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Linked Integrations</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">Active Secure Connection</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2.5 bg-gray-900/60 border border-gray-800 rounded-lg">
              <span className="text-xs text-white flex items-center gap-2"><i className="fab fa-twitter text-blue-400"></i> Twitter / X</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Connected</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-gray-900/60 border border-gray-800 rounded-lg">
              <span className="text-xs text-white flex items-center gap-2"><i className="fab fa-linkedin text-blue-600"></i> LinkedIn</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Connected</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-gray-900/60 border border-gray-800 rounded-lg">
              <span className="text-xs text-white flex items-center gap-2"><i className="fab fa-instagram text-pink-500"></i> Instagram Business</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Connected</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "2. Generate Copy",
      subtitle: "AI-Powered Text & Media Formatting",
      description: "Draft one concept. Our AI will automatically rewrite, insert optimized hashtags, structure spacing, and resize visual assets tailored perfectly to the rules of each social network.",
      icon: "fa-magic",
      badge: "Step 2",
      color: "from-purple-500 to-indigo-400 text-purple-400",
      accent: "purple",
      visual: (
        <div className="bg-black/50 p-6 rounded-xl border border-gray-800 space-y-3">
          <div className="text-xs text-gray-500 font-mono flex items-center gap-1.5"><i className="fas fa-sparkles text-purple-400"></i> AI Content Optimizer</div>
          <div className="p-3 bg-gray-900/40 rounded-lg border border-gray-800 text-xs italic text-gray-400">
            "Excited to unveil ContentCadence today!"
          </div>
          <div className="flex justify-center"><i className="fas fa-arrow-down text-gray-600 text-sm"></i></div>
          <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/20 text-xs text-indigo-200">
            "Say goodbye to manual schedule chaos. ⚡ Unveiling ContentCadence today to automate your organic workflow..."
          </div>
        </div>
      )
    },
    {
      title: "3. Auto-Queue",
      subtitle: "Prime-time Publishing Slots",
      description: "Add drafts to the queue with one click. The scheduling engine determines the highest engagement slots automatically based on platform history, running without manual intervention.",
      icon: "fa-calendar-alt",
      badge: "Step 3",
      color: "from-amber-500 to-yellow-400 text-amber-400",
      accent: "amber",
      visual: (
        <div className="bg-black/50 p-6 rounded-xl border border-gray-800 space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-450">
            <span>Smart Queue Scheduler</span>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded font-mono">10:30 AM Slot Selected</span>
          </div>
          <div className="h-2 bg-gray-805 rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-gradient-to-r from-amber-500 to-yellow-500 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-900/60 rounded-lg border border-gray-800">
              <div className="text-[10px] text-gray-500">Twitter</div>
              <div className="text-xs font-bold text-white mt-0.5">10:30 AM</div>
            </div>
            <div className="p-2 bg-gray-900/60 rounded-lg border border-gray-800">
              <div className="text-[10px] text-gray-500">LinkedIn</div>
              <div className="text-xs font-bold text-white mt-0.5">09:15 AM</div>
            </div>
            <div className="p-2 bg-gray-900/60 rounded-lg border border-gray-800 bg-indigo-500/5 border-indigo-500/20">
              <div className="text-[10px] text-indigo-400">Instagram</div>
              <div className="text-xs font-bold text-indigo-300 mt-0.5">03:45 PM</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "4. Track Growth",
      subtitle: "Dynamic Analytics Reports",
      description: "Watch your stats grow. Track overall audience engagement rates, content likes, and comments through a clean aggregated report panel that builds itself automatically.",
      icon: "fa-chart-line",
      badge: "Step 4",
      color: "from-emerald-500 to-teal-400 text-emerald-400",
      accent: "emerald",
      visual: (
        <div className="bg-black/50 p-6 rounded-xl border border-gray-800 space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Engagement Growth</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">+32.4% MoM</span>
          </div>
          <div className="flex justify-around items-end h-20 pt-4">
            <div className="w-8 h-8 bg-gray-800 rounded-t"></div>
            <div className="w-8 h-12 bg-gray-800 rounded-t"></div>
            <div className="w-8 h-16 bg-gray-700 rounded-t"></div>
            <div className="w-8 h-20 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Today</span>
          </div>
        </div>
      )
    }
  ];

  const mockPosts = {
    twitter: {
      author: 'Anselme Motcho',
      handle: '@anselmem',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      time: '10:30 AM',
      content: "Unlocking 10x developer productivity isn't about working harder. It's about building agents that automate your redundant loops. ⚡ Designed ContentCadence to make content planning effortless. #AI #DevTools #SaaS",
      stats: { likes: '1.2K', retweets: '342', replies: '89' }
    },
    linkedin: {
      author: 'Anselme Motcho',
      role: 'Founder @ ContentCadence',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      time: '09:15 AM • Edited',
      content: "We just launched our new automated publishing pipeline! ContentCadence now schedules, formats, and publishes your content to 5+ social platforms in one click.\n\nHere's how we built it using React, Tailwind, and Firebase. High efficiency, zero friction. 🧵👇",
      stats: { likes: '452', comments: '24', shares: '18' }
    },
    instagram: {
      author: 'contentcadence',
      role: 'Productivity Tool',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
      time: '2 hours ago',
      content: 'Consistency is the key to organic growth. Plan your weekly content in under 5 minutes with ContentCadence. 🚀✨ Make social media management a breeze.\n.\n.\n#marketingtips #socialmedia #growth #contentcreator #productivity',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      stats: { likes: '890', comments: '12' }
    }
  };

  const renderInteractivePreview = () => {
    const post = mockPosts[previewPlatform];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
        {/* Left Pane: Interactive Editor / Scheduler Controls */}
        <div className="lg:col-span-5 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between min-h-[460px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 mb-5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Scheduler Draft Console</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">v1.2.0-stable</span>
            </div>

            {/* Platform Tab Selection */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-400 block mb-2">Select Channel</label>
              <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-xl border border-gray-800/60">
                {['twitter', 'linkedin', 'instagram'].map((plat) => (
                  <button
                    key={plat}
                    onClick={() => setPreviewPlatform(plat)}
                    className={`py-2 text-xs font-medium rounded-lg capitalize flex items-center justify-center gap-1.5 transition-all duration-300 ${
                      previewPlatform === plat
                        ? 'bg-gradient-to-b from-white via-white/95 to-white/60 text-black shadow-lg scale-[1.02]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {plat === 'twitter' ? (
                      <i className="fab fa-twitter text-blue-400"></i>
                    ) : plat === 'linkedin' ? (
                      <i className="fab fa-linkedin text-blue-600"></i>
                    ) : (
                      <i className="fab fa-instagram text-pink-500"></i>
                    )}
                    {plat === 'twitter' ? 'Twitter' : plat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mock Editor Text Area */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-400 block mb-2">Caption Copywriter</label>
              <div className="relative">
                <textarea
                  readOnly
                  value={post.content}
                  className="w-full bg-black/50 border border-gray-800/80 rounded-xl p-3.5 text-xs text-gray-300 leading-relaxed font-sans focus:outline-none h-28 resize-none"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-500">
                  {post.content.length} chars
                </span>
              </div>
            </div>

            {/* Scheduling Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Scheduled Date</label>
                <div className="w-full bg-black/40 border border-gray-800/85 rounded-xl px-3 py-2 text-xs text-gray-300 flex items-center gap-2">
                  <i className="far fa-calendar text-gray-500 text-[10px]"></i>
                  <span>Today, Jun 23</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Optimal Time Slot</label>
                <div className="w-full bg-black/40 border border-gray-800/85 rounded-xl px-3 py-2 text-xs text-gray-300 flex items-center gap-2">
                  <i className="far fa-clock text-emerald-400 text-[10px]"></i>
                  <span className="text-emerald-400 font-bold">{post.time}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div>
            <button
              onClick={() => alert(`Simulated posting draft to ${previewPlatform === 'twitter' ? 'Twitter / X' : previewPlatform}!`)}
              className="w-full bg-white hover:bg-gray-100 text-black py-2.5 px-4 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <i className="fas fa-paper-plane text-[10px]"></i> Queue Post (Best Time)
            </button>
          </div>
        </div>

        {/* Right Pane: Live Mobile Device Mockup */}
        <div className="lg:col-span-7 flex justify-center items-center">
          {/* Phone Frame container */}
          <div className="w-full max-w-[340px] bg-[#0d0d0f] rounded-[48px] border-[6px] border-gray-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative aspect-[9/18.5] flex flex-col hover:border-gray-700/80 transition-colors duration-500">
            {/* Speaker & Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-black flex justify-center items-center z-30">
              <div className="w-24 h-4 bg-black rounded-b-2xl relative flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-900 rounded-full mb-1"></div>
                <div className="w-2.5 h-2.5 bg-gray-900/60 rounded-full absolute right-4 top-0.5"></div>
              </div>
            </div>

            {/* Mobile Status Bar */}
            <div className="bg-black text-[9px] text-gray-400 px-6 pt-7 pb-1.5 flex justify-between items-center z-20">
              <span className="font-semibold">{post.time}</span>
              <div className="flex items-center space-x-1.5">
                <i className="fas fa-signal"></i>
                <i className="fas fa-wifi"></i>
                <i className="fas fa-battery-full text-[10px]"></i>
              </div>
            </div>

            {/* Render active platform screen feed preview */}
            <div className="flex-1 bg-black overflow-y-auto px-4 py-3 flex flex-col justify-start relative scrollbar-none">
              {/* Transition Keyed Overlay or directly render cards with high-fidelity */}
              {previewPlatform === 'twitter' && (
                <div className="w-full bg-black text-left animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-3">
                    <span className="text-[10px] text-gray-500 font-bold tracking-wider">TWEET PREVIEW</span>
                    <i className="fab fa-twitter text-blue-400 text-sm"></i>
                  </div>
                  <div className="flex items-start space-x-3 mb-3">
                    <img src={post.avatar} alt={post.author} className="w-9 h-9 rounded-full object-cover border border-gray-800" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-xs flex items-center gap-0.5">
                        {post.author}
                        <i className="fas fa-check-circle text-blue-400 text-[10px]"></i>
                      </div>
                      <div className="text-gray-500 text-[10px]">{post.handle}</div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-xs leading-relaxed mb-4 whitespace-pre-line font-sans">
                    {post.content}
                  </p>
                  <div className="text-gray-500 text-[9px] border-b border-gray-900 pb-2 mb-2">
                    {post.time} • ContentCadence Scheduler
                  </div>
                  <div className="flex items-center justify-between text-gray-500 text-[10px] pt-1">
                    <span><i className="far fa-comment mr-1"></i>{post.stats.replies}</span>
                    <span><i className="fas fa-retweet mr-1"></i>{post.stats.retweets}</span>
                    <span><i className="far fa-heart mr-1 text-red-500/80"></i>{post.stats.likes}</span>
                    <span><i className="far fa-share-square"></i></span>
                  </div>
                </div>
              )}

              {previewPlatform === 'linkedin' && (
                <div className="w-full bg-black text-left animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-3">
                    <span className="text-[10px] text-gray-500 font-bold tracking-wider">LINKEDIN POST</span>
                    <i className="fab fa-linkedin text-blue-600 text-sm"></i>
                  </div>
                  <div className="flex items-center space-x-3 mb-3">
                    <img src={post.avatar} alt={post.author} className="w-9 h-9 rounded-full object-cover border border-gray-800" />
                    <div>
                      <div className="font-bold text-white text-xs">{post.author}</div>
                      <div className="text-gray-400 text-[9px] truncate max-w-[200px]">{post.role}</div>
                      <div className="text-gray-500 text-[8px]">{post.time}</div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-xs leading-relaxed mb-4 whitespace-pre-line font-sans">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-gray-500 text-[10px] border-t border-gray-900 pt-3">
                    <span className="hover:text-white transition-colors cursor-pointer"><i className="far fa-thumbs-up mr-1 text-gray-400"></i> {post.stats.likes}</span>
                    <span className="hover:text-white transition-colors cursor-pointer"><i className="far fa-comment-dots mr-1"></i> {post.stats.comments}</span>
                    <span className="hover:text-white transition-colors cursor-pointer"><i className="fas fa-redo mr-1"></i> Share</span>
                  </div>
                </div>
              )}

              {previewPlatform === 'instagram' && (
                <div className="w-full bg-black text-left animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-3">
                    <span className="text-[10px] text-gray-500 font-bold tracking-wider">INSTAGRAM FEED</span>
                    <i className="fab fa-instagram text-pink-500 text-sm"></i>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <img src={post.avatar} alt={post.author} className="w-7 h-7 rounded-full object-cover border border-pink-500/80 p-[1px]" />
                      <span className="font-bold text-white text-[10px]">{post.author}</span>
                    </div>
                    <i className="fas fa-ellipsis-h text-gray-500 text-[10px]"></i>
                  </div>
                  <div className="aspect-square w-full relative bg-gray-950 rounded-lg overflow-hidden border border-gray-900 mb-3.5">
                    <img src={post.image} alt="Instagram Visual" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between text-gray-300 text-xs mb-2">
                    <div className="flex items-center space-x-3">
                      <i className="far fa-heart text-red-500"></i>
                      <i className="far fa-comment"></i>
                      <i className="far fa-paper-plane"></i>
                    </div>
                    <i className="far fa-bookmark"></i>
                  </div>
                  <div className="font-bold text-white text-[10px] mb-1">{post.stats.likes} likes</div>
                  <p className="text-gray-200 text-[10px] leading-relaxed">
                    <span className="font-bold mr-1">{post.author}</span>
                    {post.content}
                  </p>
                  <div className="text-[8px] text-gray-500 mt-2 uppercase">{post.time}</div>
                </div>
              )}
            </div>

            {/* Home indicator */}
            <div className="bg-black py-2.5 flex justify-center items-center">
              <div className="w-28 h-1 bg-gray-800 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white transition-colors duration-300 relative overflow-hidden font-['Poppins',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Poppins', sans-serif;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>

      {/* Navigation (Exactly based on reference) */}
      <header className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-b from-white via-white/95 to-white/60 rounded-lg flex items-center justify-center">
                <i className="fas fa-bolt text-black text-sm" aria-hidden="true"></i>
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                ContentCadence
              </span>
            </div>
            
            {/* Desktop Center Navigation links */}
            <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1">
                Features
              </a>
              <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1">
                Pricing
              </a>
              <a href="#faqs" className="text-sm text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1">
                FAQs
              </a>
            </div>

            {/* Desktop Auth Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Button type="button" variant="ghost" size="sm" onClick={openLogin}>
                Sign in
              </Button>
              <Button type="button" variant="default" size="sm" onClick={openSignup}>
                Get Started
              </Button>
            </div>

            {/* Mobile Toggler */}
            <button
              type="button"
              className="md:hidden text-white hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]">
            <div className="px-6 py-5 flex flex-col gap-4">
              <a
                href="#features"
                className="text-sm text-white/60 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm text-white/60 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#faqs"
                className="text-sm text-white/60 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQs
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
                <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => { setMobileMenuOpen(false); openLogin(); }}>
                  Sign in
                </Button>
                <Button type="button" variant="default" size="sm" className="w-full" onClick={() => { setMobileMenuOpen(false); openSignup(); }}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section (Exactly based on reference) */}
      <section className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-32 pb-20 lg:pt-40 lg:pb-28 animate-fade-in">
        
        {/* Top Announcement Badge */}
        <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-800/50 backdrop-blur-sm max-w-full">
          <span className="text-xs text-center whitespace-nowrap text-gray-400">
            Trusted by 50,000+ creators globally.
          </span>
          <a
            href="#features"
            className="flex items-center gap-1 text-xs hover:text-white transition-all active:scale-95 whitespace-nowrap text-gray-400"
            aria-label="Read more details"
          >
            Explore features
            <ArrowRight size={12} />
          </a>
        </aside>

        {/* Masked Gradient Headline */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-medium text-center max-w-3xl px-6 leading-tight mb-6"
          style={{
            background: "linear-gradient(to bottom, #ffffff, #ffffff, rgba(255, 255, 255, 0.6))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.05em"
          }}
        >
          Schedule Smarter. <br />Publish Faster.
        </h1>

        <p className="text-sm md:text-base text-center max-w-2xl px-6 mb-10 text-gray-450 leading-relaxed">
          The premium, all-in-one social media scheduler using AI to pinpoint <br className="hidden md:block" /> optimal publishing slots and streamline creator workflows.
        </p>

        {/* Reusable Buttons usage */}
        <div className="flex items-center gap-4 relative z-10 mb-16">
          <Button
            type="button"
            variant="gradient"
            size="lg"
            onClick={openSignup}
            aria-label="Start Free Trial"
          >
            Start Free Trial
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={openLogin}
            aria-label="View Demo"
          >
            View Demo
          </Button>
        </div>

        {/* Stats Metrics Display */}
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 border-y border-gray-850 py-8 px-6 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Reference Dashboard Showcase (Exactly from Reference) */}
        <div className="w-full max-w-5xl relative pb-20 px-4">
          <div
            className="absolute left-1/2 w-[90%] pointer-events-none z-0"
            style={{
              top: "-23%",
              transform: "translateX(-50%)"
            }}
            aria-hidden="true"
          >
            <img
              src="https://i.postimg.cc/Ss6yShGy/glows.png"
              alt=""
              className="w-full h-auto"
              loading="eager"
            />
          </div>
          
          <div className="relative z-10 rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
            <img
              src="https://i.postimg.cc/SKcdVTr1/Dashboard2.png"
              alt="Dashboard preview showing analytics and metrics interface"
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Features Section (Bento Box Redesign) */}
      <section id="features" className="py-24 bg-black border-t border-gray-900 relative overflow-hidden">
        {/* Radial gradient glow for premium aesthetics */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Powerful tools designed to streamline your social workflow and maximize visual impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Smart AI Scheduling (Span 2 cols) */}
            <div className="group md:col-span-2 p-8 bg-gray-900/20 backdrop-blur-md border border-gray-800/80 rounded-2xl hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_50px_rgba(99,102,241,0.08)] flex flex-col justify-between overflow-hidden min-h-[340px] relative">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-calendar-check text-indigo-400 text-xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Smart AI Scheduling</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                  Queue content across all social media networks from a unified dashboard. The automated scheduler calculates prime engagement intervals per channel dynamically to maximize organic reach.
                </p>
              </div>
              {/* Visual Asset inside Bento */}
              <div className="mt-8 flex flex-col gap-3 bg-black/40 backdrop-blur-md p-5 rounded-xl border border-gray-800/60 relative z-10 transition-all duration-300 group-hover:border-gray-700/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-350 flex items-center gap-2 font-medium">
                    <i className="fab fa-twitter text-blue-400"></i> Platform launch post
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px]">
                    10:30 AM (Best engagement slot)
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="w-4/5 h-full bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Estimated reach: +42%</span>
                  <span>Ready to fire</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Multi-Platform (Span 1 col) */}
            <div className="group md:col-span-1 p-8 bg-gray-900/20 backdrop-blur-md border border-gray-800/80 rounded-2xl hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_50px_rgba(244,63,94,0.05)] flex flex-col justify-between min-h-[340px] relative">
              <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-share-nodes text-rose-400 text-xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Multi-Platform</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Publish to Twitter, LinkedIn, and Instagram. Format caption drafts tailored uniquely to each platform criteria.
                </p>
              </div>
              {/* Visual Asset */}
              <div className="flex justify-center gap-3.5 mt-8 relative z-10">
                <span className="w-11 h-11 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-405 hover:text-sky-400 hover:border-sky-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all duration-300 cursor-pointer" aria-label="Share to Twitter"><i className="fab fa-twitter text-lg"></i></span>
                <span className="w-11 h-11 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-405 hover:text-blue-500 hover:border-blue-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all duration-300 cursor-pointer" aria-label="Share to LinkedIn"><i className="fab fa-linkedin text-lg"></i></span>
                <span className="w-11 h-11 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-405 hover:text-pink-500 hover:border-pink-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] transition-all duration-300 cursor-pointer" aria-label="Share to Instagram"><i className="fab fa-instagram text-lg"></i></span>
                <span className="w-11 h-11 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-405 hover:text-rose-500 hover:border-rose-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all duration-300 cursor-pointer" aria-label="Share to YouTube"><i className="fab fa-youtube text-lg"></i></span>
              </div>
            </div>

            {/* Bento Card 3: AI Assistant (Span 1 col) */}
            <div className="group md:col-span-1 p-8 bg-gray-900/20 backdrop-blur-md border border-gray-800/80 rounded-2xl hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_50px_rgba(234,179,8,0.05)] flex flex-col justify-between min-h-[340px] relative">
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-magic text-yellow-400 text-xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">AI Generator</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Generate high-impact hook intros, automated tags, and description captions with our custom AI copywriter built-in.
                </p>
              </div>
              {/* Visual Asset */}
              <div className="mt-8 border border-gray-800/80 bg-black/50 backdrop-blur-md rounded-xl p-4 text-[11px] font-mono text-gray-400 text-left relative z-10 group-hover:border-gray-700/80 transition-all duration-300">
                <div className="flex items-center gap-1.5 mb-2 border-b border-gray-800/80 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
                  <span className="text-[10px] text-gray-500 ml-1">ai_assistant.sh</span>
                </div>
                <div>
                  <span className="text-yellow-400 font-semibold">Prompt: </span> "Write a catchy hooks for SaaS product..."
                </div>
                <div className="mt-1 text-gray-300 border-l-2 border-indigo-500/50 pl-2 italic">
                  "Say goodbye to manual posting schedules. Meet your next AI sidekick..."
                </div>
              </div>
            </div>

            {/* Bento Card 4: Collaboration Workspaces (Span 2 cols) */}
            <div className="group md:col-span-2 p-8 bg-gray-900/20 backdrop-blur-md border border-gray-800/80 rounded-2xl hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_50px_rgba(168,85,247,0.08)] flex flex-col justify-between overflow-hidden min-h-[340px] relative">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-users text-purple-400 text-xl" aria-hidden="true"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Collaboration Workspaces</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                  Invite your marketing managers and copywriters. Collaborate on content approval pipelines, tag assets, review comments, and verify version histories in real-time.
                </p>
              </div>
              {/* Visual Asset */}
              <div className="mt-8 flex items-center justify-between bg-black/40 backdrop-blur-md p-4 rounded-xl border border-gray-880/60 relative z-10 group-hover:border-gray-700/80 transition-all duration-300">
                <div className="flex items-center -space-x-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-black flex items-center justify-center text-xs text-white font-bold shadow-md">AM</span>
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 border border-black flex items-center justify-center text-xs text-white font-bold shadow-md">LD</span>
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border border-black flex items-center justify-center text-xs text-white font-bold shadow-md">JS</span>
                  <span className="w-8 h-8 rounded-full bg-gray-800 border border-black flex items-center justify-center text-xs text-gray-400 font-semibold shadow-md">+4</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <i className="far fa-comment-alt"></i> 3 comments
                  </span>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full font-semibold border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Approved
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Scheduler Preview Section */}
      <section className="py-24 bg-gray-900/20 border-t border-gray-800/40 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-4">
              See Scheduling in Action
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Switch platforms below to experience how scheduled content visualizes directly within ContentCadence.
            </p>
          </div>
          {renderInteractivePreview()}
        </div>
      </section>

      {/* Creator Milestone Roadmap Section */}
      <section id="roadmap" className="py-24 bg-black border-t border-gray-900 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-4">
              Creator Milestone Roadmap
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Discover how easy it is to scale your social footprint. Follow our simple, automated milestone workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Timeline Controls (Span 5) */}
            <div className="lg:col-span-5 space-y-4">
              {roadmapSteps.map((step, idx) => {
                const isActive = activeRoadmapStep === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveRoadmapStep(idx)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                      isActive 
                        ? 'border-indigo-500/30 bg-gray-900/20 shadow-[0_4px_30px_rgba(99,102,241,0.03)] scale-[1.02]' 
                        : 'border-gray-800/80 bg-gray-955/20 hover:border-gray-700/80'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                      isActive 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                        : 'bg-white/5 border-white/10 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                    }`}>
                      <i className={`fas ${step.icon} text-sm`}></i>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 block mb-0.5">{step.badge}</span>
                      <h4 className="text-base font-bold text-white transition-colors group-hover:text-indigo-400">{step.title}</h4>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Step Detail Card Visual Showcase (Span 7) */}
            <div className="lg:col-span-7 bg-gray-900/20 border border-gray-800/80 rounded-3xl p-8 backdrop-blur-md min-h-[420px] flex flex-col justify-between relative overflow-hidden transition-all duration-500">
              {/* Radial glow */}
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                      {roadmapSteps[activeRoadmapStep].subtitle}
                    </span>
                    <h3 className="text-2xl font-bold text-white">
                      {roadmapSteps[activeRoadmapStep].title}
                    </h3>
                  </div>
                  <span className="text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full font-bold">
                    {roadmapSteps[activeRoadmapStep].badge}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  {roadmapSteps[activeRoadmapStep].description}
                </p>
              </div>

              <div className="w-full mt-auto">
                {/* Live rendering of steps' dynamic visual helper components */}
                {roadmapSteps[activeRoadmapStep].visual}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-24 relative bg-black border-y border-gray-900 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/2 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-4">
              Calculate Your Time Saved
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              See how much time you recover and the engagement leverage you gain by automating your social media publishing flow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gray-900/10 border border-gray-800/80 rounded-3xl p-8 lg:p-12 backdrop-blur-md">
            {/* Sliders (Span 7) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Slider 1: Posts per week */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-gray-300">Weekly Scheduled Posts</label>
                  <span className="text-indigo-400 font-mono font-bold text-lg">{postsPerWeek} posts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={postsPerWeek}
                  onChange={(e) => setPostsPerWeek(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 font-mono">
                  <span>1 Post</span>
                  <span>10 Posts</span>
                  <span>20 Posts</span>
                </div>
              </div>

              {/* Slider 2: Channels connected */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-gray-300">Connected Channels</label>
                  <span className="text-purple-400 font-mono font-bold text-lg">{channelsCount} platforms</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={channelsCount}
                  onChange={(e) => setChannelsCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 font-mono">
                  <span>1 Platform</span>
                  <span>3 Platforms</span>
                  <span>5 Platforms</span>
                </div>
              </div>
            </div>

            {/* Metrics Output (Span 5) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-black/40 border border-gray-850 p-8 rounded-2xl min-h-[280px]">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Weekly Time Recovered</span>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      {(postsPerWeek * channelsCount * 0.8).toFixed(1)}
                    </span>
                    <span className="text-gray-400 ml-1 text-sm font-medium"> hours</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Based on manual formatting, resizing, & publishing times.</p>
                </div>

                <div className="border-t border-gray-900/60 pt-5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Expected Reach Boost</span>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                      +{Math.min(100, Math.round((postsPerWeek * 2) + (channelsCount * 9)))}%
                    </span>
                    <span className="text-emerald-500/80 ml-1.5 text-xs font-bold uppercase tracking-wider">Growth Potential</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  type="button"
                  variant="gradient"
                  className="w-full py-3"
                  onClick={openSignup}
                  aria-label="Claim Saved Hours Now"
                >
                  Claim Your Saved Time
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative border-t border-gray-900 overflow-hidden">
        {/* Radial Mesh Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-455 max-w-2xl mx-auto leading-relaxed mb-8">
              Choose the plan that fits your business needs. Upgrade or downgrade anytime.
            </p>

            {/* Monthly / Annual Toggle Switch */}
            <div className="inline-flex items-center bg-gray-900/40 p-1.5 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-inner">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  !isAnnual
                    ? 'bg-gradient-to-b from-white via-white/95 to-white/60 text-black shadow-lg scale-[1.02]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-300 ${
                  isAnnual
                    ? 'bg-gradient-to-b from-white via-white/95 to-white/60 text-black shadow-lg scale-[1.02]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annually
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold transition-colors duration-300 ${
                  isAnnual ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative flex flex-col justify-between backdrop-blur-md rounded-3xl p-8 transition-all duration-505 border ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-gray-950 via-gray-900/40 to-black border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.12)] scale-105 md:z-10' 
                    : 'bg-gray-900/10 border-gray-800/80 hover:border-gray-700/80 shadow-md'
                } hover:-translate-y-1.5 hover:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.6)]`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider shadow-md border border-indigo-400/30">
                    Most Popular
                  </div>
                )}
                
                <div>
                  <div className="text-center mb-8 border-b border-gray-850 pb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-450 text-xs mb-5 min-h-[32px]">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                      <span className="text-gray-400 ml-1.5 text-sm font-medium">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center text-gray-300 text-sm gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm shrink-0 ${
                          plan.popular 
                            ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' 
                            : 'bg-white/5 border border-white/10 text-gray-400'
                        }`}>
                          <i className="fas fa-check" aria-hidden="true"></i>
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  type="button"
                  onClick={plan.onClick}
                  variant={plan.popular ? "gradient" : "secondary"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-900/10 border-t border-gray-900 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
              Loved by Content Teams
            </h2>
            <p className="text-sm text-gray-450 max-w-xl mx-auto leading-relaxed">
              See how social managers and startup leaders are driving engagement with ContentCadence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-8 bg-gray-900/20 border border-gray-800 rounded-2xl flex flex-col justify-between hover:border-gray-700 transition-colors">
                <p className="text-gray-300 text-sm leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center space-x-3.5">
                  <img src={t.avatar} alt={t.author} className="w-10 h-10 rounded-full object-cover border border-gray-800" />
                  <div>
                    <div className="text-sm font-semibold text-white">{t.author}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="py-24 bg-black border-t border-gray-900 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Have questions about ContentCadence? We have answers. Find out how our scheduling engine functions.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div 
                  key={idx} 
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isExpanded 
                      ? 'border-indigo-500/30 bg-gray-900/20 shadow-[0_4px_30px_rgba(99,102,241,0.03)]' 
                      : 'border-gray-800/80 bg-gray-900/10 hover:border-gray-700/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="group w-full px-6 py-5 flex items-center justify-between text-left font-medium text-white hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                    aria-expanded={isExpanded}
                  >
                    <span className="text-sm md:text-base font-semibold pr-4">{faq.q}</span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
                      isExpanded 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                        : 'bg-white/5 border-white/10 text-gray-400 group-hover:text-white'
                    }`}>
                      {isExpanded ? <MinusIcon size={14} /> : <PlusIcon size={14} />}
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-350 ease-in-out ${
                      isExpanded 
                        ? 'max-h-[300px] border-t border-gray-800/60 px-6 py-5 opacity-100 bg-black/20' 
                        : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-16 border-t border-gray-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-b from-white via-white/95 to-white/60 rounded-lg flex items-center justify-center">
                  <i className="fas fa-bolt text-black text-sm" aria-hidden="true"></i>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">ContentCadence</span>
              </div>
              <p className="text-xs leading-relaxed">Making social media management effortless for creators and businesses.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-left">Product</h4>
              <ul className="space-y-2 text-xs text-left">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faqs" className="hover:text-white transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-left">Company</h4>
              <ul className="space-y-2 text-xs text-left">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-left">Legal</h4>
              <ul className="space-y-2 text-xs text-left">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-900/60 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-xs">&copy; 2026 ContentCadence. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-450 hover:text-white hover:border-white/20 transition-all duration-300" aria-label="Twitter Page"><i className="fab fa-twitter" aria-hidden="true"></i></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-450 hover:text-white hover:border-white/20 transition-all duration-300" aria-label="GitHub Repository"><i className="fab fa-github" aria-hidden="true"></i></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-450 hover:text-white hover:border-white/20 transition-all duration-300" aria-label="LinkedIn Profile"><i className="fab fa-linkedin" aria-hidden="true"></i></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md animate-[slideDown_0.3s_ease-out]">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-12 right-0 text-gray-450 hover:text-white text-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
              aria-label="Close authentication modal"
            >
              <XIcon size={24} />
            </button>
            <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
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