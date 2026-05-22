'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { ArrowRight, Zap, Shield, Users, TrendingUp, ChevronRight, Star } from 'lucide-react'

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function signInWithGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const features = [
    {
      icon: <Users size={22} className="text-violet-600" />,
      title: 'Group Expenses',
      desc: 'Create groups for trips, roommates, or any shared expenses. Add members and track who owes what.',
    },
    {
      icon: <Zap size={22} className="text-amber-500" />,
      title: 'Smart Settle Up',
      desc: 'Our optimizer minimizes the number of transactions needed to settle all debts in a group.',
    },
    {
      icon: <TrendingUp size={22} className="text-emerald-500" />,
      title: 'Real-time Balances',
      desc: 'See your running balance at a glance. Know exactly who owes you and who you owe.',
    },
    {
      icon: <Shield size={22} className="text-blue-500" />,
      title: 'Secure & Private',
      desc: 'Your financial data is protected with enterprise-grade security. Only group members can see expenses.',
    },
  ]

  const testimonials = [
    { name: 'Alex M.', text: 'Finally an app that makes splitting bills with roommates painless!', stars: 5 },
    { name: 'Sarah K.', text: 'Used it for our 10-person road trip. The settle-up feature is genius.', stars: 5 },
    { name: 'James R.', text: 'Clean, fast, and actually works. Way better than Splitwise for my needs.', stars: 5 },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💸</span>
              <span className="text-xl font-bold text-gray-900">IOU</span>
            </div>
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Sign In'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-blue-50" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap size={14} />
            Smart debt settlement optimizer
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Split expenses,{' '}
            <span className="gradient-text">not friendships</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The smartest way to track shared expenses with friends. Create groups, add expenses, and let our optimizer find the simplest way to settle up.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-violet-600 text-white font-semibold rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 active:scale-95 disabled:opacity-50 text-lg"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
              <ArrowRight size={18} />
            </button>
          </div>

          <p className="text-sm text-gray-400 mt-4">Free to use. No credit card required.</p>
        </div>

        {/* App Preview */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/30" />
                <div className="w-3 h-3 rounded-full bg-white/30" />
                <div className="w-3 h-3 rounded-full bg-white/30" />
              </div>
              <div className="flex-1 bg-white/20 rounded-lg h-6" />
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Weekend Trip 🏖️', amount: '$342', members: 4, balance: '+$85.50', positive: true },
                { label: 'Roommates 🏠', amount: '$1,240', members: 3, balance: '-$32.00', positive: false },
                { label: 'Dinner Club 🍕', amount: '$89', members: 6, balance: '+$14.75', positive: true },
              ].map((group, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="text-base font-semibold text-gray-900 mb-1">{group.label}</div>
                  <div className="text-sm text-gray-500 mb-3">{group.members} members</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Total spent</span>
                    <span className="font-semibold text-gray-900">{group.amount}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">Your balance</span>
                    <span className={`font-semibold text-sm ${group.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {group.balance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything you need</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Built for real friend groups, not finance departments.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How it works</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Three simple steps to stress-free expense splitting.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create a Group', desc: 'Start a group for your trip, household, or any shared activity.' },
              { step: '02', title: 'Add Expenses', desc: 'Log expenses as they happen. Choose who paid and how to split.' },
              { step: '03', title: 'Settle Up', desc: 'See exactly who owes what. Our optimizer minimizes transactions.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-violet-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-violet-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Loved by friend groups</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-violet-100">
                <div className="flex mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-600 to-purple-700 text-white text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to split smarter?</h2>
        <p className="text-violet-200 mb-8 max-w-md mx-auto">Join thousands of friend groups using IOU to keep money transparent and friendships intact.</p>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="inline-flex items-center gap-3 px-8 py-4 bg-white text-violet-700 font-semibold rounded-2xl hover:bg-violet-50 transition-all shadow-lg active:scale-95 disabled:opacity-50 text-lg"
        >
          Get Started Free
          <ArrowRight size={18} />
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">💸</span>
          <span className="font-bold text-gray-700">IOU</span>
        </div>
        <p>Split expenses, not friendships.</p>
      </footer>
    </div>
  )
}
