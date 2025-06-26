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
  
  // Default welcome message if no chat messages
  const displayMessages = chatMessages.length > 0 ? chatMessages : [
    {
      type: 'agent',
      content: 'Welcome to Neural! I\'m your CTV Campaign Assistant. Tell me about your campaign requirements, or try one of these examples:',
      timestamp: new Date().toISOString()
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    // Send to agent - the parent will handle adding messages to chat
    onCampaignInput(input);
    setInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    onCampaignInput(`Uploaded file: ${files[0].name}`, files);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
              {message.type === 'agent' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">⚡</span>
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-800 border border-gray-200'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">👤</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xs font-bold">⚡</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-blue-700 ml-2">Neural is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* File Upload */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>Upload Brief</span>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileUpload}
                accept=".txt,.doc,.docx,.pdf"
                disabled={isProcessing}
              />
            </label>
            <span className="text-xs text-gray-500">or type your requirements below</span>
          </div>

          {/* Text Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Plan a $250K awareness campaign for Tide targeting families"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? '⏳' : '📤'}
            </button>
          </div>
        </form>

        {/* Quick Suggestions */}
        {!isProcessing && chatMessages.length === 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Setup a June awareness campaign for Unilever with $250K',
                'Create a custom audience for a P&G household campaign', 
                'Help me choose CTV bid prices for a pharma brand avoiding Tier 1 cities'
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="text-xs bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-blue-700 transition-colors border border-blue-200"
                  disabled={isProcessing}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface; 