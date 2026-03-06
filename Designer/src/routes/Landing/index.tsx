import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const VIDEO_ID = 'XfO_h27IdBs';

function VideoPlayer() {
  const [playing, setPlaying] = useState(false);
  const thumbnail = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900">
      <div className="aspect-video">
        {playing ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&modestbranding=1&rel=0&color=white&iv_load_policy=3`}
            title="EduAR Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            className="relative w-full h-full group/play block"
            onClick={() => setPlaying(true)}
            aria-label="Play video"
          >
            {/* Thumbnail */}
            <img
              src={thumbnail}
              alt="EduAR Demo Video"
              className="w-full h-full object-cover"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-slate-900/50 group-hover/play:bg-slate-900/40 transition-colors" />
            {/* Play button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 group-hover/play:scale-110 transition-transform">
                <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </div>
              <span className="text-white text-sm font-semibold tracking-wide opacity-80">Watch Demo</span>
            </div>
            {/* EduAR badge - bottom left */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-primary text-sm">science</span>
              <span className="text-white text-xs font-bold tracking-wide">EduAR</span>
            </div>
            {/* Duration chip - bottom right */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-white text-xs font-mono font-bold">Watch Demo</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    // "dark" class here enables Tailwind dark: variants for just this page
    <div className="dark">
      <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen"
        style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Navigation */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">science</span>
              <span className="text-xl font-bold tracking-tight">EduAR</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
              <a className="hover:text-primary transition-colors" href="#features">Features</a>
              <a className="hover:text-primary transition-colors" href="#how-it-works">How it Works</a>
              <a className="hover:text-primary transition-colors" href="#use-cases">Use Cases</a>
            </nav>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-semibold hover:text-primary transition-colors px-4 py-2">Log In</Link>
              <Link to="/register" className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20">Get Started</Link>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none opacity-50" />
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative z-10 flex flex-col gap-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  New: Multi-user AR Labs
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  Bring Science Experiments to Life with <span className="text-primary">Augmented Reality</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl">
                  Empower students with immersive, interactive AR labs. The premium platform for modern STEM education, designed for both remote and in-person learning.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link to="/register" className="bg-primary text-white text-lg font-bold px-8 py-4 rounded-xl hover:brightness-110 transition-all shadow-xl shadow-primary/20">
                    Get Started Free
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div
                  className="aspect-square rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAImxXBnkAArCMxVG4yOJeOKbohzM8btRSEBIERZX2BbWmxS_7D3fGGAFt4hhxtnrBTkVpRweV39r6djS8fgh92JEHI2jmNfMKDf1YYMYY6JV8Vg54v0-1fzXcS2nKZH4F4QXSJUkgsH9mW2Rz9g-kx9bAOEOtBF12-sQkLkGLvrUZyQyiaHlpQNMJChBvO2BQRvDqGRoF1K1kHA2kpcIyNLmIqQpNt2GNyaCliDE-K_XESpCax14Km3Ya4d2OT-QUFNFcGtXRli_dg')" }}
                />
                <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-xs">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="material-symbols-outlined text-green-500 text-3xl">verified</span>
                    <span className="font-bold">Real-time Feedback</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Students get instant guidance during complex chemical reactions.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Highlights */}
          <section className="py-24 bg-slate-50 dark:bg-slate-900/50" id="features">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Advanced AR Capabilities</h2>
                <p className="text-slate-500 dark:text-slate-400">Everything you need to manage and create immersive learning experiences.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: 'edit_square', title: 'Create', desc: 'Intuitive drag-and-drop AR lab builder with a library of 500+ virtual materials.' },
                  { icon: 'groups', title: 'Classroom Mgmt', desc: 'Monitor all student progress in real-time. View what they see in AR simultaneously.' },
                  { icon: 'videocam', title: 'Student Recording', desc: 'Students record and narrate their findings directly within the AR environment.' },
                  { icon: 'auto_awesome', title: 'Smart Evaluation', desc: 'AI-powered assessment of experiment accuracy and safety protocol adherence.' },
                ].map(f => (
                  <div key={f.title} className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/50 transition-all group">
                    <span className="material-symbols-outlined text-primary text-4xl mb-4 block group-hover:scale-110 transition-transform">{f.icon}</span>
                    <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        {/* Product Demo Section */}
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">Experience the Future of Learning</h2>
            <VideoPlayer />
          </div>
        </section>

          {/* How it Works */}
          <section className="py-24 bg-slate-50 dark:bg-slate-900/50" id="how-it-works">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">How it Works</h2>
                <p className="text-slate-500 dark:text-slate-400">From setup to simulation in minutes.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-slate-300 dark:border-slate-700" />
                {[
                  { n: '1', title: 'Design Your Lab', desc: 'Use our visual editor to create custom experiments with virtual chemicals, sensors, and tools.' },
                  { n: '2', title: 'Deploy to Devices', desc: 'Instantly push your lab to student tablets, smartphones, or AR headsets via the cloud.' },
                  { n: '3', title: 'Interact & Analyze', desc: 'Students conduct experiments safely in AR while you monitor real-time data and provide feedback.' },
                ].map(s => (
                  <div key={s.n} className="relative text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/20 z-10">{s.n}</div>
                    <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="py-24" id="use-cases">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Designed for Every Educational Stage</h2>
                  <div className="space-y-6">
                    {[
                      { icon: 'school', title: 'Universities', desc: 'Advanced physics and chemistry simulations for higher education research and learning.' },
                      { icon: 'psychology', title: 'STEM Teachers', desc: 'Tools to make complex scientific concepts visible and tactile for K-12 students.' },
                      { icon: 'home_work', title: 'Distance Learning', desc: 'Provide high-quality lab experiences to students anywhere, without the need for physical materials.' },
                    ].map(u => (
                      <div key={u.title} className="flex gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">{u.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{u.title}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{u.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 pt-12">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAs2j1sXfL5arA37h8VcMfcqy49aH5bo8s14Q_dqu6rDyP2k2uc2qtCemGISltIITvxgJKG9U1cjP-_aIdzj8Tbshe0MJKf8jtiKr8sRS9vmKl3LqWGsESwgpyUOM_C5Ys-MWjJ-EAJuGU52-f3P5BpqMyVJxx8rKdQPszmqexUwSYcHtMUxf148S7ZEydZn__bCf5Qt6389q4ueHLQUHgBwBY6OY6S2H9ml79ByrIyOM5wwNYeP_rB5nhx3vxGnT2rDHhl8CAkd3EN')" }} />
                    <div className="aspect-square rounded-2xl overflow-hidden shadow-lg bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBin1fF3u-fYFMZjaZmPLLoe9RkqDnFgV2LnF328mnZwCyd95xz5YU9n7iq6_d-kOXYW5ZzZAAudcAnk42q_WtkbaWDlWBoYsZTfCE3_2w0GAKNOhuuv0ktCST33N54hg8lniTQNBm8MdQQmFWSrIj8ZOh2xPr0AHJ9V3f1_IQpo_AP8znkChrZYoNA43cOscstxhmdxEU3q0HQF3PQSw-D1U1M7ZW3Nv1TBPA0c2i8ZcaURJjf1J3uADeA0ZkO0D0N5jrj2wSprfnc')" }} />
                  </div>
                  <div className="space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden shadow-lg bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7w6t6s-_wo5gfNLILT8he_oKZdwrpE1qsCBa87YRk-VJpvsV7r85vzlys_nCtNHFrmBEfNJWknRee3zK2yLNf_4dynOs1XD_sYsH55Q-R76bH0XbKwoiHQY3G7XU1rH0fuNBACldGysfW2RxR2RDC3LJ8o92rXdat7vzKARFfVPmTCXTDjoQqC5nLDOzQlQ394QTrE1Rn4KXrudoVonn7pV6Kvib_afcI7x_e33KhMtTIjUQYiRZrV43Z4Q5_bLeD7-nTHHbJioq0')" }} />
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-slate-200 dark:bg-slate-800 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuABKC0rgLEVMp5iFBuSIaAiMIkf5FNK_8k7LudAgYNAul-VkP4JgZ7WG7ENIL0KaNxgfPTdWCL8GccehCGsBhF0pMXReoUV5hvPQouOzU9FuQ_MWA0bMLZQ716MIuDcsv8gwES-eHRPo1elCJSG-M74iEWz8lZbILia-H7ieCcqBTpQx5f_1vH3E7sOp4FvU5mkqKdiLq50J7iFX7jb1x2GIUXPZKQZYSOduYsZIFWfJBomvXBvj-hq7xIQ7G2-WsJVIq3sMQiEsx1M')" }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-24 bg-primary/5">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Loved by Educators Worldwide</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { quote: '"EduAR has completely transformed our chemistry curriculum. Students are more engaged than ever, and safety concerns are a thing of the past."', name: 'Dr. Sarah Miller', role: 'Dept. Head, Stanford University', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIjbPZMDpXMyOyysoWVU7o2u_31ykTkXfSKzX8GEU_7d98QtlaTOG5g-QwurZtHRDfKBViwDJ4k7uyu780n_dHXxOwUB6Xw6kUqsZUIFCF879VUUKVRJ9ggrfI4muvRrJ73LzQEU4xPs7JEXG2YBRoCK2d-D2eYy7Ve-HKzxh1CO7gdE7zDqpm0zTcbbX5zsWMuhOZG2YmJvUgygTp-Uv1xnTM1sFYK3JYctZOuoZWp-BdZMRprf4cFmrZFwql7OUpA6QiPsLfpiuv' },
                  { quote: '"The drag-and-drop builder is so intuitive. I was able to create a full physics module for my high schoolers in just one afternoon."', name: 'James Wilson', role: 'Science Lead, NY Public Schools', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4e0L-BAOc85iYHe4CdRvFAorQERAsg8g6b1MdA8r2JaCl68OMjGphGQfsiDjF7rvBzxa8kFqAX9eyazTc6mvhdsNqq2Y_ULQddS6KAVYtmTzEyAI8WSMrdhHug87xvNAVYXLRDMriBfEBq5UxWiWBG5VQGm2adTLC_CMMMRWVpOBnZ8b-8rQH3yJjMQF7Z11a8sQQKz1jYBLC_X5PGEuUNLkxBDXonLqOsGyJ6RUnZeQudzW5SeTejSoXAi1L1sDP6-fEQOeVmHGe' },
                  { quote: '"The student recording feature is a game changer for assessment. Hearing their thought process while they work is invaluable."', name: 'Elena Rodriguez', role: 'Curriculum Director, STEM Academy', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPzIaksImAqOgFKuADPU6c2gKKUMBU5KrbbMij650y6HFCHgcsQ9YXlQad0snqTAlgJ5kKfGG017bDLVo8VIhrYGQkAgfOxV0KU9-5NBHrRvMhHAdph-TaG4kxlgvyMoYJ5TbugnFkjsS31fBALUUzdKdSht-6W0gaCTY1ckIbu2pmiwpF7BdYcDv5qYoyvL8yJQyc4OdyJvrocATdEqKyttV-MH8ewOZOYiDndNiCnDVELxrj4Rtc6IYAdEimBzW2eZ4tCzdopnn7' },
                ].map(t => (
                  <div key={t.name} className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex gap-1 text-yellow-400 mb-4">
                      {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic mb-6 leading-relaxed">{t.quote}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('${t.img}')` }} />
                      <div>
                        <h5 className="font-bold text-sm">{t.name}</h5>
                        <p className="text-xs text-slate-500">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 -z-10" />
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Ready to Revolutionize Your Classroom?</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">Join educators worldwide creating the next generation of scientists.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="w-full sm:w-auto bg-primary text-white text-lg font-bold px-10 py-4 rounded-xl hover:brightness-110 transition-all shadow-xl shadow-primary/20">
                  Create an Account
                </Link>
                <Link to="/login" className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold px-10 py-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">
                  Sign In
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">science</span>
                  <span className="text-xl font-bold tracking-tight">EduAR</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mb-6">
                  Providing world-class augmented reality laboratory experiences for educational institutions since 2021.
                </p>
                <div className="flex gap-4">
                  <a className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="#">
                    <span className="material-symbols-outlined">public</span>
                  </a>
                  <a className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="#">
                    <span className="material-symbols-outlined">alternate_email</span>
                  </a>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-sm mb-6 uppercase tracking-widest text-slate-400 dark:text-slate-600">Product</h5>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                  <li><a className="hover:text-primary transition-colors" href="#features">Features</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#how-it-works">How it Works</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#use-cases">Use Cases</a></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-sm mb-6 uppercase tracking-widest text-slate-400 dark:text-slate-600">Company</h5>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                  <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Contact</a></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-sm mb-6 uppercase tracking-widest text-slate-400 dark:text-slate-600">Support</h5>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                  <li><a className="hover:text-primary transition-colors" href="#">Help Center</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Documentation</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Community</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-600">
              <p>© 2026 EduAR. All rights reserved.</p>
              <div className="flex gap-8">
                <a className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors" href="#">Privacy Policy</a>
                <a className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors" href="#">Terms of Service</a>
                <a className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors" href="#">Cookie Settings</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
