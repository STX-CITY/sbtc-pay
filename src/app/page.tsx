'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {

  const features = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Accept Bitcoin payments in seconds with sBTC on Stacks blockchain.',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      icon: '🛡️',
      title: 'Secure by Design',
      description: 'Enterprise-grade security with smart contract verification.',
      gradient: 'from-green-400 to-blue-500'
    },
    {
      icon: '🔧',
      title: 'Developer First',
      description: 'Clean APIs, SDKs, and detailed documentation to get you started quickly.',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      icon: '📊',
      title: 'Analytics & Insights',
      description: 'Comprehensive dashboard with real-time payment analytics and reporting.',
      gradient: 'from-blue-400 to-purple-500'
    },
    {
      icon: '🔗',
      title: 'Webhooks',
      description: 'Real-time event notifications to keep your systems in perfect sync.',
      gradient: 'from-pink-400 to-red-500'
    },
    {
      icon: '🛍️',
      title: 'Product Management',
      description: 'Full product catalog with images, descriptions, and flexible pricing.',
      gradient: 'from-indigo-400 to-cyan-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-9 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              sBTC Pay
            </motion.div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                Documentation
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>

            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Sign in
              </Link>
              <Link 
                href="/register" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Now supporting Stacks Nakamoto upgrade
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                The modern way to
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  accept Bitcoin
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
                Build seamless payment experiences with sBTC on Stacks. 
                From simple checkouts to complex marketplaces—we've got you covered.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link 
                href="/register" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Start accepting payments
              </Link>
              <Link 
                href="/docs" 
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                View documentation
              </Link>
            </motion.div>

            {/* Demo Section */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Quick Demo */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-white rounded-2xl shadow-xl p-6 border"
              >
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Try it now</h3>
                  <p className="text-gray-600 text-sm">Experience our payment flow</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Demo Product</span>
                    <span className="font-medium">$50</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">sBTC Amount</span>
                    <span className="font-medium">0.00050761 sBTC</span>
                  </div>
                </div>
                <Link 
                  href="/checkout/product/prod_dJ5wruTLdgEYUFt3"
                  className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Try demo checkout
                </Link>
              </motion.div>

              {/* Live Demo Site */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-white rounded-2xl shadow-xl p-6 border"
              >
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Live Demo Site</h3>
                  <p className="text-gray-600 text-sm">A education platform - Learn from industry experts and pay with Bitcoin using sBTC</p>
                </div>
                
                {/* Demo Image */}
                <div className="mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src="/demo-sbtc-site.jpg"
                    alt="Education Platform Demo - Learn from industry experts and pay with Bitcoin"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <div className="p-8 text-center" style={{ display: 'none' }}>
                    <div className="text-gray-400 text-4xl mb-2">🎓</div>
                    <p className="text-gray-500 text-sm">Education Platform Demo</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <a 
                    href="https://demo.sbtcpay.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-green-600 to-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    View Live Demo ↗
                  </a>
                  <a 
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full border border-gray-300 text-gray-700 text-center py-2 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 text-sm"
                  >
                    View Source Code ↗
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to accept Bitcoin
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple payment buttons to complex marketplace integrations, 
              sBTC Pay provides all the tools you need to build world-class payment experiences.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What is sBTC Section */}
      <section className="py-24 bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by sBTC on Stacks
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              sBTC is a 1:1 Bitcoin-backed asset that brings the full power of Bitcoin to smart contracts and decentralized applications
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">₿</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Bitcoin-Backed</h3>
                    <p className="text-gray-600">
                      Every sBTC is backed 1:1 by real Bitcoin, unlocking over $1 trillion in Bitcoin capital for programmable use cases
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🔒</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Decentralized & Secure</h3>
                    <p className="text-gray-600">
                      Secured by 15+ industry-leading validators with 70% consensus requirement. No single point of failure or centralized custody
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⚡</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Bitcoin Finality</h3>
                    <p className="text-gray-600">
                      All transactions achieve 100% Bitcoin finality, combining the security of Bitcoin with the programmability of smart contracts
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🚀</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Production</h3>
                    <p className="text-gray-600">
                      Mainnet live with deposits starting December 2024. Fully audited, open-source, and supported by major wallets like Xverse and Leather
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">How sBTC Works</h3>
                  <p className="text-gray-600">Simple, secure, and decentralized</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <p className="text-gray-700">Users deposit BTC to a threshold signature wallet</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <p className="text-gray-700">sBTC is minted 1:1 on the Stacks blockchain</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <p className="text-gray-700">Use sBTC in smart contracts and dApps</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                    <p className="text-gray-700">Redeem sBTC for BTC anytime, permissionlessly</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Learn more about sBTC</span>
                    <a 
                      href="https://www.stacks.co/sbtc" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      Visit stacks.co
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for developers, 
                <span className="text-blue-600">loved by businesses</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our RESTful API and comprehensive SDKs make integration straightforward, 
                while our dashboard gives you complete control over your payments.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>RESTful API with comprehensive documentation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Real-time webhooks for instant notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>SDKs for JavaScript, Python, and more</span>
                </div>
              </div>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <Link 
                  href="/docs#api"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Explore API Docs
                </Link>
                <Link 
                  href="/docs"
                  className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  View Integration Guide
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gray-900 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`// Create a payment intent
const paymentIntent = await sbtcPay
  .paymentIntents.create({
    amount: 2999,
    currency: 'usd',
    product_id: 'prod_123',
    customer_email: 'user@example.com'
  });

// Handle webhook events
app.post('/webhooks', (req, res) => {
  const event = JSON.parse(req.body);
  
  if (event.type === 'payment.succeeded') {
    // Fulfill the order
    fulfillOrder(event.data.object);
  }
});`}
              </pre>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-16">
              Trusted by businesses worldwide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '99.9%', label: 'Uptime' },
                { value: '< 2s', label: 'Avg Response' },
                { value: '24/7', label: 'Support' },
                { value: '150+', label: 'Countries' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to start accepting Bitcoin?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Join thousands of businesses already using sBTC Pay to accept Bitcoin payments. 
              Get started in minutes with our simple integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Create your account
              </Link>
              <Link 
                href="/docs" 
                className="border border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Read the docs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div> */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; 2025 sBTC Payment Gateway. Built on Stacks blockchain.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}