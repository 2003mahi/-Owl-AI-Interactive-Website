
import React, { useState } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import WisdomEngine from './components/WisdomEngine';
import NightVision from './components/NightVision';
import LivePerch from './components/LivePerch';
import { AppSection } from './types';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.HOME);

  const renderContent = () => {
    switch (activeSection) {
      case AppSection.HOME:
        return <Home onNavigate={setActiveSection} />;
      case AppSection.WISDOM:
        return <WisdomEngine />;
      case AppSection.VISION:
        return <NightVision />;
      case AppSection.LIVE:
        return <LivePerch />;
      default:
        return <Home onNavigate={setActiveSection} />;
    }
  };

  return (
    <Layout activeSection={activeSection} onNavigate={setActiveSection}>
      {renderContent()}
    </Layout>
  );
};

export default App;
