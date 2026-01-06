import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Playground } from './components/Playground';
import { Documentation } from './components/Documentation';
import { Footer } from './components/Footer';
import { UnlockModal } from './components/UnlockModal';
import { AuthModal } from './components/AuthModal';
import { EmailConfigModal } from './components/EmailConfigModal';
import { authService, dbService } from './services/firebase';
import { AlertTriangle, ExternalLink, X, ShieldAlert } from 'lucide-react';

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
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  
  // Global System Status
  const [dbError, setDbError] = useState<{message: string, link?: string, type?: 'error'|'warning'|'rules'} | null>(null);

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
                    
                    const errMsg = error.message || '';
                    
                    // 1. Handle Rules Locked (Permission Denied)
                    if (error.code === 'permission-denied') {
                        // Check if it's explicitly API disabled or just rules
                        if (errMsg.includes('Firestore API') || errMsg.includes('disabled')) {
                             setDbError({
                                message: "Firestore API is disabled in Cloud Console.",
                                link: "https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=july-god-programming-language",
                                type: 'error'
                            });
                        } else {
                            // This is the common "Missing or insufficient permissions" error -> RULES LOCKED
                            setDbError({
                                message: "Database is Locked. You must Publish Security Rules in Firebase Console.",
                                link: "https://console.firebase.google.com/project/july-god-programming-language/firestore/rules",
                                type: 'rules'
                            });
                        }
                    }
                    // 2. Handle DB Missing (Default/MongoDB mismatch)
                    else if (error.code === 'not-found' || errMsg.includes('does not exist')) {
                         setDbError({
                            message: "Database not found or in wrong mode. Create '(default)' in Native Mode.",
                            link: "https://console.firebase.google.com/project/july-god-programming-language/firestore",
                            type: 'error'
                        });
                    }
                    // 3. Network / Offline
                    else if (error.code === 'unavailable') {
                        setDbError({ message: "Network offline. Working in offline mode.", type: 'warning' });
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
              const errMsg = e.message || '';
              if (e.code === 'permission-denied') {
                   if (errMsg.includes('Firestore API')) {
                        setDbError({
                            message: "Firestore API is disabled.",
                            link: "https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=july-god-programming-language",
                            type: 'error'
                        });
                   } else {
                        setDbError({
                            message: "Security Rules blocked this request. Check Firebase Console.",
                            link: "https://console.firebase.google.com/project/july-god-programming-language/firestore/rules",
                            type: 'rules'
                        });
                   }
              } else if (e.code === 'not-found') {
                   setDbError({
                        message: "Database missing. Create '(default)' DB in Firebase.",
                        link: "https://console.firebase.google.com/project/july-god-programming-language/firestore",
                        type: 'error'
                   });
              }
              throw e;
          }
      } else {
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
        
        {showEmailConfig && (
            <EmailConfigModal onClose={() => setShowEmailConfig(false)} />
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
                onOpenEmailConfig={() => setShowEmailConfig(true)}
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
            <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-md border-t p-4 z-[100] shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${
                dbError.type === 'rules' 
                ? 'bg-yellow-900/95 border-yellow-500' 
                : 'bg-red-900/95 border-red-500'
            }`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-white">
                        <div className={`p-2 rounded-full animate-pulse ${
                             dbError.type === 'rules' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                        }`}>
                            {dbError.type === 'rules' ? <ShieldAlert className="w-5 h-5 text-yellow-200" /> : <AlertTriangle className="w-5 h-5 text-red-200" />}
                        </div>
                        <div>
                            <p className="font-bold text-sm md:text-base">
                                {dbError.type === 'rules' ? 'Security Rules Locked' : 'System Alert'}
                            </p>
                            <p className={`text-xs md:text-sm ${
                                dbError.type === 'rules' ? 'text-yellow-100' : 'text-red-100'
                            }`}>{dbError.message}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         {dbError.link && (
                            <a 
                                href={dbError.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`px-4 py-2 text-xs font-bold rounded hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                                    dbError.type === 'rules' 
                                    ? 'bg-yellow-100 text-yellow-900' 
                                    : 'bg-white text-red-900'
                                }`}
                            >
                                {dbError.type === 'rules' ? 'Open Rules Tab' : 'Fix Issue'} <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        <button 
                            onClick={() => setDbError(null)}
                            className={`p-2 rounded-full transition-colors ${
                                dbError.type === 'rules' ? 'hover:bg-yellow-800 text-yellow-200' : 'hover:bg-red-800 text-red-200'
                            }`}
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