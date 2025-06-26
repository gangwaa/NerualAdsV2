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
  avatar_state: 'idle' | 'thinking' | 'analyzing' | 'generating' | 'complete';
}

const AgenticWorkspace: React.FC = () => {
  const [agentState, setAgentState] = useState<AgentState>({
    current_step: 'campaign_data',
    progress: 0,
    last_reasoning: '',
    next_action: '',
    avatar_state: 'thinking'
  });

  const [campaignData, setCampaignData] = useState<Array<{step: string, data: any, confidence: number, timestamp: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'agent', content: string, timestamp: string}>>([]);

  // Manual step advancement instead of auto-advance
  const advanceToNextStep = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setAgentState(prev => ({ ...prev, avatar_state: 'analyzing' }));
    
    try {
      // Advance to next step
      const advanceResponse = await fetch('http://localhost:8000/agent/advance', { method: 'POST' });
      
      // Process the current step
      const stepResponse = await fetch('http://localhost:8000/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: `Continue with ${agentState.current_step} analysis`, files: [] })
      });
      const stepResult = await stepResponse.json();
      
      // Add agent reasoning to chat
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: stepResult.reasoning,
        timestamp: new Date().toISOString()
      }]);
      
      // Update campaign data
      setCampaignData(prev => [...prev, {
        step: stepResult.step,
        data: stepResult.data,
        confidence: stepResult.confidence,
        timestamp: new Date().toISOString()
      }]);
      
      // Update agent state
      setAgentState(prev => ({ 
        ...prev, 
        current_step: stepResult.step,
        progress: Math.min(prev.progress + 25, 100),
        last_reasoning: stepResult.reasoning,
        next_action: stepResult.action,
        avatar_state: stepResult.step === 'campaign_generation' ? 'complete' : 'thinking'
      }));
      
    } catch (error) {
      console.error('Step advancement error:', error);
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: 'Sorry, I encountered an error advancing to the next step. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCampaignInput = async (input: string, files?: FileList) => {
    setIsProcessing(true);
    setAgentState(prev => ({ 
      ...prev, 
      current_step: 'campaign_data',
      progress: 25,
      avatar_state: 'analyzing'
    }));
    
    // Add user message to chat
    setChatMessages([{
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }]);
    
    // Reset campaign data for new workflow
    setCampaignData([]);
    
    try {
      // Process initial step
      const response = await fetch('http://localhost:8000/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, files: files ? Array.from(files) : [] })
      });
      const result = await response.json();
      
      // Add agent reasoning to chat
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: result.reasoning,
        timestamp: new Date().toISOString()
      }]);
      
      // Add parsed data
      setCampaignData([{
        step: result.step,
        data: result.data,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      }]);
      
      setAgentState(prev => ({ 
        ...prev, 
        last_reasoning: result.reasoning,
        next_action: result.action,
        avatar_state: 'thinking'
      }));
      
    } catch (error) {
      console.error('Campaign processing error:', error);
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      }]);
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

  const renderStepContent = () => {
    const currentStepData = campaignData.find(data => data.step === agentState.current_step);
    
    switch (agentState.current_step) {
      case 'campaign_data':
        if (campaignData.length === 0) {
          return (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Data Analysis</h3>
              <p className="text-gray-500 mb-6">Start by entering your campaign requirements in the chat.</p>
            </div>
          );
        }
        
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Campaign Parameters Identified</h3>
            {currentStepData?.data && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                      {currentStepData.data.advertiser || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Budget</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                      {currentStepData.data.budget ? `$${currentStepData.data.budget.toLocaleString()}` : 'Not specified'}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Objective</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                      {currentStepData.data.objective || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                      {currentStepData.data.timeline || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="text-blue-600 mr-3">✓</div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Campaign parameters successfully parsed</p>
                  <p className="text-sm text-blue-700">Confidence: {currentStepData?.confidence}%</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'advertiser_preferences':
        if (!currentStepData) {
          return (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Historical Data</h3>
              <p className="text-gray-500">Retrieving advertiser buying patterns and preferences...</p>
            </div>
          );
        }
        
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Historical Patterns Retrieved</h3>
            {currentStepData.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Preferred Targeting</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      {currentStepData.data.preferred_targeting?.map((item: string, index: number) => (
                        <li key={index}>• {item}</li>
                      )) || <li>No data available</li>}
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Average CPM Range</h4>
                    <div className="text-lg font-semibold text-purple-900">
                      ${currentStepData.data.cpm_range?.min || 0} - ${currentStepData.data.cpm_range?.max || 0}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Historical Performance</h4>
                    <div className="text-sm text-purple-800">
                      <div>CTR: {currentStepData.data.performance?.ctr || 'N/A'}%</div>
                      <div>VTR: {currentStepData.data.performance?.vtr || 'N/A'}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <div className="text-purple-600 mr-3">✓</div>
                <div>
                  <p className="text-sm font-medium text-purple-900">Historical patterns successfully analyzed</p>
                  <p className="text-sm text-purple-700">Confidence: {currentStepData?.confidence}%</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'audience_generation':
        if (!currentStepData) {
          return (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generating ACR Segments</h3>
              <p className="text-gray-500">Building audience definitions with pricing insights...</p>
            </div>
          );
        }
        
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Audience Definition Synthesized</h3>
            {currentStepData.data?.segments && (
              <div className="space-y-4">
                {currentStepData.data.segments.map((segment: any, index: number) => (
                  <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-green-900">{segment.name}</h4>
                      <div className="text-sm text-green-700">
                        Scale: {segment.scale?.toLocaleString() || 'N/A'} HH
                      </div>
                    </div>
                    <p className="text-sm text-green-800 mb-2">{segment.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">CPM: ${segment.cpm || 'N/A'}</span>
                      <span className="text-green-700">Est. Reach: {segment.reach || 'N/A'}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">✓</div>
                <div>
                  <p className="text-sm font-medium text-green-900">Pricing insights gathered</p>
                  <p className="text-sm text-green-700">Confidence: {currentStepData?.confidence}%</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'campaign_generation':
        if (!currentStepData) {
          return (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Building Line Items</h3>
              <p className="text-gray-500">Constructing executable campaign structure...</p>
            </div>
          );
        }
        
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Line Items Successfully Constructed</h3>
            {currentStepData.data?.line_items && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Line Item Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CPM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Audience
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentStepData.data.line_items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item.budget?.toLocaleString() || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item.cpm || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.audience}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Ready
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <div className="text-orange-600 mr-3">✓</div>
                <div>
                  <p className="text-sm font-medium text-orange-900">Campaign structure ready for deployment</p>
                  <p className="text-sm text-orange-700">Confidence: {currentStepData?.confidence}%</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Neural Ad Planning Assistant</h3>
            <p className="text-gray-500 mb-6">I'll help you create targeted CTV campaigns with data-driven insights.</p>
            <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                Start by describing your campaign requirements in the chat panel.
              </p>
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
              isProcessing={isProcessing}
              agentState={agentState}
              chatMessages={chatMessages}
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 flex flex-col">
          
          {/* Top Right - Progress Tracker */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Progress</h3>
              <div className="text-sm text-gray-500">
                {agentState.progress}% Complete
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-200
                    ${agentState.current_step === step.id ? 
                      `${step.color} border-current text-white` : 
                      isWorkflowComplete() ? 'bg-green-100 border-green-500 text-green-700' :
                      index < steps.findIndex(s => s.id === agentState.current_step) ?
                      'bg-green-100 border-green-500 text-green-700' :
                      'bg-gray-100 border-gray-300 text-gray-500'
                    }
                  `}>
                    {isWorkflowComplete() || index < steps.findIndex(s => s.id === agentState.current_step) ? 
                      '✓' : index + 1
                    }
                  </div>
                  <div className="ml-2 text-sm">
                    <div className={`font-medium ${
                      agentState.current_step === step.id ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {agentState.current_step === step.id && !isWorkflowComplete() ? 
                        'Current Step' : 
                        isWorkflowComplete() ? '✅ Complete' :
                        index < steps.findIndex(s => s.id === agentState.current_step) ? 
                        'Complete' : 'Pending'
                      }
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-4 h-0.5 w-8 ${
                      index < steps.findIndex(s => s.id === agentState.current_step) ? 
                      'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Next Step Button */}
            {!isWorkflowComplete() && campaignData.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={advanceToNextStep}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Next Step
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Main Content - Dynamic based on current step */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticWorkspace; 