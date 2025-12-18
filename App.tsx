import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AccountTable from './components/AccountTable';
import Login from './components/Login';
import { AppView, UserAccount, AuthState } from './types';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [data, setData] = useState<UserAccount[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setAuthState({
            isAuthenticated: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            }
          });
        } else {
          setAuthState({ isAuthenticated: false, user: null });
        }
        setIsLoadingAuth(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  const fetchAccounts = async () => {
    if (!db || !authState.isAuthenticated) return;
    
    setIsLoadingData(true);
    try {
      const querySnapshot = await getDocs(collection(db, "accounts"));
      const accounts: UserAccount[] = [];
      querySnapshot.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() } as UserAccount);
      });
      setData(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchAccounts();
    }
  }, [authState.isAuthenticated]);

  const handleAddAccount = async (newAccount: Omit<UserAccount, 'id'>) => {
    if (!db) return;
    try {
        await addDoc(collection(db, "accounts"), newAccount);
        await fetchAccounts();
    } catch (error) {
        console.error("Error adding account:", error);
        alert("Failed to add account.");
    }
  };

  const handleUpdateAccount = async (id: string, updates: Partial<UserAccount>) => {
    if (!db) return;
    try {
      const accountRef = doc(db, "accounts", id);
      await updateDoc(accountRef, updates);
      await fetchAccounts();
    } catch (error) {
      console.error("Error updating account:", error);
      alert("Failed to update account.");
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "accounts", id));
      await fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account.");
    }
  };

  const handleBulkAction = async (ids: string[], action: 'archive' | 'restore' | 'delete') => {
    if (!db) return;
    try {
      const batch = writeBatch(db);
      if (action === 'delete') {
        ids.forEach(id => batch.delete(doc(db, "accounts", id)));
      } else {
        const isArchived = action === 'archive';
        ids.forEach(id => {
          batch.update(doc(db, "accounts", id), { isArchived });
        });
      }
      await batch.commit();
      await fetchAccounts();
    } catch (error) {
      console.error("Bulk action failed:", error);
      alert("Bulk operation failed.");
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    } else {
      setAuthState({ isAuthenticated: false, user: null });
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Login onLoginSuccess={() => {}} />;
  }

  const renderContent = () => {
    if (isLoadingData && data.length === 0) {
       return (
         <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400">Loading database...</p>
            </div>
         </div>
       );
    }

    if (!isLoadingData && data.length === 0 && currentView !== AppView.SETTINGS) {
        if (currentView === AppView.ACCOUNTS) {
             return (
              <AccountTable 
                data={data} 
                onAddAccount={handleAddAccount} 
                onUpdateAccount={handleUpdateAccount} 
                onDeleteAccount={handleDeleteAccount}
                onBulkAction={handleBulkAction}
              />
             );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-6">
                <div className="text-center max-w-lg bg-slate-800 p-8 rounded-2xl border border-slate-700">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📭</span>
                    </div>
                    <h2 className="text-xl text-white font-semibold mb-2">Database Empty</h2>
                    <p className="text-slate-400 mb-6">Start by adding your first social media account.</p>
                    <button 
                        onClick={() => setCurrentView(AppView.ACCOUNTS)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        Add Your First Account
                    </button>
                </div>
            </div>
        );
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard data={data.filter(acc => !acc.isArchived)} />;
      case AppView.ACCOUNTS:
        return (
          <AccountTable 
            data={data} 
            onAddAccount={handleAddAccount} 
            onUpdateAccount={handleUpdateAccount} 
            onDeleteAccount={handleDeleteAccount}
            onBulkAction={handleBulkAction}
          />
        );
      case AppView.SETTINGS:
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-lg bg-slate-800 p-8 rounded-2xl border border-slate-700">
                    <h2 className="text-xl text-white font-semibold mb-4 text-left">System Preferences</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-xl border border-slate-700">
                        <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold uppercase">
                          {authState.user?.displayName?.[0] || authState.user?.email?.[0]}
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{authState.user?.displayName || 'Administrator'}</p>
                          <p className="text-sm text-slate-400">{authState.user?.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 text-left">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Entries</p>
                          <p className="text-xl text-white font-bold">{data.length}</p>
                        </div>
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 text-left">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Archived</p>
                          <p className="text-xl text-white font-bold">{data.filter(a => a.isArchived).length}</p>
                        </div>
                      </div>
                    </div>
                </div>
            </div>
        );
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-4 md:px-8 justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white p-1">
                  <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold text-slate-200">
                {currentView === AppView.DASHBOARD && 'Operational Dashboard'}
                {currentView === AppView.ACCOUNTS && 'Data Management'}
                {currentView === AppView.SETTINGS && 'Account Settings'}
              </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-medium text-slate-300">Live Sync Active</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase ring-2 ring-slate-800">
                {authState.user?.displayName?.[0] || authState.user?.email?.[0]}
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;