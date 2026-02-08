import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import NavBar from './components/NavBar';
import BuilderView from './views/BuilderView';
import ExplorerView from './views/ExplorerView';
import CollectionView from './views/CollectionView';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder', 'explore', 'collection'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'builder' && <BuilderView />}
        {activeTab === 'explore' && <ExplorerView />}
        {activeTab === 'collection' && <CollectionView />}
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
