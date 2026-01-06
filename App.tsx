import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Playground } from './components/Playground';
import { Documentation } from './components/Documentation';
import { Footer } from './components/Footer';
import { UnlockModal } from './components/UnlockModal';
import { AuthModal } from './components/AuthModal';
import { authService, dbService } from './services/firebase';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

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
  const [jgVersion, setJgVersion] = useState<JGVersion>('v1.2');
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Data State
  const [unlockedVersions, setUnlockedVersions] = useState<JGVersion[]>(['v0.1-remastered']);
  const [pendingRequests, setPendingRequests] = useState<{version: JGVersion, utr: string}[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState<JGVersion | null>(null);
  
  // Global System Status
  const [dbError, setDbError] = useState<{message: string, link?: string} | null>(null);

  // Initialize Auth Listener & Real-time DB Listener
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = authService.onStateChange(async (currentUser) => {
        setUser(currentUser);
        
        // Cleanup previous profile listener if exists (e.g. on logout or user switch)
        if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
        }

        if (currentUser) {
            // Subscribe to real-time updates for automatic unlocking
            unsubscribeProfile = dbService.subscribeToUserProfile(
                currentUser.uid, 
                (profile) => {
                    // Success callback
                    setDbError(null); // Clear errors on success
                    if (profile) {
                        setUnlockedVersions(profile.unlockedVersions || ['v0.1-remastered']);
                        setPendingRequests(profile.pendingRequests || []);
                        
                        // Auto-close unlock modal if the requested version is now unlocked by admin
                        setShowUnlockModal(currentModal => {
                             if (currentModal && profile.unlockedVersions?.includes(currentModal)) {
                                 return null; // Close modal
                             }
                             return currentModal;
                        });
                    }
                },
                (error) => {
                    // Error callback
                    console.error("App DB Error:", error);
                    
                    // Handle specifically "database not found" (supports default or named)
                    if (error.message && error.message.includes('does not exist') && error.message.includes('database')) {
                        setDbError({
                            message: `Setup Required: Database '${dbService.getDatabaseId()}' not found.`,
                            link: "https://console.firebase.google.com/project/july-god-programming-language/firestore"
                        });
                    }
                    // Handle API disabled or RESTRICTED
                    else if (error.code === 'permission-denied' || (error.message && error.message.includes('Firestore API'))) {
                        setDbError({
                            message: "API Key Restricted: Go to Credentials > API Key > Restrictions.",
                            link: "https://console.cloud.google.com/apis/credentials?project=july-god-programming-language"
                        });
                    } else if (error.code === 'unavailable') {
                        setDbError({ message: "Network offline. Working in offline mode." });
                    }
                }
            );
        } else {
            // Reset to defaults
            setUnlockedVersions(['v0.1-remastered']);
            setPendingRequests([]);
            setDbError(null);
        }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Smooth scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleVersionChange = (version: JGVersion) => {
    setJgVersion(version);
  };

  const handleUnlockRequest = (version: JGVersion) => {
      if (!user) {
          setShowAuthModal(true);
      } else {
          setShowUnlockModal(version);
      }
  }

  const handlePendingSubmission = async (version: JGVersion, utr: string) => {
      if (user) {
          try {
              await dbService.submitPayment(user.uid, version, utr, user.displayName || 'User');
          } catch (e: any) {
              if (e.code === 'permission-denied' || e.message?.includes('Firestore API')) {
                   setDbError({
                        message: "API Key Restricted: Cannot submit. Check Credentials page.",
                        link: "https://console.cloud.google.com/apis/credentials?project=july-god-programming-language"
                   });
              }
              // We re-throw the error here so the UI (Modal) can stop loading and show the error state.
              throw e;
          }
      } else {
          // Should not happen, but safeguard
          throw new Error("User not authenticated.");
      }
  };

  // Check if a specific version is pending approval
  const isPending = (ver: JGVersion) => {
      return pendingRequests.some(r => r.version === ver);
  };

  return (
    <div className="min-h-screen text-jg-text font-sans antialiased relative selection:bg-jg-accent selection:text-white">
      
      <AmbientBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          currentView={currentView} 
          setView={setView} 
          jgVersion={jgVersion}
          setJgVersion={handleVersionChange}
          unlockedVersions={unlockedVersions}
          user={user}
          onOpenAuth={() => setShowAuthModal(true)}
        />
        
        {showAuthModal && (
            <AuthModal 
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => setShowAuthModal(false)}
            />
        )}

        {showUnlockModal && (
            <UnlockModal 
                version={showUnlockModal} 
                isPending={isPending(showUnlockModal)}
                onClose={() => setShowUnlockModal(null)}
                onSubmitRequest={(utr) => handlePendingSubmission(showUnlockModal, utr)}
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
        
        {/* Global System Error Banner */}
        {dbError && (
            <div className="fixed bottom-0 left-0 right-0 bg-red-900/95 backdrop-blur-md border-t border-red-500 p-4 z-[100] shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-red-500/20 rounded-full animate-pulse">
                            <AlertTriangle className="w-5 h-5 text-red-200" />
                        </div>
                        <div>
                            <p className="font-bold text-sm md:text-base">System Alert</p>
                            <p className="text-xs md:text-sm text-red-100">{dbError.message}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         {dbError.link && (
                            <a 
                                href={dbError.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-white text-red-900 text-xs font-bold rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                {dbError.message.includes('Database') ? 'Create Database' : 'Fix Credentials'} <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        <button 
                            onClick={() => setDbError(null)}
                            className="p-2 hover:bg-red-800 rounded-full text-red-200 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}

export default App;