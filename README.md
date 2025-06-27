# Neural Ads - Connected TV Advertising Platform 🚀

> **Latest Update**: Enhanced Campaign Input Interface with File Upload & CSV Export

A sophisticated agentic platform for Connected TV advertising campaign creation, featuring AI-powered workflow automation, intelligent audience targeting, and comprehensive media planning.

## 🎯 Key Features

### **🤖 Multi-Agent Architecture**
- **COT Reasoning Agent**: Transparent campaign decision-making with step-by-step reasoning
- **Campaign Parser Agent**: Intelligent extraction of advertiser requirements  
- **Preference Agent**: Historical data analysis and advertiser behavior insights
- **Audience Agent**: Advanced demographic and psychographic targeting
- **Line Item Generator**: Automated media plan creation with 50-100 line items

### **📊 Enhanced Campaign Input**
- **Direct Text Input**: Large text area with structured campaign requirements template
- **File Upload Support**: PDF, DOC, DOCX, and TXT campaign brief uploads
- **Template Guidance**: Pre-formatted structure for advertiser, budget, objectives, timeline
- **Multiple Input Methods**: Text area, file upload, or interactive chat interface

### **⚡ Robust Workflow Management**
- **4-Step Process**: Campaign Data (25%) → Historical Analysis (50%) → Audience Generation (75%) → Media Plan (100%)
- **Real-time Progress**: Visual step indicators and percentage completion
- **Error Handling**: Retry logic, debouncing, and state validation
- **Step Advancement**: Smart buttons for workflow progression

### **📈 Professional UI/UX**
- **Neural Design System**: Custom CSS with gradient headers and modern styling
- **2-Column Layout**: Main workspace with progress tracking panel
- **Agent Avatars**: Visual states (🤔 thinking, ⚡ generating, 🔍 analyzing, ✅ complete)
- **Real-time Updates**: Hot Module Replacement for development

### **📋 Data Export & Management**
- **CSV Download**: Export complete media plans with line items, budgets, CPM, audiences
- **Advertiser Database**: Pre-loaded with 5 major advertisers (McDonald's, Unilever, Tide, Geico, Samsung)
- **Campaign Archive**: Historical campaign data and performance insights

## 🏗️ Architecture

### **Frontend** (React + Vite + TypeScript)
```
apps/frontend/src/
├── components/
│   ├── AgenticWorkspace.tsx    # Main 2x2 grid layout
│   ├── ChatInterface.tsx       # Co-pilot chat system  
│   ├── CampaignSteps.tsx      # Progress visualization
│   └── ...
├── api.ts                     # Backend communication
└── index.css                 # Neural design system
```

### **Backend** (FastAPI + Python)
```
apps/backend/
├── agents/                    # AI agent implementations
│   ├── multi_agent_orchestrator.py
│   ├── campaign_parser.py
│   ├── advertiser_preferences.py
│   ├── audience_generation.py
│   └── lineitem_generator.py
├── models/                    # Pydantic data models
├── data/                      # Advertiser database & segments
└── main.py                    # FastAPI application
```

### **Shared Packages**
```
packages/
├── ui/                        # Shared React components
├── typescript-config/         # Shared TypeScript configs
└── eslint-config/            # Code quality standards
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- Python 3.11+
- OpenAI API Key

### **Installation**

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd neural-ads-platform
   ```

2. **Install Dependencies**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Setup Python virtual environment
   cd apps/backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   # Create .env file in apps/backend/
   cat > apps/backend/.env << EOF
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4
   ENVIRONMENT=development
   DEBUG=true
   
   # Agent Settings
   MAX_RETRIES=3
   TIMEOUT_SECONDS=30
   CONFIDENCE_THRESHOLD=0.8
   EOF
   ```

4. **Start Services**
   ```bash
   # Terminal 1: Backend (FastAPI)
   cd apps/backend
   source .venv/bin/activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2: Frontend (React+Vite)
   cd apps/frontend  
   npm run dev
   ```

5. **Access Application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs

## 📖 Usage

### **Campaign Creation Workflow**

1. **Campaign Requirements**: 
   - Type directly in the text area or upload a campaign brief
   - Use the structured template for advertiser, budget, objectives, timeline
   - Click "Analyze Campaign" to start the AI workflow

2. **Step Progression**:
   - **25%**: Campaign data parsing and validation
   - **50%**: Historical advertiser preference analysis  
   - **75%**: Audience generation and targeting
   - **100%**: Media plan creation with line items

3. **Export Results**:
   - Download complete media plan as CSV
   - Includes line item names, budgets, CPM, audiences, flight dates
   - Ready for trafficking in ad servers

### **Example Campaign Input**
```
• Advertiser: McDonald's
• Budget: $500,000
• Objective: Brand Awareness for New Menu Launch
• Target Audience: Adults 25-54, Fast Food Consumers
• Timeline: Q1 2024 (January - March)
• Additional Notes: Focus on premium dayparts, avoid competitor content
```

## 🛠️ Development

### **Code Quality**
- **TypeScript**: Strict type checking across frontend
- **ESLint**: Consistent code style and error prevention  
- **Prettier**: Automated code formatting
- **Hot Reload**: Instant updates during development

### **Testing Strategy**
- Component testing with React Testing Library
- API testing with FastAPI TestClient
- E2E testing with Playwright
- Type safety with TypeScript strict mode

### **Deployment**
- **Frontend**: Vercel/Netlify deployment ready
- **Backend**: Docker containerization included
- **Database**: SQLite for development, PostgreSQL for production
- **Monitoring**: Structured logging and health checks

## 📊 Features Deep Dive

### **AI Agent Capabilities**
- **Natural Language Processing**: Parse campaign briefs in various formats
- **Historical Analysis**: Learn from past campaign performance
- **Audience Intelligence**: Advanced demographic and behavioral targeting
- **Budget Optimization**: Intelligent allocation across dayparts and channels
- **Real-time Reasoning**: Transparent decision-making process

### **Data Management**
- **Advertiser Profiles**: Rich behavioral and preference data
- **Campaign History**: Performance analytics and optimization insights
- **Audience Segments**: Pre-built and custom audience definitions
- **Media Inventory**: CTV channel and daypart availability

## 🔧 Technical Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11, Pydantic, OpenAI API
- **Build System**: Turbo (monorepo), npm workspaces
- **Development**: Hot Module Replacement, Auto-reload
- **Deployment**: Docker, Docker Compose

## 📈 Roadmap

- [ ] Advanced audience lookalike modeling
- [ ] Real-time bid optimization
- [ ] Cross-platform campaign sync
- [ ] Performance analytics dashboard  
- [ ] A/B testing framework
- [ ] Brand safety verification

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚨 Support

For questions, issues, or feature requests:
- Create an issue in this repository
- Contact: [Your contact information]

---

**Neural Ads** - Transforming Connected TV Advertising with AI 🚀
