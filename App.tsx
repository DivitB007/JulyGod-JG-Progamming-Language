
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Playground } from './components/Playground';
import { Documentation } from './components/Documentation';
import { News } from './components/News';
import { Footer } from './components/Footer';
import { UnlockModal } from './components/UnlockModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { authService, dbService, UserProfile } from './services/firebase';
import { AlertTriangle, ExternalLink, X, ShieldAlert, Loader2, CheckCircle2, ShieldCheck, MailWarning, Trash2, ShieldX } from 'lucide-react';

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
  const [currentView, setView] = useState<'home' | 'playground' | 'docs' | 'news' | 'admin'>('home');
  const [jgVersion, setJgVersion] = useState<JGVersion>('v1.2');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unlockedVersions, setUnlockedVersions] = useState<JGVersion[]>(['v0.1-remastered']);
  const [pendingRequests, setPendingRequests] = useState<{version: JGVersion, utr: string}[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState<JGVersion | null>(null);
  
  const [adminTask, setAdminTask] = useState<{status: 'idle'|'processing'|'success'|'error', message: string, type?: 'unlock'|'deny'}>({ status: 'idle', message: '' });
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
                        // Admin bypass: if the user is the owner, ignore the error and keep trying
                        if (currentUser.email === ADMIN_EMAIL) return;
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
            if (currentView === 'admin') setView('home');
        }
    });
    return () => { unsubscribeAuth(); if (unsubscribeProfile) unsubscribeProfile(); };
  }, [currentView]);

  const checkIsUnlocked = (v: JGVersion) => {
      if (user?.email === ADMIN_EMAIL || userProfile?.email === ADMIN_EMAIL) return true;
      if (v === 'v1.0' || v === 'v0.1-remastered') return true;
      if (unlockedVersions.includes(v)) return true;
      if (userProfile?.trials?.[v]) {
          const expiry = new Date(userProfile.trials[v]);
          return expiry.getTime() > Date.now();
      }
      return false;
  };

  useEffect(() => {
    const handleUrlAction = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const action = queryParams.get('action') || (hash.includes('action=') ? hash.split('action=')[1].split('&')[0] : null);
      const targetUid = queryParams.get('target_uid') || (hash.includes('target_uid=') ? hash.split('target_uid=')[1].split('&')[0] : null);
      const targetVer = (queryParams.get('target_ver') || (hash.includes('target_ver=') ? hash.split('target_ver=')[1].split('&')[0] : null)) as JGVersion;

      if ((action === 'unlock' || action === 'deny') && targetUid && targetVer && !hasProcessedRef.current) {
        if (!user) {
          setAdminTask({ status: 'error', message: 'Admin login required to process request.' });
          setShowAuthModal(true);
          return;
        }
        if (user.email !== ADMIN_EMAIL) {
          setAdminTask({ status: 'error', message: 'Access Denied: Only Admin can manage payments.' });
          return;
        }

        hasProcessedRef.current = true;
        setAdminTask({ 
            status: 'processing', 
            message: action === 'unlock' ? `Unlocking ${targetVer.toUpperCase()}...` : `Flagging ${targetVer.toUpperCase()} as fake...`,
            type: action as 'unlock' | 'deny'
        });
        
        try {
          if (action === 'unlock') {
              await dbService.adminUnlockVersion(user.uid, targetUid, targetVer);
              setAdminTask({ status: 'success', message: `Request Approved! Access granted.`, type: 'unlock' });
          } else {
              await dbService.adminDenyVersion(user.uid, targetUid, targetVer);
              setAdminTask({ status: 'success', message: `Request Denied! Transaction marked as fake.`, type: 'deny' });
          }
          
          setTimeout(() => {
             window.history.replaceState({}, document.title, window.location.pathname);
             setAdminTask({ status: 'idle', message: '' });
             hasProcessedRef.current = false;
          }, 8000);
        } catch (e: any) {
          console.error("Admin action error:", e);
          setAdminTask({ status: 'error', message: `Critical Failure: ${e.message}` });
          hasProcessedRef.current = false;
        }
      }
    };
    handleUrlAction();
  }, [user]);

  const isBannedAndPastDate = userProfile?.isBanned && userProfile.banDate && new Date(userProfile.banDate).getTime() < Date.now();

  if (isBannedAndPastDate) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-6">
                  <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-red-500 animate-pulse">
                      <ShieldX className="w-12 h-12 text-red-500" />
                  </div>
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Access Revoked</h1>
                  <p className="text-gray-400 leading-relaxed">Your JulyGod profile has been permanently suspended by the Owner.</p>
                  <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 text-red-400 text-sm font-mono">
                      Reason: {userProfile.banReason || "Policy Violation"}
                  </div>
                  <button onClick={() => authService.signOut()} className="px-8 py-3 bg-white text-black font-bold rounded-lg">Sign Out</button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen text-jg-text font-sans antialiased relative selection:bg-jg-accent selection:text-white">
      <AmbientBackground />

      {adminTask.status !== 'idle' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300">
            <div className={`p-12 rounded-[2rem] border-2 flex flex-col items-center gap-8 max-w-sm text-center shadow-2xl ${
                adminTask.status === 'success' && adminTask.type === 'unlock' ? 'bg-green-950/50 border-green-500/50 text-green-400' :
                adminTask.status === 'success' && adminTask.type === 'deny' ? 'bg-orange-950/50 border-orange-500/50 text-orange-400' :
                adminTask.status === 'error' ? 'bg-red-950/50 border-red-500/50 text-red-400' :
                'bg-jg-surface border-jg-primary/50 text-white'
            }`}>
                {adminTask.status === 'processing' && <Loader2 className="w-20 h-20 animate-spin text-jg-primary" />}
                {adminTask.status === 'success' && adminTask.type === 'unlock' && <ShieldCheck className="w-20 h-20 text-green-500" />}
                {adminTask.status === 'success' && adminTask.type === 'deny' && <Trash2 className="w-20 h-20 text-orange-500" />}
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
            </div>
        </div>
      )}

      {userProfile?.systemMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-jg-surface border-2 border-orange-500/50 p-6 rounded-2xl shadow-2xl flex items-start gap-4">
                <MailWarning className="w-6 h-6 text-orange-500 shrink-0" />
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">System Alert</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{userProfile.systemMessage}</p>
                    <button 
                        onClick={() => dbService.clearSystemMessage(user.uid)}
                        className="mt-4 text-[10px] font-bold text-orange-400 hover:text-white uppercase tracking-wider"
                    >
                        Dismiss Notification
                    </button>
                </div>
                <button onClick={() => dbService.clearSystemMessage(user.uid)} className="text-gray-500 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
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
          {currentView === 'news' && <News isAdmin={user?.email === ADMIN_EMAIL} />}
          {currentView === 'admin' && <AdminDashboard />}
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
