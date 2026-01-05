import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Playground } from './components/Playground';
import { Documentation } from './components/Documentation';
import { Footer } from './components/Footer';
import { UnlockModal } from './components/UnlockModal';

export type JGVersion = 'v0' | 'v0.1-remastered' | 'v1.0' | 'v1.1' | 'v1.2';

// Premium Ambient Background Component
const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    {/* Base Dark Layer */}
    <div className="absolute inset-0 bg-[#020617]" />
    
    {/* Animated Glowing Orbs */}
    <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-jg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
    <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-jg-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
    <div className="absolute bottom-[-10%] left-[20%] w-[45rem] h-[45rem] bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
    
    {/* Subtle Noise Texture for texture */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    
    {/* faint Grid overlay for engineering feel */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
  </div>
);

function App() {
  const [currentView, setView] = useState<'home' | 'playground' | 'docs'>('home');
  // Default to V1.2 (Flagship) to showcase it, even if locked
  const [jgVersion, setJgVersion] = useState<JGVersion>('v1.2');
  
  // Initialize Unlocked Versions (V1.2 is PAID at ₹1400, so it is NOT in this list by default)
  const [unlockedVersions, setUnlockedVersions] = useState<JGVersion[]>(['v0.1-remastered']);
  const [showUnlockModal, setShowUnlockModal] = useState<JGVersion | null>(null);

  // Smooth scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleVersionChange = (version: JGVersion) => {
    // We allow users to switch to any version to see it, 
    // but the Playground component will handle the "Locked" state visualization.
    setJgVersion(version);
    
    // If they switch to a locked version (except v1.0 which has a free tier), we can optionally pop the modal,
    // but a better UX is to let them see the UI and block execution in the playground.
    if (version !== 'v1.0' && !unlockedVersions.includes(version)) {
        // Optional: immediately prompt? No, let Playground handle the call to action.
    }
  };

  const handleUnlockRequest = (version: JGVersion) => {
      setShowUnlockModal(version);
  }

  const handleUnlock = (version: JGVersion) => {
      setUnlockedVersions(prev => [...prev, version]);
      setJgVersion(version);
      setShowUnlockModal(null);
  };

  return (
    <div className="min-h-screen text-jg-text font-sans antialiased relative selection:bg-jg-accent selection:text-white">
      
      {/* 1. Global Background Layer */}
      <AmbientBackground />

      {/* 2. Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          currentView={currentView} 
          setView={setView} 
          jgVersion={jgVersion}
          setJgVersion={handleVersionChange}
          unlockedVersions={unlockedVersions}
        />
        
        {showUnlockModal && (
            <UnlockModal 
                version={showUnlockModal} 
                onClose={() => setShowUnlockModal(null)}
                onUnlock={() => handleUnlock(showUnlockModal)}
            />
        )}

        <main className="flex-grow flex flex-col pt-16">
          {currentView === 'home' && (
            <div className="animate-fade-in">
              <Hero 
                onGetStarted={() => setView('playground')} 
                onReadDocs={() => setView('docs')} 
              />
            </div>
          )}
          
          {currentView === 'playground' && (
             // On mobile, let content determine height. On desktop (lg), allow playground to manage full height
             <div className="animate-fade-in flex-grow flex flex-col lg:h-full">
              <Playground 
                  jgVersion={jgVersion} 
                  isUnlocked={unlockedVersions.includes(jgVersion)}
                  onRequestUnlock={() => handleUnlockRequest(jgVersion)}
              />
            </div>
          )}
          
          {currentView === 'docs' && (
             <div className="animate-fade-in">
              <Documentation jgVersion={jgVersion} />
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;