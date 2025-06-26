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
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'agent', content: string, timestamp: string}>>([]);

  // Auto-advance through steps with delays
  const autoAdvanceWorkflow = async (initialInput: string) => {
    setIsAutoAdvancing(true);
    
    // Add user message to chat
    setChatMessages(prev => [...prev, {
      type: 'user',
      content: initialInput,
      timestamp: new Date().toISOString()
    }]);
    
    try {
      // Step 1: Campaign Data
      setAgentState(prev => ({ 
        ...prev, 
        current_step: 'campaign_data',
        progress: 25,
        avatar_state: 'analyzing'
      }));
      
      const step1Response = await fetch('http://localhost:8000/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: initialInput, files: [] })
      });
      const step1Result = await step1Response.json();
      
      // Add agent reasoning to chat
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: step1Result.reasoning,
        timestamp: new Date().toISOString()
      }]);
      
      setCampaignData([{
        step: 'campaign_data',
        data: step1Result.data,
        confidence: step1Result.confidence,
        timestamp: new Date().toISOString()
      }]);
      
      setAgentState(prev => ({ 
        ...prev, 
        last_reasoning: step1Result.reasoning,
        next_action: step1Result.action,
        avatar_state: 'thinking'
      }));
      
      // Wait 3 seconds before advancing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 2: Historical Data
      setAgentState(prev => ({ 
        ...prev, 
        current_step: 'advertiser_preferences',
        progress: 50,
        avatar_state: 'analyzing'
      }));
      
      await fetch('http://localhost:8000/agent/advance', { method: 'POST' });
      
      const step2Response = await fetch('http://localhost:8000/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: "Continue with historical analysis", files: [] })
      });
      const step2Result = await step2Response.json();
      
      // Add agent reasoning to chat
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: step2Result.reasoning,
        timestamp: new Date().toISOString()
      }]);
      
      setCampaignData(prev => [...prev, {
        step: 'advertiser_preferences',
        data: step2Result.data,
        confidence: step2Result.confidence,
        timestamp: new Date().toISOString()
      }]);
      
      setAgentState(prev => ({ 
        ...prev, 
        last_reasoning: step2Result.reasoning,
        next_action: step2Result.action,
        avatar_state: 'thinking'
      }));
      
      // Wait 3 seconds before advancing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Audience Analysis
      setAgentState(prev => ({ 
        ...prev, 
        current_step: 'audience_generation',
        progress: 75,
        avatar_state: 'analyzing'
      }));
      
      await fetch('http://localhost:8000/agent/advance', { method: 'POST' });
      
      const step3Response = await fetch('http://localhost:8000/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: "Generate ACR audience segments", files: [] })
      });
      const step3Result = await step3Response.json();
      
      // Add agent reasoning to chat
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: step3Result.reasoning,
        timestamp: new Date().toISOString()
      }]);
      
      setCampaignData(prev => [...prev, {
        step: 'audience_generation',
        data: step3Result.data,
        confidence: step3Result.confidence,
        timestamp: new Date().toISOString()
      }]);
      
      setAgentState(prev => ({ 
        ...prev, 
        last_reasoning: step3Result.reasoning,
        next_action: step3Result.action,
        avatar_state: 'thinking'
      }));
      
      // Wait 3 seconds before final step
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 4: Line Item Generation
      setAgentState(prev => ({ 
        ...prev, 
        current_step: 'campaign_generation',
        progress: 100,
        avatar_state: 'generating'
      }));
      
      await fetch('http://localhost:8000/agent/advance', { method: 'POST' });
      
      const step4Response = await fetch('http://localhost:8000/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: "Build executable line items", files: [] })
      });
      const step4Result = await step4Response.json();
      
      // Add agent reasoning to chat
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: step4Result.reasoning,
        timestamp: new Date().toISOString()
      }]);
      
      setCampaignData(prev => [...prev, {
        step: 'campaign_generation',
        data: step4Result.data,
        confidence: step4Result.confidence,
        timestamp: new Date().toISOString()
      }]);
      
      setAgentState(prev => ({ 
        ...prev, 
        last_reasoning: step4Result.reasoning,
        next_action: step4Result.action,
        avatar_state: 'complete'
      }));
      
    } catch (error) {
      console.error('Auto-advance error:', error);
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsAutoAdvancing(false);
      setIsProcessing(false);
    }
  };

  const handleCampaignInput = async (input: string, files?: FileList) => {
    setIsProcessing(true);
    setAgentState(prev => ({ ...prev, avatar_state: 'analyzing' }));
    
    // Reset campaign data for new workflow
    setCampaignData([]);
    setChatMessages([]);
    
    // Start auto-advance workflow
    await autoAdvanceWorkflow(input);
  };

  const steps = [
    { id: 'campaign_data', title: 'Campaign Parameters', icon: '📊', color: 'blue' },
    { id: 'advertiser_preferences', title: 'Historical Data', icon: '📈', color: 'purple' },
    { id: 'audience_generation', title: 'Audience Analysis', icon: '🎯', color: 'green' },
    { id: 'campaign_generation', title: 'Media Plan', icon: '⚡', color: 'orange' }
  ];

  const getStepStatus = (stepId: string) => {
    // If we're in complete state or have 100% progress, mark all previous steps as completed
    if (agentState.avatar_state === 'complete' || agentState.progress >= 100) {
      const stepIndex = steps.findIndex(s => s.id === stepId);
      const currentIndex = steps.findIndex(s => s.id === agentState.current_step);
      if (stepIndex <= currentIndex) return 'completed';
    }
    
    if (agentState.current_step === stepId) {
      // If agent is complete and this is the current step, mark as completed
      if (agentState.avatar_state === 'complete') return 'completed';
      return 'active';
    }
    
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === agentState.current_step);
    return stepIndex < currentIndex ? 'completed' : 'pending';
  };

  const getCurrentStepData = () => {
    return campaignData.find(data => data.step === agentState.current_step);
  };

  const isWorkflowComplete = () => {
    return agentState.avatar_state === 'complete' || agentState.progress >= 100;
  };

  const isStepDataLoaded = (stepId: string) => {
    const stepHasData = campaignData.some(data => data.step === stepId);
    return stepHasData || isWorkflowComplete();
  };

  const getStepColors = (color: string, isProcessing: boolean, status: string) => {
    const colorMap = {
      blue: {
        bg: isProcessing ? 'bg-blue-500 ring-2 ring-blue-300' : 
            status === 'active' ? 'bg-blue-500' : 
            status === 'completed' ? 'bg-blue-500' : 'bg-gray-200',
        text: isProcessing ? 'text-blue-600 animate-pulse' :
              status === 'active' ? 'text-blue-600' :
              status === 'completed' ? 'text-green-600' : 'text-gray-400'
      },
      purple: {
        bg: isProcessing ? 'bg-purple-500 ring-2 ring-purple-300' : 
            status === 'active' ? 'bg-purple-500' : 
            status === 'completed' ? 'bg-purple-500' : 'bg-gray-200',
        text: isProcessing ? 'text-purple-600 animate-pulse' :
              status === 'active' ? 'text-blue-600' :
              status === 'completed' ? 'text-green-600' : 'text-gray-400'
      },
      green: {
        bg: isProcessing ? 'bg-green-500 ring-2 ring-green-300' : 
            status === 'active' ? 'bg-green-500' : 
            status === 'completed' ? 'bg-green-500' : 'bg-gray-200',
        text: isProcessing ? 'text-green-600 animate-pulse' :
              status === 'active' ? 'text-blue-600' :
              status === 'completed' ? 'text-green-600' : 'text-gray-400'
      },
      orange: {
        bg: isProcessing ? 'bg-orange-500 ring-2 ring-orange-300' : 
            status === 'active' ? 'bg-orange-500' : 
            status === 'completed' ? 'bg-orange-500' : 'bg-gray-200',
        text: isProcessing ? 'text-orange-600 animate-pulse' :
              status === 'active' ? 'text-blue-600' :
              status === 'completed' ? 'text-green-600' : 'text-gray-400'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const renderStepContent = () => {
    // Show content for the current step, or if workflow is complete, show the most advanced step with data
    let stepToDisplay = agentState.current_step;
    let stepData = campaignData.find(data => data.step === stepToDisplay);
    
    // If workflow is complete, find the highest step with data to display
    if (isWorkflowComplete()) {
      const stepsWithData = steps.reverse().find(step => 
        campaignData.some(data => data.step === step.id)
      );
      if (stepsWithData) {
        stepToDisplay = stepsWithData.id;
        stepData = campaignData.find(data => data.step === stepToDisplay);
      }
      steps.reverse(); // restore original order
    }
    
    switch (stepToDisplay) {
      case 'campaign_data':
        const campaignStepData = campaignData.find(data => data.step === 'campaign_data');
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Campaign Parameters</h3>
                  <p className="text-blue-700 text-sm">Define campaign basics</p>
                </div>
                {(campaignStepData || isWorkflowComplete()) && (
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      ✓ Identified
                    </span>
                  </div>
                )}
              </div>
              
              {campaignStepData?.data ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser</label>
                    <input 
                      type="text" 
                      value={campaignStepData.data.advertiser || ''} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <input 
                      type="text" 
                      value={campaignStepData.data.budget ? `$${campaignStepData.data.budget?.toLocaleString()}` : ''} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                    <input 
                      type="text" 
                      value={campaignStepData.data.objective || ''} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                    <input 
                      type="text" 
                      value={campaignStepData.data.timeline || ''} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                      readOnly
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm">Parsing campaign parameters...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'advertiser_preferences':
        const preferencesData = campaignData.find(data => data.step === 'advertiser_preferences');
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📈</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Historical Data</h3>
                  <p className="text-purple-700 text-sm">Advertiser behavioral insights</p>
                </div>
                {(preferencesData || isWorkflowComplete()) && (
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      ✓ Retrieved
                    </span>
                  </div>
                )}
              </div>
              
              {preferencesData?.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Content Preferences</h4>
                      <div className="space-y-1">
                        {preferencesData.data.content_preferences?.map((pref: string, index: number) => (
                          <span key={index} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs mr-1">
                            {pref}
                          </span>
                        )) || <span className="text-gray-500 text-sm">Analyzing...</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Geographic Focus</h4>
                      <div className="space-y-1">
                        {preferencesData.data.geo_preferences?.map((geo: string, index: number) => (
                          <span key={index} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs mr-1">
                            {geo}
                          </span>
                        )) || <span className="text-gray-500 text-sm">Analyzing...</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Device Targeting</h4>
                      <div className="space-y-1">
                        {preferencesData.data.device_preferences?.map((device: string, index: number) => (
                          <span key={index} className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs mr-1">
                            {device}
                          </span>
                        )) || <span className="text-gray-500 text-sm">Analyzing...</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm">Analyzing historical data...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'audience_generation':
        const audienceData = campaignData.find(data => data.step === 'audience_generation');
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Audience Analysis</h3>
                  <p className="text-green-700 text-sm">ACR segments & pricing insights</p>
                </div>
                {(audienceData || isWorkflowComplete()) && (
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      ✓ Synthesized
                    </span>
                  </div>
                )}
              </div>
              
              {audienceData?.data ? (
                <div className="space-y-4">
                  {audienceData.data.acr_segments && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">ACR Audience Segments</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {audienceData.data.acr_segments.map((segment: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2 p-3 bg-white border border-green-200 rounded-lg">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-sm">👥</span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{segment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {audienceData.data.cpm_floors && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">CPM Floor Pricing</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(audienceData.data.cpm_floors).map(([device, cpm]) => (
                          <div key={device} className="bg-white p-3 border border-green-200 rounded-lg">
                            <div className="text-sm font-medium text-gray-700">{device}</div>
                            <div className="text-lg font-bold text-green-600">${cpm} CPM</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm">Generating audience segments...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'campaign_generation':
        const lineItemsData = campaignData.find(data => data.step === 'campaign_generation');
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Media Plan</h3>
                  <p className="text-orange-700 text-sm">Executable line items ready for ad server</p>
                </div>
                {(lineItemsData || isWorkflowComplete()) && (
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      ✓ Constructed
                    </span>
                  </div>
                )}
              </div>
              
              {lineItemsData?.data?.line_items ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Generated Line Items</h4>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                      📥 Download CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto bg-white rounded-lg border border-orange-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-orange-100">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-orange-900">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-orange-900">Content</th>
                          <th className="text-left py-3 px-4 font-medium text-orange-900">Geography</th>
                          <th className="text-left py-3 px-4 font-medium text-orange-900">Device</th>
                          <th className="text-left py-3 px-4 font-medium text-orange-900">Audience</th>
                          <th className="text-left py-3 px-4 font-medium text-orange-900">Bid CPM</th>
                          <th className="text-left py-3 px-4 font-medium text-orange-900">Daily Cap</th>
                          <th className="text-left py-3 px-4 font-medium text-orange-900">Freq Cap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lineItemsData.data.line_items.slice(0, 6).map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                            <td className="py-3 px-4 text-gray-700">{item.content}</td>
                            <td className="py-3 px-4 text-gray-700">{item.geo}</td>
                            <td className="py-3 px-4 text-gray-700">{item.device}</td>
                            <td className="py-3 px-4 text-gray-700">{item.audience}</td>
                            <td className="py-3 px-4 text-gray-700 font-medium">{item.bid_cpm}</td>
                            <td className="py-3 px-4 text-gray-700">{item.daily_cap}</td>
                            <td className="py-3 px-4 text-gray-700">{item.frequency_cap}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {lineItemsData.data.line_items.length > 6 && (
                    <p className="text-sm text-gray-500 text-center">
                      Showing 6 of {lineItemsData.data.line_items.length} line items. Download CSV for complete list.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm">Building line items...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-lg font-medium mb-2">Neural is ready to help</p>
              <p className="text-sm">Start a conversation to begin your campaign planning</p>
            </div>
          </div>
        );
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
              isProcessing={isProcessing || isAutoAdvancing}
              agentState={agentState}
              chatMessages={chatMessages}
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 flex flex-col">
          
          {/* Top Right - Progress Tracker */}
          <div className="h-32 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Ad Planning Progress</h2>
              <div className="flex items-center space-x-2">
                {isAutoAdvancing && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-sm">Auto-advancing...</span>
                  </div>
                )}
                <span className="text-sm text-gray-500">
                  {isWorkflowComplete() ? '✅ Complete' : `${Math.round(agentState.progress / 25)} Step Running`}
                </span>
              </div>
            </div>
            
            {/* 4-Step Progress Bar */}
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const isCurrentlyProcessing = agentState.current_step === step.id && isAutoAdvancing && !isWorkflowComplete();
                const colors = getStepColors(step.color, isCurrentlyProcessing, status);
                
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                      status === 'pending' ? 'text-gray-400' : 'text-white'
                    } ${colors.bg}`}>
                      {isCurrentlyProcessing ? '⏳' :
                       status === 'completed' ? '✓' : 
                       status === 'active' ? step.icon : step.icon}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium ${colors.text}`}>
                        {isCurrentlyProcessing ? 'Processing...' : 
                         status === 'completed' ? 'Complete' :
                         `Step ${index + 1}`}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticWorkspace; 