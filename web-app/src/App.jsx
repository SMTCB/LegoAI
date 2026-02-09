import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import NavBar from './components/NavBar';
import BuilderView from './views/BuilderView';
import ExplorerView from './views/ExplorerView';
import CollectionView from './views/CollectionView';
import WelcomeView from './views/WelcomeView';

import LoginView from './views/LoginView';
import { useApp } from './context/AppContext';

function MainLayout() {
  const { user } = useApp();
  const [view, setView] = useState('welcome'); // 'welcome', 'app'
  const [activeTab, setActiveTab] = useState('builder'); // 'builder', 'explore', 'collection'

  if (!user) {
    return <LoginView />;
  }

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setView('app');
  };

  if (view === 'welcome') {
    return <WelcomeView onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-nunito">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'builder' && <BuilderView onHome={() => setView('welcome')} />}
        {activeTab === 'explore' && <ExplorerView onHome={() => setView('welcome')} />}
        {activeTab === 'collection' && <CollectionView onHome={() => setView('welcome')} />}
      </main>

      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
