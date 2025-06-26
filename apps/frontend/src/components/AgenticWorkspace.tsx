import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './ChatInterface';
import CampaignSteps from './CampaignSteps';

interface AgentState {
  current_step: string;
  progress: number;
  last_reasoning: string;
  next_action: string;
  avatar_state: 'idle' | 'thinking' | 'analyzing' | 'generating' | 'complete';
}

interface CampaignData {
  step: string;
  data: any;
  confidence: number;
  timestamp: string;
}

interface ChatMessage {
  type: 'user' | 'agent';
  content: string;
  timestamp: string;
}

const AgenticWorkspace: React.FC = () => {
  const [agentState, setAgentState] = useState<AgentState>({
    current_step: 'campaign_data',
    progress: 0,
    last_reasoning: '',
    next_action: '',
    avatar_state: 'idle'
  });

  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignInput, setCampaignInput] = useState('');
  
  // Refs to prevent race conditions
  const processingRef = useRef(false);
  const lastRequestRef = useRef<number>(0);

  // Reset workflow on mount
  useEffect(() => {
    resetWorkflow();
  }, []);

  const resetWorkflow = async () => {
    try {
      await fetch('http://localhost:8000/agent/reset', { method: 'POST' });
      setAgentState({
        current_step: 'campaign_data',
        progress: 0,
        last_reasoning: '',
        next_action: '',
        avatar_state: 'idle'
      });
      setCampaignData([]);
      setChatMessages([]);
      setError(null);
      setCampaignInput('');
      processingRef.current = false;
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  const validateStateTransition = (currentStep: string, nextStep: string): boolean => {
    const validTransitions: { [key: string]: string } = {
      'campaign_data': 'advertiser_preferences',
      'advertiser_preferences': 'audience_generation', 
      'audience_generation': 'campaign_generation',
      'campaign_generation': 'complete'
    };
    
    return validTransitions[currentStep] === nextStep;
  };

  const advanceToNextStep = async () => {
    // Prevent concurrent requests
    if (processingRef.current || isProcessing) {
      console.log('Already processing, skipping request');
      return;
    }

    // Debouncing - prevent rapid clicks
    const now = Date.now();
    if (now - lastRequestRef.current < 2000) {
      console.log('Request too recent, debouncing');
      return;
    }
    lastRequestRef.current = now;

    // Validate current state
    if (agentState.progress >= 100) {
      console.log('Workflow already complete');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setError(null);
    setAgentState(prev => ({ ...prev, avatar_state: 'analyzing' }));
    
    try {
      console.log(`🔄 Advancing from step: ${agentState.current_step} (${agentState.progress}%)`);
      
      // Step 1: Advance to next step with retry logic
      let advanceResult;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const advanceResponse = await fetch('http://localhost:8000/agent/advance', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!advanceResponse.ok) {
            throw new Error(`Advance failed: ${advanceResponse.status}`);
          }
          
          advanceResult = await advanceResponse.json();
          console.log(`✅ Advanced to step: ${advanceResult.current_step}`);
          break;
        } catch (err) {
          retryCount++;
          console.warn(`Advance attempt ${retryCount} failed:`, err);
          if (retryCount >= maxRetries) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        }
      }

      // Validate state transition
      if (!validateStateTransition(agentState.current_step, advanceResult.current_step)) {
        throw new Error(`Invalid state transition: ${agentState.current_step} → ${advanceResult.current_step}`);
      }
      
      // Step 2: Process the new step with retry logic
      let stepResult;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          const stepResponse = await fetch('http://localhost:8000/agent/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              input: `Process ${advanceResult.current_step} step`, 
              files: [] 
            })
          });
          
          if (!stepResponse.ok) {
            throw new Error(`Process failed: ${stepResponse.status}`);
          }
          
          stepResult = await stepResponse.json();
          console.log(`✅ Processed step: ${stepResult.step} with confidence: ${stepResult.confidence}%`);
          break;
        } catch (err) {
          retryCount++;
          console.warn(`Process attempt ${retryCount} failed:`, err);
          if (retryCount >= maxRetries) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        }
      }

      // Step 3: Update UI state atomically
      const newProgress = getProgressForStep(stepResult.step);
      
      // Add agent reasoning to chat
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: stepResult.reasoning,
        timestamp: new Date().toISOString()
      }]);
      
      // Update campaign data - prevent duplicates
      setCampaignData(prev => {
        const existingIndex = prev.findIndex(item => item.step === stepResult.step);
        const newData = {
          step: stepResult.step,
          data: stepResult.data,
          confidence: stepResult.confidence,
          timestamp: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newData;
          return updated;
        } else {
          return [...prev, newData];
        }
      });
      
      // Update agent state
      setAgentState(prev => ({ 
        ...prev, 
        current_step: stepResult.step,
        progress: newProgress,
        last_reasoning: stepResult.reasoning,
        next_action: stepResult.action,
        avatar_state: stepResult.step === 'campaign_generation' ? 'complete' : 'thinking'
      }));

      console.log(`🎉 Step completed: ${stepResult.step} (${newProgress}%)`);
      
    } catch (error) {
      console.error('❌ Step advancement error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Step advancement failed: ${errorMessage}`);
      
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again or reset the workflow.`,
        timestamp: new Date().toISOString()
      }]);
      
      setAgentState(prev => ({ ...prev, avatar_state: 'idle' }));
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  const getProgressForStep = (step: string): number => {
    const progressMap: { [key: string]: number } = {
      'campaign_data': 25,
      'advertiser_preferences': 50,
      'audience_generation': 75,
      'campaign_generation': 100
    };
    return progressMap[step] || 0;
  };

  const handleCampaignInput = async (input: string, files?: FileList) => {
    // Prevent concurrent requests
    if (processingRef.current || isProcessing) {
      console.log('Already processing, skipping campaign input');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setError(null);
    
    // Reset workflow state for new campaign
    await resetWorkflow();
    
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
    
    try {
      console.log('🚀 Starting new campaign workflow');
      
      // Process initial step with retry logic
      let result;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const response = await fetch('http://localhost:8000/agent/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input, files: files ? Array.from(files) : [] })
          });
          
          if (!response.ok) {
            throw new Error(`Process failed: ${response.status}`);
          }
          
          result = await response.json();
          console.log(`✅ Initial processing complete: ${result.step}`);
          break;
        } catch (err) {
          retryCount++;
          console.warn(`Initial process attempt ${retryCount} failed:`, err);
          if (retryCount >= maxRetries) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
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
      console.error('❌ Campaign processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Campaign processing failed: ${errorMessage}`);
      
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: `Sorry, I encountered an error processing your request: ${errorMessage}. Please try again.`,
        timestamp: new Date().toISOString()
      }]);
      
      setAgentState(prev => ({ ...prev, avatar_state: 'idle' }));
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
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

  const canAdvanceToNextStep = () => {
    return campaignData.length > 0 && 
           agentState.progress < 100 && 
           !isProcessing && 
           !processingRef.current &&
           agentState.avatar_state !== 'complete';
  };

  const downloadMediaPlan = () => {
    const currentStepData = campaignData.find(data => data.step === 'campaign_generation');
    
    if (!currentStepData?.data?.line_items) {
      console.warn('No line items data available for download');
      return;
    }

    const lineItems = currentStepData.data.line_items;
    
    // Create CSV headers
    const headers = ['Line Item Name', 'Budget', 'CPM', 'Audience', 'Status', 'Estimated Impressions', 'Flight Dates'];
    
    // Convert line items to CSV rows
    const csvRows = [
      headers.join(','),
      ...lineItems.map((item: any) => [
        `"${item.name || 'N/A'}"`,
        item.budget || 0,
        item.cpm || 0,
        `"${item.audience || 'N/A'}"`,
        `"${item.status || 'Ready'}"`,
        item.estimated_impressions || Math.round((item.budget || 0) / (item.cpm || 1) * 1000),
        `"${item.flight_dates || 'TBD'}"`
      ].join(','))
    ];
    
    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `neural-ads-media-plan-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      
      // Append file content to campaign input
      const fileInfo = `\n\n--- Uploaded File: ${file.name} ---\n${fileContent}`;
      setCampaignInput(prev => prev + fileInfo);
      
      // Add notification
      setChatMessages(prev => [...prev, {
        type: 'agent',
        content: `✅ File "${file.name}" uploaded successfully. The content has been added to your campaign requirements.`,
        timestamp: new Date().toISOString()
      }]);
      
    } catch (error) {
      console.error('File upload error:', error);
      setError('Failed to read file. Please ensure it\'s a valid text file.');
    }
    
    // Clear the file input
    event.target.value = '';
  };

  const renderStepContent = () => {
    const currentStepData = campaignData.find(data => data.step === agentState.current_step);
    
    switch (agentState.current_step) {
      case 'campaign_data':
        if (campaignData.length === 0) {
          return (
            <div className="py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Campaign Data Analysis</h3>
              
              {/* Campaign Requirements Input */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Campaign Requirements
                  </label>
                  <textarea
                    placeholder="Paste your campaign brief here or describe your requirements:&#10;&#10;• Advertiser: [Brand Name]&#10;• Budget: $[Amount]&#10;• Objective: [Brand Awareness/Performance/etc.]&#10;• Target Audience: [Demographics]&#10;• Timeline: [Start - End Date]&#10;• Additional Notes: [Any specific requirements]"
                    className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={campaignInput}
                    onChange={(e) => setCampaignInput(e.target.value)}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Upload Campaign Brief Button */}
                    <label className="neural-btn neural-btn-secondary cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <div className="flex items-center space-x-2">
                        <span>📎</span>
                        <span>Upload Brief</span>
                      </div>
                    </label>
                    
                    {/* Clear Button */}
                    <button
                      onClick={() => setCampaignInput('')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {/* Analyze Button */}
                  <button
                    onClick={() => campaignInput.trim() && handleCampaignInput(campaignInput)}
                    disabled={!campaignInput.trim() || isProcessing}
                    className={`neural-btn ${campaignInput.trim() && !isProcessing ? 'neural-btn-primary' : 'neural-btn-secondary'} px-6 py-2`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🚀</span>
                      <span>Analyze Campaign</span>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Helper Text */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Provide as much detail as possible for better AI analysis. You can paste campaign briefs, 
                  upload documents, or use the chat interface for interactive campaign planning.
                </p>
              </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-orange-600 mr-3">✓</div>
                  <div>
                    <p className="text-sm font-medium text-orange-900">Campaign structure ready for deployment</p>
                    <p className="text-sm text-orange-700">Confidence: {currentStepData?.confidence}%</p>
                  </div>
                </div>
                <button
                  onClick={downloadMediaPlan}
                  className="neural-btn neural-btn-primary px-6 py-2 text-sm"
                  title="Download Media Plan as CSV"
                >
                  <div className="flex items-center space-x-2">
                    <span>📥</span>
                    <span>Download CSV</span>
                  </div>
                </button>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="neural-card-header border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Neural Ads</h1>
                <p className="text-blue-100">AI-Powered CTV Campaign Intelligence</p>
              </div>
            </div>
            
            {/* Client Logo Placeholder */}
            <div className="flex items-center space-x-3 ml-8">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">🏢</span>
              </div>
              <span className="text-blue-100 text-sm">Client Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Agent Status Avatar */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
              agentState.avatar_state === 'thinking' ? 'bg-blue-500 bg-opacity-20 animate-pulse' :
              agentState.avatar_state === 'generating' ? 'bg-green-500 bg-opacity-20' :
              agentState.avatar_state === 'analyzing' ? 'bg-yellow-500 bg-opacity-20' :
              'bg-purple-500 bg-opacity-20'
            }`}>
              <span className="text-3xl">
                {agentState.avatar_state === 'thinking' ? '🤔' :
                 agentState.avatar_state === 'generating' ? '⚡' :
                 agentState.avatar_state === 'analyzing' ? '🔍' : '✅'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">Neural Agent</p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  agentState.avatar_state === 'complete' ? 'bg-green-400' : 'bg-blue-400'
                } ${agentState.avatar_state !== 'complete' ? 'animate-pulse' : ''}`}></div>
                <span className="text-blue-100 text-sm capitalize">{agentState.avatar_state}</span>
              </div>
            </div>
            
            {/* Reset Button */}
            <button
              onClick={resetWorkflow}
              disabled={isProcessing}
              className="neural-btn neural-btn-outline text-white border-white hover:bg-white hover:text-blue-600 px-4 py-2 text-sm"
              title="Reset Workflow"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-xs text-red-600 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Three Panel Layout */}
      <div className="flex h-[calc(100vh-88px)]">
        
        {/* Left Sidebar - Chat Assistant */}
        <div className="w-80 flex flex-col">
          <ChatInterface 
            onCampaignInput={handleCampaignInput}
            isProcessing={isProcessing}
            agentState={agentState}
            chatMessages={chatMessages}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 space-y-6">
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
            
            {/* Current Step Content */}
            <div className="neural-card neural-fade-in">
              <div className="neural-card-header">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    agentState.current_step === 'campaign_data' ? 'bg-blue-500 text-white' :
                    agentState.current_step === 'advertiser_preferences' ? 'bg-purple-500 text-white' :
                    agentState.current_step === 'audience_generation' ? 'bg-green-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {steps.find(s => s.id === agentState.current_step)?.icon || '📊'}
                  </div>
                  <div>
                    <h4 className="neural-heading-3">
                      {steps.find(s => s.id === agentState.current_step)?.title || 'Campaign Parameters'}
                    </h4>
                    <p className="neural-text-muted">
                      {agentState.current_step === 'campaign_data' ? 'Define campaign basics' :
                       agentState.current_step === 'advertiser_preferences' ? 'Review performance data' :
                       agentState.current_step === 'audience_generation' ? 'Analyze target audience' :
                       'Generate media strategy'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="neural-card-content">
                {renderStepContent()}
                
                {/* Continue to Next Step Button */}
                {(campaignData.length > 0 && agentState.current_step !== 'campaign_generation' && !isProcessing) && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-gray-600">
                          Step {Math.ceil(agentState.progress / 25) || 1} of 4 • {agentState.progress}% Complete
                        </div>
                      </div>
                      <button
                        onClick={advanceToNextStep}
                        disabled={isProcessing || processingRef.current}
                        className={`neural-btn ${isProcessing ? 'neural-btn-secondary' : 'neural-btn-primary'} px-8 py-3`}
                        style={{ position: 'relative', zIndex: 999 }}
                      >
                        {isProcessing ? (
                          <div className="flex items-center space-x-2">
                            <div className="neural-spinner w-4 h-4"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>
                              {agentState.current_step === 'campaign_data' ? 'Continue to Historical Data' :
                               agentState.current_step === 'advertiser_preferences' ? 'Continue to Audience Analysis' :
                               agentState.current_step === 'audience_generation' ? 'Continue to Media Plan' :
                               'Continue to Next Step'}
                            </span>
                            <span className="text-lg">→</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Tracker Panel */}
            <div className="neural-card neural-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="neural-card-header">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📈</span>
                  </div>
                  <div>
                    <h4 className="neural-heading-3">Progress Tracker</h4>
                    <p className="neural-text-muted">Monitor workflow completion</p>
                  </div>
                </div>
              </div>
              
              <div className="neural-card-content">
                <CampaignSteps 
                  currentStep={agentState.current_step}
                  progress={agentState.progress}
                  campaignData={campaignData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticWorkspace; 