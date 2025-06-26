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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Neural Ads Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Neural Ads</h1>
                <p className="text-sm text-gray-500">CTV Campaign Intelligence</p>
              </div>
            </div>
            
            {/* Client Logo Placeholder */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Client Brand</span>
            </div>
          </div>
          
          {/* Agent Avatar */}
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
              <p className="text-sm font-medium text-gray-900">AI Agent</p>
              <p className="text-xs text-gray-500 capitalize">{agentState.avatar_state}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2x2 Grid Workspace */}
      <div className="grid grid-cols-2 grid-rows-2 h-[calc(100vh-80px)]">
        
        {/* Top Left: Chat Interface (Co-pilot) */}
        <div className="border-r border-b border-gray-200 bg-white">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Co-pilot</h2>
              <p className="text-sm text-gray-500">Describe your campaign or upload requirements</p>
            </div>
            <div className="flex-1">
              <ChatInterface 
                onCampaignInput={handleCampaignInput}
                isProcessing={isProcessing}
                agentState={agentState}
              />
            </div>
          </div>
        </div>

        {/* Top Right: Agent Thinking (COT Display) */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Agent Reasoning</h2>
              <p className="text-sm text-gray-500">Chain of thought process</p>
            </div>
            <div className="flex-1 overflow-auto">
              <AgentThinking 
                reasoning={agentState.last_reasoning}
                currentStep={agentState.current_step}
                progress={agentState.progress}
                avatarState={agentState.avatar_state}
              />
            </div>
          </div>
        </div>

        {/* Bottom Left: Campaign Steps (Visual Flow) */}
        <div className="border-r border-gray-200 bg-white">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Setup Flow</h2>
              <p className="text-sm text-gray-500">Step-by-step progress</p>
            </div>
            <div className="flex-1 overflow-auto">
              <CampaignSteps 
                currentStep={agentState.current_step}
                progress={agentState.progress}
                campaignData={campaignData}
              />
            </div>
          </div>
        </div>

        {/* Bottom Right: Data Viewer & Actions */}
        <div className="bg-gray-50">
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Data</h2>
              <p className="text-sm text-gray-500">Generated outputs & downloads</p>
            </div>
            <div className="flex-1 overflow-auto">
              <DataViewer 
                campaignData={campaignData}
                currentStep={agentState.current_step}
                onDownload={(data) => console.log('Download:', data)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticWorkspace; 