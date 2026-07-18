import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Translate, Headphones, Cards, Sparkle } from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

gsap.registerPlugin(ScrollTrigger);

const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRevealRef = useRef<HTMLHeadingElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  useEffect(() => {
    // 1. Scrubbing Text Reveal GSAP
    if (textRevealRef.current) {
      const words = textRevealRef.current.querySelectorAll('.word');
      gsap.fromTo(words,
        { opacity: 0.1, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: textRevealRef.current,
            start: 'top 80%',
            end: 'bottom 40%',
            scrub: 1,
          }
        }
      );
    }

    // 2. Bento Grid Stagger
    if (bentoRef.current) {
      const items = bentoRef.current.children;
      gsap.fromTo(items,
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: bentoRef.current,
            start: 'top 75%',
          }
        }
      );
    }

    // 3. Horizontal Stacking Cards (Scroll Pinning simulation)
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.feature-card');
      cards.forEach((card) => {
        gsap.fromTo(card,
          { opacity: 0, y: 100, scale: 0.8 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'bottom 60%',
              scrub: 1,
            }
          }
        );
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <main ref={containerRef} className="overflow-x-hidden w-full max-w-full bg-[#050505] text-[#f5f5f5] min-h-screen">
      {/* 0. Floating Glass Pill Nav */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl px-6 py-3 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl flex justify-between items-center shadow-2xl">
        <div className="font-bold tracking-tighter text-lg flex items-center gap-2">
          <Sparkle weight="fill" className="text-indigo-500" />
          <span>LinguaFlow</span>
        </div>
        <div className="flex gap-4 items-center">
          {isAuthenticated ? (
            <Link to="/dashboard" className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-transform">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign in</Link>
              <Link to="/register" className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-transform">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 1. ATTENTION (Hero): Cinematic Center */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-24 px-4 overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-6xl mx-auto text-center flex flex-col items-center"
        >
          <h1 className="text-[clamp(3rem,7vw,7rem)] font-bold tracking-tighter leading-[1.05] mb-6">
            Master languages <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 italic font-medium pr-2">
              without friction.
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bilingual fluency through immersive listening, AI-extracted context, and intelligent flashcards. Built for the modern learner.
          </p>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="group relative flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300">
                Continue Learning
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="group relative flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300">
                  Start Learning
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-white border border-white/20 hover:bg-white/10 transition-colors">
                  View Demo
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* 2. INTEREST (Bento Grid) */}
      <section className="py-32 md:py-48 px-4 w-full max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tighter mb-12">The Ecosystem</h2>

        <div ref={bentoRef} className="grid grid-cols-1 md:grid-cols-4 grid-rows-[auto] gap-4 grid-flow-dense auto-rows-[240px]">
          {/* Large Cell */}
          <div className="col-span-1 md:col-span-2 row-span-2 bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col justify-between overflow-hidden group">
            <div>
              <Headphones size={32} className="text-indigo-400 mb-4" />
              <h3 className="text-3xl font-bold tracking-tighter mb-2">Immersive Listening</h3>
              <p className="text-gray-400 max-w-md">Sync YouTube videos with bilingual subtitles. Click any word to see its translation instantly.</p>
            </div>
            {/* Abstract visual */}
            <div className="w-full h-48 bg-gradient-to-t from-black to-transparent mt-8 border border-white/5 rounded-2xl group-hover:scale-105 transition-transform duration-700 relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                <div className="w-1/2 h-8 bg-white/10 rounded-full blur-sm"></div>
                <div className="w-1/3 h-8 bg-indigo-500/20 rounded-full blur-sm"></div>
              </div>
            </div>
          </div>

          {/* Tall Cell */}
          <div className="col-span-1 md:col-span-1 row-span-2 bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 rounded-3xl p-8 flex flex-col justify-between group overflow-hidden">
            <div>
              <Translate size={32} className="text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold tracking-tighter mb-2">Pinyin & English</h3>
              <p className="text-indigo-200 text-sm">Perfect for HSK learners and ESL students. Contextual lookups that save time.</p>
            </div>
            <div className="text-6xl font-serif text-white/10 group-hover:scale-110 transition-transform duration-700">中/En</div>
          </div>

          {/* Wide Cell */}
          <div className="col-span-1 md:col-span-2 row-span-1 bg-[#111] border border-white/10 rounded-3xl p-8 flex items-center justify-between group">
            <div>
              <h3 className="text-2xl font-bold tracking-tighter mb-1">AI Context Extraction</h3>
              <p className="text-gray-400 text-sm">Upload documents, let AI pull out the vocabulary.</p>
            </div>
            <Sparkle size={48} className="text-yellow-500/50 group-hover:rotate-12 transition-transform duration-500" weight="duotone" />
          </div>

          {/* Small Cell */}
          <div className="col-span-1 md:col-span-1 row-span-1 bg-white text-black border border-white/10 rounded-3xl p-8 flex flex-col justify-center group overflow-hidden">
            <Cards size={32} className="mb-2" />
            <h3 className="text-xl font-bold tracking-tighter">Smart Flashcards</h3>
          </div>
        </div>
      </section>

      {/* 3. DESIRE (GSAP Scrubbing Text & Cards) */}
      <section className="py-32 md:py-48 px-4 w-full max-w-5xl mx-auto">
        <h2
          ref={textRevealRef}
          className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.2] text-center"
        >
          {("Fluency isn't about memorizing rules. It is about exposure, repetition, and seeing language in its true, untamed context.").split(" ").map((word, i) => (
            <span key={i} className="word inline-block mr-3">{word}</span>
          ))}
        </h2>

        <div ref={cardsRef} className="mt-48 space-y-24">
          <div className="feature-card w-full h-80 bg-[#161616] border border-white/5 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl">
            <div className="max-w-md">
              <h3 className="text-3xl font-bold tracking-tighter mb-4">Read naturally.</h3>
              <p className="text-gray-400 leading-relaxed">Stop pausing the video to search the dictionary. Click the subtitle, get the meaning, add it to your deck, and keep watching.</p>
            </div>
            <div className="w-48 h-48 bg-white/5 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md">
              <Translate size={64} className="text-white/50" />
            </div>
          </div>

          <div className="feature-card w-full h-80 bg-gradient-to-r from-[#0a0a0a] to-[#1a1525] border border-indigo-500/20 rounded-3xl p-10 flex flex-col md:flex-row-reverse items-center justify-between shadow-2xl">
            <div className="max-w-md text-right">
              <h3 className="text-3xl font-bold tracking-tighter mb-4">Retain forever.</h3>
              <p className="text-gray-400 leading-relaxed">Spaced repetition built right into your dashboard. Master the cards you extracted from your own study materials.</p>
            </div>
            <div className="w-48 h-48 bg-black/50 rounded-full border border-indigo-500/30 flex items-center justify-center backdrop-blur-md">
              <Cards size={64} className="text-indigo-400" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTION (Massive CTA) */}
      <section className="py-32 md:py-64 px-4 w-full flex flex-col items-center justify-center text-center border-t border-white/10 bg-gradient-to-b from-transparent to-indigo-900/10">
        <h2 className="text-[clamp(3rem,6vw,6rem)] font-bold tracking-tighter leading-[1] mb-8">
          Ready to become <br /> fluent?
        </h2>
        <Link to="/register" className="group relative bg-white text-black px-12 py-6 rounded-full font-bold text-2xl hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
          Create Account
        </Link>
        <p className="mt-8 text-gray-500 font-medium tracking-wide text-sm">NO CREDIT CARD REQUIRED</p>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-white/10 text-center text-gray-600 text-sm">
        <p>© 2026 LinguaFlow Platform. Anti-slop engineering.</p>
      </footer>
    </main>
  );
};

export default LandingPage;
