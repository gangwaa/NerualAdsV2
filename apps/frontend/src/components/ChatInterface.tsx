import React, { useState } from 'react';

interface AgentState {
  current_step: string;
  progress: number;
  last_reasoning: string;
  next_action: string;
  avatar_state: 'thinking' | 'generating' | 'analyzing' | 'complete';
}

interface ChatInterfaceProps {
  onCampaignInput: (input: string, files?: FileList) => void;
  isProcessing: boolean;
  agentState: AgentState;
  chatMessages?: Array<{type: 'user' | 'agent', content: string, timestamp: string}>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onCampaignInput, 
  isProcessing, 
  agentState,
  chatMessages = []
}) => {
  const [input, setInput] = useState('');
  
  // Welcome message with better branding
  const displayMessages = chatMessages.length > 0 ? chatMessages : [
    {
      type: 'agent',
      content: 'Hello! I\'m Neural\n\nAI Ad Assistant\n\nI\'ll help you create targeted CTV campaigns with data-driven insights. Start by describing your campaign requirements, or try one of the suggestions below.',
      timestamp: new Date().toISOString()
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    onCampaignInput(input);
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isProcessing) return;
    onCampaignInput(suggestion);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    onCampaignInput(`Uploaded file: ${files[0].name}`, files);
  };

  const suggestions = [
    {
      icon: '📊',
      category: 'CAMPAIGN PLANNING',
      text: 'Plan a $250K awareness campaign for Tide targeting families'
    },
    {
      icon: '💰',
      category: 'MEDIA STRATEGY',
      text: 'Create a $500K conversion campaign for Uniliver focusing on millennials'
    },
    {
      icon: '📱',
      category: 'PRODUCT LAUNCH',
      text: 'Design a $750K brand building campaign for McDonald for new product launch'
    },
    {
      icon: '🏆',
      category: 'CUSTOMER RETENTION',
      text: 'Build a $1M retention campaign for Samsung during holiday season'
    }
  ];

  return (
    <div className="neural-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="neural-sidebar-section">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">⚡</span>
          </div>
          <div>
            <h2 className="neural-sidebar-title mb-0">Chat Assistant</h2>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="neural-text-muted">5 advertisers loaded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {displayMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} neural-fade-in`}
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className={`flex items-start space-x-3 max-w-xs lg:max-w-sm ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'agent' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700'
              }`}>
                <span className="text-white text-xs font-bold">
                  {message.type === 'agent' ? '🤖' : '👤'}
                </span>
              </div>

              {/* Message Bubble */}
              <div className={`neural-chat-message ${message.type} neural-slide-in`}>
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {message.content}
                </div>
                <p className="text-xs opacity-75 mt-2 text-right">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isProcessing && (
          <div className="flex justify-start neural-fade-in">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold animate-pulse">🤖</span>
              </div>
              <div className="neural-card neural-card-content py-3 px-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-blue-700 font-medium">
                    {agentState.avatar_state === 'analyzing' ? 'Analyzing data...' :
                     agentState.avatar_state === 'generating' ? 'Generating insights...' :
                     'Processing...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      {!isProcessing && chatMessages.length === 0 && (
        <div className="px-4 pb-4">
          <div className="neural-card neural-card-content">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-blue-600">✨</span>
              <span className="neural-text-muted text-xs font-semibold uppercase tracking-wide">
                Try these prompts
              </span>
            </div>
            
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                  disabled={isProcessing}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-200">
                      <span className="text-sm">{suggestion.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="neural-status-badge info mb-2 text-xs">
                        {suggestion.category}
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {suggestion.text}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Additional Hint */}
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">💡</span>
                <span className="neural-text-muted text-xs">
                  Mention specific advertisers for historical insights
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="neural-sidebar-section border-t border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Section */}
          <div className="neural-form-group">
            <label className="neural-btn-secondary w-full cursor-pointer flex items-center justify-center space-x-2 group">
              <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="group-hover:text-blue-600 transition-colors">Upload Campaign Brief</span>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileUpload}
                accept=".txt,.doc,.docx,.pdf"
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Text Input Section */}
          <div className="neural-form-group">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="neural-input flex-1 text-sm"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className={`neural-btn ${
                  input.trim() && !isProcessing 
                    ? 'neural-btn-primary' 
                    : 'neural-btn-secondary opacity-50 cursor-not-allowed'
                } px-4`}
              >
                <span className="text-lg">
                  {isProcessing ? '⏳' : '📤'}
                </span>
              </button>
            </div>
          </div>

          {/* Status Indicator */}
          {agentState.avatar_state !== 'thinking' && (
            <div className="neural-status-badge info text-xs flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>
                {agentState.avatar_state === 'analyzing' ? 'Analyzing campaign data' :
                 agentState.avatar_state === 'generating' ? 'Creating recommendations' :
                 agentState.avatar_state === 'complete' ? 'Analysis complete' :
                 'Ready to assist'}
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatInterface; 