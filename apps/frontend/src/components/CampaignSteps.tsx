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
      title: 'Campaign Parameters',
      description: 'Define campaign basics',
      color: 'blue'
    },
    {
      id: 'advertiser_preferences',
      title: 'Historical Data',
      description: 'Analyze viewing patterns',
      color: 'purple'
    },
    {
      id: 'audience_generation',
      title: 'Audience Analysis',
      description: 'Analyze target audience',
      color: 'green'
    },
    {
      id: 'campaign_generation',
      title: 'Media Plan',
      description: 'Generate media strategy',
      color: 'orange'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (currentStep === stepId) return 'active';
    
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex || progress >= 100) return 'completed';
    return 'pending';
  };

  const getStepData = (stepId: string) => {
    return campaignData.find(data => data.step === stepId);
  };

  const getConfidenceClass = (confidence: number) => {
    if (confidence > 0.8) return 'high';
    if (confidence > 0.6) return 'medium';
    return 'low';
  };

  return (
    <div className="neural-progress-container neural-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="neural-heading-2">Ad Planning Progress</h3>
          <p className="neural-text-muted mt-1">Track your campaign setup</p>
        </div>
        <div className="text-right">
          <div className="neural-status-badge info">
            {progress < 100 ? `${Math.ceil((progress / 25))} Step${progress > 25 ? 's' : ''} Running` : 'Complete'}
          </div>
          <div className="neural-text-muted mt-1">{progress.toFixed(0)}% Complete</div>
        </div>
      </div>

      {/* Modern Progress Timeline */}
      <div className="neural-progress-timeline mb-8">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const stepData = getStepData(step.id);
          
          return (
            <div key={step.id} className={`neural-progress-step ${status}`}>
              <div className={`neural-step-circle ${status}`}>
                {status === 'completed' ? '✓' : index + 1}
              </div>
              <div className="mt-3 text-center">
                <div className="text-xs font-medium text-gray-600 mb-1">Step {index + 1}</div>
                <div className="text-sm font-medium text-gray-900">{step.title.split(' ')[0]}</div>
                {status === 'active' && (
                  <div className="mt-1">
                    <div className="w-8 h-1 bg-blue-200 rounded-full mx-auto">
                      <div className="h-1 bg-blue-600 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const stepData = getStepData(step.id);
          
          return (
            <div key={step.id} className={`neural-card neural-fade-in ${
              status === 'active' ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
            }`} style={{animationDelay: `${index * 0.1}s`}}>
              
              {/* Card Header */}
              <div className={`neural-card-header ${
                status === 'active' ? 'bg-gradient-to-r from-blue-50 to-blue-100' :
                status === 'completed' ? 'bg-gradient-to-r from-green-50 to-green-100' :
                'bg-gradient-to-r from-gray-50 to-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="neural-heading-3">{step.title}</h4>
                      <p className="neural-text-muted">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'active' ? 'bg-blue-500 animate-pulse' :
                    status === 'completed' ? 'bg-green-500' :
                    'bg-gray-300'
                  }`}></div>
                </div>
              </div>

              {/* Card Content */}
              <div className="neural-card-content">
                {status === 'pending' && (
                  <div className="text-center py-4">
                    <div className="neural-text-muted">Waiting for previous steps...</div>
                  </div>
                )}

                {status === 'active' && !stepData && (
                  <div className="text-center py-4">
                    <div className="neural-spinner w-6 h-6 mx-auto mb-2"></div>
                    <div className="neural-text-muted">Processing...</div>
                  </div>
                )}

                {stepData && (
                  <div className="space-y-3">
                    {/* Confidence Indicator */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Confidence</span>
                      <span className={`neural-status-badge ${
                        stepData.confidence > 0.8 ? 'success' :
                        stepData.confidence > 0.6 ? 'warning' : 'info'
                      }`}>
                        {(stepData.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="neural-confidence-bar">
                      <div 
                        className={`neural-confidence-fill ${getConfidenceClass(stepData.confidence)}`}
                        style={{ width: `${stepData.confidence * 100}%` }}
                      ></div>
                    </div>

                    {/* Key Data Points */}
                    {stepData.data && (
                      <div className="space-y-2">
                        {Object.entries(stepData.data).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-sm">
                            <span className="neural-text-muted capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-medium text-gray-900 truncate ml-2 max-w-24">
                              {typeof value === 'object' ? 
                                (Array.isArray(value) ? `${value.length} items` : 'Object') :
                                String(value).length > 20 ? String(value).slice(0, 20) + '...' : String(value)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="neural-text-muted text-xs">
                        {new Date(stepData.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            className={`neural-btn ${progress >= 100 ? 'neural-btn-success' : 'neural-btn-primary'} w-full`}
            disabled={progress < 25}
          >
            {progress < 25 ? 'Waiting to start...' :
             progress < 100 ? `Processing Step ${Math.ceil(progress / 25)}...` : 
             'Campaign Ready'}
          </button>
          
          {progress >= 25 && (
            <button className="neural-btn-secondary w-full">
              <span className="flex items-center justify-center">
                Modify Parameters
              </span>
            </button>
          )}
        </div>

        {/* Progress Summary */}
        {progress > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="neural-text-body">
                {progress >= 100 ? 'All steps completed successfully!' :
                 `Step ${Math.ceil(progress / 25)} of 4 in progress...`}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-blue-700">{progress.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignSteps; 