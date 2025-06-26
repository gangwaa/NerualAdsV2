import React, { useState, useEffect } from 'react';
import AgentThinking from './AgentThinking';
import CampaignSteps from './CampaignSteps';
import DataViewer from './DataViewer';
import ChatInterface from './ChatInterface';

interface AgentState {
  current_step: string;
  progress: number;
  last_reasoning: string;
  next_action: string;
  avatar_state: 'thinking' | 'generating' | 'analyzing' | 'complete';
}

interface CampaignData {
  step: string;
  data: any;
  confidence: number;
  timestamp: string;
}

const AgenticWorkspace: React.FC = () => {
  const [agentState, setAgentState] = useState<AgentState>({
    current_step: 'campaign_data',
    progress: 0,
    last_reasoning: '',
    next_action: '',
    avatar_state: 'thinking'
  });

  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCampaignInput = async (input: string, files?: FileList) => {
    setIsProcessing(true);
    setAgentState(prev => ({ ...prev, avatar_state: 'analyzing' }));
    
    try {
      // TODO: Connect to COT Agent API
      const response = await fetch('http://localhost:8000/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, files: files ? Array.from(files) : [] })
      });
      
      const result = await response.json();
      
      setAgentState({
        current_step: result.step,
        progress: result.progress,
        last_reasoning: result.reasoning,
        next_action: result.action,
        avatar_state: 'thinking'
      });
      
      setCampaignData(prev => [...prev, {
        step: result.step,
        data: result.data,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      }]);
      
    } catch (error) {
      console.error('Agent processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 'campaign_data', title: 'Campaign Parameters', icon: '📊', color: 'blue' },
    { id: 'advertiser_preferences', title: 'Historical Data', icon: '📈', color: 'purple' },
    { id: 'audience_generation', title: 'Audience Analysis', icon: '🎯', color: 'green' },
    { id: 'campaign_generation', title: 'Media Plan', icon: '⚡', color: 'orange' }
  ];

  const getStepStatus = (stepId: string) => {
    if (agentState.current_step === stepId) return 'active';
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === agentState.current_step);
    return stepIndex < currentIndex ? 'completed' : 'pending';
  };

  const getCurrentStepData = () => {
    return campaignData.find(data => data.step === agentState.current_step);
  };

  const renderStepContent = () => {
    const stepData = getCurrentStepData();
    
    switch (agentState.current_step) {
      case 'campaign_data':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Campaign Parameters</h3>
              <p className="text-blue-700 mb-4">Define campaign basics</p>
              {stepData?.data && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser</label>
                    <input 
                      type="text" 
                      value={stepData.data.advertiser || ''} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <input 
                      type="text" 
                      value={stepData.data.budget ? `$${stepData.data.budget}` : ''} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                    <input 
                      type="text" 
                      value={stepData.data.objective || ''} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                    <input 
                      type="text" 
                      value={stepData.data.timeline || ''} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'advertiser_preferences':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Historical Data</h3>
              <p className="text-purple-700 mb-4">Review performance data</p>
              <div className="text-sm text-purple-600">
                <p>🔍 Analyzing historical data...</p>
                {stepData && <p>✅ Found {Object.keys(stepData.data || {}).length} data points</p>}
              </div>
            </div>
          </div>
        );
        
      case 'audience_generation':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Audience Analysis</h3>
              <p className="text-green-700 mb-4">Analyze target audience</p>
              {stepData?.data?.acr_segments && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">ACR Segments:</h4>
                  <div className="flex flex-wrap gap-2">
                    {stepData.data.acr_segments.map((segment: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {segment}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'campaign_generation':
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">Media Plan</h3>
              <p className="text-orange-700 mb-4">Generate media strategy</p>
              {stepData?.data?.line_items && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Line Items Generated:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Name</th>
                          <th className="text-left py-2">Content</th>
                          <th className="text-left py-2">Geo</th>
                          <th className="text-left py-2">Device</th>
                          <th className="text-left py-2">CPM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stepData.data.line_items.slice(0, 3).map((item: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{item.name}</td>
                            <td className="py-2">{item.content}</td>
                            <td className="py-2">{item.geo}</td>
                            <td className="py-2">{item.device}</td>
                            <td className="py-2">{item.bid_cpm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Neural</h1>
                <p className="text-sm text-gray-500">Ad Planning Assistant</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              agentState.avatar_state === 'thinking' ? 'bg-blue-100 animate-pulse' :
              agentState.avatar_state === 'generating' ? 'bg-green-100' :
              agentState.avatar_state === 'analyzing' ? 'bg-yellow-100' :
              'bg-purple-100'
            }`}>
              <span className="text-2xl">
                {agentState.avatar_state === 'thinking' ? '🤔' :
                 agentState.avatar_state === 'generating' ? '⚡' :
                 agentState.avatar_state === 'analyzing' ? '🔍' : '✅'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Neural Agent</p>
              <p className="text-xs text-gray-500 capitalize">{agentState.avatar_state}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Three Panel Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        
        {/* Left Sidebar - Chat Assistant */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">💬</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Chat Assistant</h2>
            </div>
            <p className="text-sm text-gray-500">• 5 advertisers loaded</p>
          </div>
          <div className="flex-1">
            <ChatInterface 
              onCampaignInput={handleCampaignInput}
              isProcessing={isProcessing}
              agentState={agentState}
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 flex flex-col">
          
          {/* Top Right - Progress Tracker */}
          <div className="h-32 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Ad Planning Progress</h2>
              <span className="text-sm text-gray-500">{Math.round(agentState.progress / 25)} Step Running</span>
            </div>
            
            {/* 4-Step Progress Bar */}
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                      status === 'active' ? `bg-${step.color}-500 text-white animate-pulse` :
                      status === 'completed' ? `bg-${step.color}-500 text-white` :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {status === 'completed' ? '✓' : step.icon}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium ${
                        status === 'active' ? 'text-blue-600' :
                        status === 'completed' ? 'text-green-600' :
                        'text-gray-400'
                      }`}>
                        Step {index + 1}
                      </p>
                      <p className={`text-xs ${
                        status !== 'pending' ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-gray-50 overflow-auto">
            <div className="p-6">
              {renderStepContent()}
            </div>
            
            {/* Agent Reasoning (if active) */}
            {agentState.last_reasoning && (
              <div className="p-6 border-t border-gray-200 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Agent Reasoning</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {agentState.last_reasoning}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticWorkspace; 