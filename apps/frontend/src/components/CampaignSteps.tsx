import React from 'react';

interface CampaignData {
  step: string;
  data: any;
  confidence: number;
  timestamp: string;
}

interface CampaignStepsProps {
  currentStep: string;
  progress: number;
  campaignData: CampaignData[];
}

const CampaignSteps: React.FC<CampaignStepsProps> = ({ 
  currentStep, 
  progress, 
  campaignData 
}) => {
  const steps = [
    {
      id: 'campaign_data',
      title: 'Campaign Data',
      description: 'Parse requirements and extract parameters',
      icon: '📋'
    },
    {
      id: 'advertiser_preferences',
      title: 'Behavioral Intelligence',
      description: 'Access advertiser preferences from encoder',
      icon: '🧠'
    },
    {
      id: 'audience_generation',
      title: 'Audience Segments',
      description: 'Generate optimal targeting segments',
      icon: '🎯'
    },
    {
      id: 'campaign_generation',
      title: 'Line Items',
      description: 'Create 50-100 optimized line items',
      icon: '⚡'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (currentStep === stepId) return 'active';
    
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    return 'pending';
  };

  const getStepData = (stepId: string) => {
    return campaignData.find(data => data.step === stepId);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-900">Campaign Setup Progress</h3>
          <span className="text-sm text-gray-500">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Step Flow */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const stepData = getStepData(step.id);
          
          return (
            <div key={step.id} className="relative">
              {/* Step Container */}
              <div className={`border rounded-lg p-4 transition-all duration-300 ${
                status === 'active' ? 'border-blue-500 bg-blue-50' :
                status === 'completed' ? 'border-green-500 bg-green-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                
                {/* Step Header */}
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    status === 'active' ? 'bg-blue-500 text-white animate-pulse' :
                    status === 'completed' ? 'bg-green-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {status === 'completed' ? '✅' : 
                     status === 'active' ? '🔄' : step.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      status === 'active' ? 'text-blue-900' :
                      status === 'completed' ? 'text-green-900' :
                      'text-gray-600'
                    }`}>
                      {step.title}
                    </h4>
                    <p className={`text-sm ${
                      status === 'active' ? 'text-blue-700' :
                      status === 'completed' ? 'text-green-700' :
                      'text-gray-500'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={`w-4 h-4 rounded-full ${
                    status === 'active' ? 'bg-blue-500 animate-pulse' :
                    status === 'completed' ? 'bg-green-500' :
                    'bg-gray-300'
                  }`}></div>
                </div>

                {/* Step Data */}
                {stepData && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Generated Data</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        stepData.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                        stepData.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(stepData.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {/* Display key data points */}
                      {stepData.data && Object.keys(stepData.data).slice(0, 3).map(key => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="capitalize">{key.replace('_', ' ')}:</span>
                          <span className="font-medium">
                            {typeof stepData.data[key] === 'object' 
                              ? JSON.stringify(stepData.data[key]).slice(0, 30) + '...'
                              : stepData.data[key]
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className={`absolute left-6 top-16 w-0.5 h-4 ${
                  getStepStatus(steps[index + 1].id) !== 'pending' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={progress < 100}
          >
            {progress < 100 ? `Processing... ${progress.toFixed(0)}%` : 'Generate Campaign Plan'}
          </button>
          
          {progress >= 25 && (
            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Review & Edit Parameters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignSteps; 