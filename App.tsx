import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Playground } from './components/Playground';
import { Documentation } from './components/Documentation';
import { Footer } from './components/Footer';
import { UnlockModal } from './components/UnlockModal';
import { AuthModal } from './components/AuthModal';
import { authService, dbService, UserProfile } from './services/firebase';
import { AlertTriangle, ExternalLink, X, ShieldAlert, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

export type JGVersion = 'v0' | 'v0.1-remastered' | 'v1.0' | 'v1.1' | 'v1.2';
const ADMIN_EMAIL = "Divitbansal016@gmail.com";

const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[#020617]" />
    <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-jg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
    <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-jg-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
    <div className="absolute bottom-[-10%] left-[20%] w-[45rem] h-[45rem] bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
  </div>
);

function App() {
  const [currentView, setView] = useState<'home' | 'playground' | 'docs'>('home');
  const [jgVersion, setJgVersion] = useState<JGVersion>('v1.2');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unlockedVersions, setUnlockedVersions] = useState<JGVersion[]>(['v0.1-remastered']);
  const [pendingRequests, setPendingRequests] = useState<{version: JGVersion, utr: string}[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState<JGVersion | null>(null);
  
  const [adminTask, setAdminTask] = useState<{status: 'idle'|'processing'|'success'|'error', message: string}>({ status: 'idle', message: '' });
  const hasProcessedRef = useRef(false);

  const [dbError, setDbError] = useState<{message: string, link?: string, type?: 'error'|'warning'|'rules'} | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = authService.onStateChange(async (currentUser) => {
        setUser(currentUser);
        if (unsubscribeProfile) { unsubscribeProfile(); unsubscribeProfile = null; }

        if (currentUser) {
            unsubscribeProfile = dbService.subscribeToUserProfile(
                currentUser.uid, 
                (profile) => {
                    setDbError(null);
                    setUserProfile(profile);
                    if (profile) {
                        setUnlockedVersions(profile.unlockedVersions || ['v0.1-remastered']);
                        setPendingRequests(profile.pendingRequests || []);
                    }
                },
                (error) => {
                    if (error.code === 'permission-denied') {
                        setDbError({ 
                            message: "Database Access Restricted. Check Security Rules.", 
                            type: 'rules', 
                            link: "https://console.firebase.google.com" 
                        });
                    }
                }
            );
        } else {
            setUnlockedVersions(['v0.1-remastered']);
            setPendingRequests([]);
            setUserProfile(null);
        }
    });
    return () => { unsubscribeAuth(); if (unsubscribeProfile) unsubscribeProfile(); };
  }, []);

  // Compute Unlocked Status - Direct check to ensure no memoization staleness
  const checkIsUnlocked = (v: JGVersion) => {
      if (v === 'v1.0' || v === 'v0.1-remastered') return true;
      if (unlockedVersions.includes(v)) return true;
      if (userProfile?.trials?.[v]) {
          const expiry = new Date(userProfile.trials[v]);
          return expiry.getTime() > Date.now();
      }
      return false;
  };

  // Remote Unlock Logic for Admin
  useEffect(() => {
    const handleUrlAction = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
      const action = queryParams.get('action') || (hash.includes('unlock') ? 'unlock' : null);
      const targetUid = queryParams.get('target_uid') || hashParams.get('target_uid');
      const targetVer = (queryParams.get('target_ver') || hashParams.get('target_ver')) as JGVersion;

      if (action === 'unlock' && targetUid && targetVer && !hasProcessedRef.current) {
        if (!user) {
          setAdminTask({ status: 'error', message: 'Admin login required to approve payment.' });
          setShowAuthModal(true);
          return;
        }
        if (user.email !== ADMIN_EMAIL) {
          setAdminTask({ status: 'error', message: 'Access Denied: Only Divit can unlock users.' });
          return;
        }

        hasProcessedRef.current = true;
        setAdminTask({ status: 'processing', message: `Verifying payment and unlocking ${targetVer.toUpperCase()}...` });
        
        try {
          await dbService.adminUnlockVersion(user.uid, targetUid, targetVer);
          setAdminTask({ status: 'success', message: `Payment Approved! User unlocked.` });
          setTimeout(() => {
             window.history.replaceState({}, document.title, window.location.pathname);
             setAdminTask({ status: 'idle', message: '' });
             hasProcessedRef.current = false;
          }, 8000);
        } catch (e: any) {
          console.error("Unlock error:", e);
          setAdminTask({ status: 'error', message: `Critical Failure: ${e.message}` });
          hasProcessedRef.current = false;
        }
      }
    };
    handleUrlAction();
  }, [user]);

  return (
    <div className="min-h-screen text-jg-text font-sans antialiased relative selection:bg-jg-accent selection:text-white">
      <AmbientBackground />

      {adminTask.status !== 'idle' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300">
            <div className={`p-12 rounded-[2rem] border-2 flex flex-col items-center gap-8 max-w-sm text-center shadow-2xl ${
                adminTask.status === 'success' ? 'bg-green-950/50 border-green-500/50 text-green-400' :
                adminTask.status === 'error' ? 'bg-red-950/50 border-red-500/50 text-red-400' :
                'bg-jg-surface border-jg-primary/50 text-white'
            }`}>
                {adminTask.status === 'processing' && <Loader2 className="w-20 h-20 animate-spin text-jg-primary" />}
                {adminTask.status === 'success' && <ShieldCheck className="w-20 h-20 text-green-500" />}
                {adminTask.status === 'error' && <AlertTriangle className="w-20 h-20 text-red-500" />}
                
                <div className="space-y-3">
                    <h3 className="text-3xl font-black tracking-tight uppercase">Admin Console</h3>
                    <p className="text-lg leading-relaxed opacity-90">{adminTask.message}</p>
                </div>

                {adminTask.status === 'error' && (
                    <button 
                        onClick={() => { setAdminTask({status:'idle', message:''}); hasProcessedRef.current = false; }} 
                        className="px-10 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all shadow-xl active:scale-95"
                    >
                        Close Console
                    </button>
                )}
                
                {adminTask.status === 'success' && (
                    <div className="flex items-center gap-2 text-xs font-mono text-green-500/60 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" /> Database Synced
                    </div>
                )}
            </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          currentView={currentView} setView={setView} 
          jgVersion={jgVersion} setJgVersion={setJgVersion}
          unlockedVersions={unlockedVersions} user={user}
          userProfile={userProfile}
          onOpenAuth={() => setShowAuthModal(true)}
        />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
        {showUnlockModal && <UnlockModal version={showUnlockModal} isPending={pendingRequests.some(r => r.version === showUnlockModal)} userProfile={userProfile} onClose={() => setShowUnlockModal(null)} onSubmitRequest={async (utr) => { await dbService.submitPayment(user.uid, showUnlockModal!, utr, user.displayName || 'User'); }} />}
        <main className="flex-grow flex flex-col pt-16">
          {currentView === 'home' && <Hero onGetStarted={() => setView('playground')} onReadDocs={() => setView('docs')} />}
          {currentView === 'playground' && <Playground jgVersion={jgVersion} userProfile={userProfile} isUnlocked={checkIsUnlocked(jgVersion)} onRequestUnlock={() => user ? setShowUnlockModal(jgVersion) : setShowAuthModal(true)} />}
          {currentView === 'docs' && <Documentation jgVersion={jgVersion} />}
        </main>
        <Footer />
        {dbError && <div className="fixed bottom-0 left-0 right-0 bg-red-900/90 backdrop-blur-md border-t border-red-500 p-4 z-[100] flex justify-between items-center text-white">
            <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-200" /><span className="text-sm font-bold">{dbError.message}</span></div>
            {dbError.link && <a href={dbError.link} target="_blank" className="text-xs underline">Fix in Console</a>}
            <button onClick={() => setDbError(null)}><X className="w-5 h-5" /></button>
        </div>}
      </div>
    </div>
  );
}

export default App;
