import React, { useState, useRef, useEffect } from 'react';

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
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Define displayMessages first so we can use it in useEffect
  const displayMessages = chatMessages.length > 0 ? chatMessages : [
    {
      type: 'agent',
      content: 'Hello! I\'m Neural\n\nAI Ad Assistant\n\nI\'ll help you create targeted CTV campaigns with data-driven insights. Start by describing your campaign requirements, or try one of the suggestions below.',
      timestamp: new Date().toISOString()
    }
  ];

  // Autoscroll functionality for floating chat panel
  useEffect(() => {
    const scrollToBottom = () => {
      const element = chatMessagesRef.current;
      if (element) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight;
        });
      }
    };

    // Scroll when messages change or processing state changes
    scrollToBottom();
    
    // Also scroll after a small delay to catch any delayed renders
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [displayMessages.length, isProcessing]);

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
    <div className="flex flex-col h-full max-h-full">
      {/* Status Indicator */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="neural-text-muted">5 advertisers loaded</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatMessagesRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 max-h-full">
        {displayMessages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-50 border-blue-200 border ml-8' 
                : 'bg-gray-50 border-gray-200 border mr-8'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-purple-500 text-white'
              }`}>
                {message.type === 'user' ? 'U' : 'AI'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {message.type === 'user' ? 'You' : 'Neural Assistant'}
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {message.content}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isProcessing && (
          <div className="p-3 rounded-lg bg-gray-50 border-gray-200 border mr-8">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
                AI
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Neural Assistant
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">
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
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-4">
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

      {/* Input Area - Fixed at bottom */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <form onSubmit={handleSubmit}>
          {/* Enhanced Text Input Section */}
          <div className="flex space-x-3 items-end bg-gray-50 rounded-2xl p-2 border border-gray-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-3 text-sm border-0 rounded-xl bg-transparent focus:outline-none resize-none"
                disabled={isProcessing}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                input.trim() && !isProcessing 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105' 
                  : 'bg-gray-300 cursor-not-allowed text-gray-500'
              }`}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface; 