import React, { useState } from 'react';
import ChatPane from './components/ChatPane';
import SpecEditor from './components/SpecEditor';
import PrefsDropdowns from './components/PrefsDropdowns';
import SegmentSelector from './components/SegmentSelector';
import PlanTable from './components/PlanTable';
import type { CampaignSpec, Segment, CampaignPlan } from './api';

type WorkflowStep = 'spec' | 'prefs' | 'segments' | 'plan';

interface AppState {
  currentStep: WorkflowStep;
  campaignSpec: CampaignSpec | null;
  preferences: any;
  selectedSegments: Segment[];
  campaignPlan: CampaignPlan | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    currentStep: 'spec',
    campaignSpec: null,
    preferences: null,
    selectedSegments: [],
    campaignPlan: null,
  });

  const [messages, setMessages] = useState<Array<{
    type: 'user' | 'agent';
    content: string;
    timestamp: Date;
  }>>([
    {
      type: 'agent',
      content: 'Welcome to the CTV Campaign Management System! Upload a campaign brief to get started.',
      timestamp: new Date(),
    },
  ]);

  const addMessage = (type: 'user' | 'agent', content: string) => {
    setMessages(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const handleSpecComplete = (spec: CampaignSpec) => {
    setState(prev => ({ ...prev, campaignSpec: spec, currentStep: 'prefs' }));
    addMessage('agent', 'Campaign specification parsed successfully! Now select your preferences.');
  };

  const handlePrefsComplete = (prefs: any) => {
    setState(prev => ({ ...prev, preferences: prefs, currentStep: 'segments' }));
    addMessage('agent', 'Preferences saved! Now choose your target audience segments.');
  };

  const handleSegmentsComplete = (segments: Segment[]) => {
    setState(prev => ({ ...prev, selectedSegments: segments, currentStep: 'plan' }));
    addMessage('agent', 'Segments selected! Generating your campaign plan...');
  };

  const handlePlanComplete = (plan: CampaignPlan) => {
    setState(prev => ({ ...prev, campaignPlan: plan }));
    addMessage('agent', 'Campaign plan generated successfully! You can download the CSV or make adjustments.');
  };

  const renderRightPanel = () => {
    switch (state.currentStep) {
      case 'spec':
        return <SpecEditor onComplete={handleSpecComplete} onMessage={addMessage} />;
      case 'prefs':
        return <PrefsDropdowns spec={state.campaignSpec!} onComplete={handlePrefsComplete} onMessage={addMessage} />;
      case 'segments':
        return <SegmentSelector onComplete={handleSegmentsComplete} onMessage={addMessage} />;
      case 'plan':
        return <PlanTable spec={state.campaignSpec!} segments={state.selectedSegments} onComplete={handlePlanComplete} onMessage={addMessage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Panel - Chat */}
        <div className="bg-white border-r border-gray-200">
          <ChatPane messages={messages} currentStep={state.currentStep} />
        </div>
        
        {/* Right Panel - Workflow */}
        <div className="bg-gray-50 p-6">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  );
}

export default App;
