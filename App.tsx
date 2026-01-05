import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Playground } from './components/Playground';
import { Documentation } from './components/Documentation';
import { Footer } from './components/Footer';
import { UnlockModal } from './components/UnlockModal';

export type JGVersion = 'v0' | 'v0.1-remastered' | 'v1.0' | 'v1.1' | 'v1.2';

function App() {
  const [currentView, setView] = useState<'home' | 'playground' | 'docs'>('home');
  const [jgVersion, setJgVersion] = useState<JGVersion>('v0.1-remastered');
  
  // V0.1 and V0 (legacy) are usually accessible, but V0 might have limits.
  // We initialize with free tiers.
  const [unlockedVersions, setUnlockedVersions] = useState<JGVersion[]>(['v0.1-remastered']);
  const [showUnlockModal, setShowUnlockModal] = useState<JGVersion | null>(null);

  const handleVersionChange = (version: JGVersion) => {
    // V1.0 has a free daily limit, so we allow selecting it even if not "unlocked" (paid)
    // The limit enforcement happens in Playground.
    if (version === 'v1.0' || unlockedVersions.includes(version)) {
        setJgVersion(version);
    } else {
        setShowUnlockModal(version);
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
    <div className="min-h-screen bg-jg-dark text-white font-sans selection:bg-jg-primary selection:text-white">
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

      <main>
        {currentView === 'home' && (
          <>
            <Hero 
              onGetStarted={() => setView('playground')} 
              onReadDocs={() => setView('docs')} 
            />
          </>
        )}
        
        {currentView === 'playground' && (
            <Playground 
                jgVersion={jgVersion} 
                isUnlocked={unlockedVersions.includes(jgVersion)}
                onRequestUnlock={() => handleUnlockRequest(jgVersion)}
            />
        )}
        
        {currentView === 'docs' && (
            <Documentation jgVersion={jgVersion} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;