# CTV Campaign Management System

A comprehensive Connected TV advertising system built with Turborepo, featuring an AI-powered campaign management interface with FastAPI backend and React frontend.

## 🎯 System Overview

This system is designed to help streaming services run targeted campaigns directly in the ad server. The system learns from log files and generates campaigns optimized for programmatic buying.

### Key Components

1. **Encoder**: Learns advertising preferences from log data
2. **UI/UX**: React-based co-pilot interface for campaign building  
3. **COT Reasoning Agent**: Performs all campaign planning steps
4. **Multi-agent Backend**: Communicates with users and handles campaign setup

## 🏗️ Architecture

```
ctv-mvp/
├── apps/
│   ├── backend/           # FastAPI Python service
│   │   ├── main.py        # API entry point
│   │   ├── models/        # Pydantic data models
│   │   ├── parser/        # Campaign brief parsing
│   │   ├── prefs/         # Advertiser preferences
│   │   ├── audience/      # Audience segments
│   │   ├── planner/       # Campaign planning logic
│   │   ├── exporter/      # CSV export functionality
│   │   └── data/          # Mock data and exports
│   └── frontend/          # React TypeScript app
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── api.ts        # API client
│       │   └── App.tsx       # Main application
│       └── package.json
├── packages/              # Shared packages
├── turbo.json            # Turborepo configuration
└── package.json          # Root configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Python 3.8+
- npm

### Installation & Setup

1. **Clone and navigate to the project:**
   ```bash
   cd ctv-mvp
   ```

2. **Install root dependencies:**
   ```bash
   # Note: If you encounter npm cache issues, run:
   # sudo chown -R $(whoami) ~/.npm
   npm install
   ```

3. **Set up the backend:**
   ```bash
   cd apps/backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install fastapi uvicorn pydantic aiofiles openai
   ```

4. **Install frontend dependencies:**
   ```bash
   cd apps/frontend
   npm install
   ```

### Running the Application

#### Option 1: Full System (Recommended)
From the root directory:
```bash
npm run dev
```
This runs both frontend and backend in parallel.

#### Option 2: Individual Services

**Backend only:**
```bash
cd apps/backend
npm run dev:backend
# or directly: source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0
```

**Frontend only:**
```bash
cd apps/frontend
npm run dev:frontend
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🎮 How to Use

### 1. Campaign Specification
- Upload a campaign brief file (TXT, DOC, PDF) or paste text directly
- The AI parser extracts campaign details (name, budget, dates, objectives)
- Review and edit the parsed information

### 2. Advertiser Preferences  
- Select targeting preferences:
  - **Networks**: Hulu, Roku, Tubi
  - **Genres**: Sports, Comedy, Drama
  - **Devices**: SmartTV, Mobile
  - **Locations**: Los Angeles, New York, Chicago

### 3. Audience Segments
- Choose from available audience segments
- View segment size, geography, and demographic tags
- See total reach calculation

### 4. Campaign Plan Generation
- AI generates optimized line items
- Review budget allocation across networks and segments
- Download detailed CSV export for ad server import

## 📊 API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/parse` | POST | Parse campaign brief from file |
| `/preferences/{adv_id}` | GET | Get advertiser preferences |
| `/segments` | GET | List available audience segments |
| `/plan` | POST | Generate campaign plan |
| `/health` | GET | Health check |

### Sample API Usage

```bash
# Health check
curl http://localhost:8000/health

# Get segments
curl http://localhost:8000/segments

# Get preferences
curl http://localhost:8000/preferences/default
```

## 🧩 Key Features

### Frontend (React + TypeScript)
- **Modern UI**: Built with Tailwind CSS for responsive design
- **Chat Interface**: AI assistant with conversation history
- **Chain of Thought**: Visual process indicator
- **File Upload**: Drag-and-drop campaign brief parsing
- **Interactive Forms**: Dynamic preference selection
- **Data Tables**: Sortable segment and line item views
- **CSV Export**: One-click campaign plan download

### Backend (FastAPI + Python)
- **RESTful API**: OpenAPI/Swagger documentation
- **File Processing**: Multi-format campaign brief parsing
- **Data Models**: Pydantic validation and serialization
- **Mock Data**: Sample preferences and segments
- **CSV Generation**: Automated export functionality
- **CORS Support**: Cross-origin requests enabled

### Development Experience
- **Turborepo**: Monorepo with optimized builds
- **Hot Reload**: Both frontend and backend support
- **TypeScript**: Full type safety across the stack
- **Modular Architecture**: Easily extensible components

## 🔧 Configuration

### Backend Configuration
- **API Base URL**: Configurable in `frontend/src/api.ts`
- **Data Sources**: Mock data in `backend/data/`
- **Export Location**: `backend/data/exports/`

### Frontend Configuration
- **Proxy Settings**: Vite proxy in `frontend/vite.config.ts`
- **Tailwind**: Custom theme in `frontend/tailwind.config.js`

## 📁 Data Models

### CampaignSpec
```typescript
{
  name: string;
  total_budget: number;
  start_date: string;
  end_date: string;
  objective: string;
  description?: string;
}
```

### LineItem
```typescript
{
  id: string;
  name: string;
  budget: number;
  networks: string[];
  genres: string[];
  devices: string[];
  locations: string[];
  segment_ids: number[];
}
```

## 🚦 Development Roadmap

### Phase 1: ✅ MVP Complete
- [x] Turborepo setup
- [x] Backend API with FastAPI
- [x] Frontend with React + TypeScript
- [x] Basic campaign workflow
- [x] Mock data integration

### Phase 2: 🔄 Enhanced Features
- [ ] OpenAI integration for campaign parsing
- [ ] Real database integration
- [ ] Advanced campaign optimization
- [ ] User authentication
- [ ] Campaign analytics

### Phase 3: 🔮 Advanced Capabilities
- [ ] Multi-tenant support
- [ ] Real-time bidding integration
- [ ] Machine learning recommendations
- [ ] A/B testing framework

## 🐛 Troubleshooting

### Common Issues

1. **npm permission errors:**
   ```bash
   sudo chown -R $(whoami) ~/.npm
   npm cache clean --force
   ```

2. **Python virtual environment:**
   ```bash
   cd apps/backend
   rm -rf .venv
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt  # if available
   ```

3. **Port conflicts:**
   - Frontend: Change port in `frontend/vite.config.ts`
   - Backend: Change port in `backend/main.py`

### Development Tips
- Use `npm run build` to build all packages
- Use `npm run lint` to check code quality
- Backend logs available at http://localhost:8000/docs

## 🤝 Contributing

This is a proof-of-concept system. For production use:

1. Replace mock data with real databases
2. Implement proper authentication
3. Add comprehensive error handling
4. Set up monitoring and logging
5. Configure production deployment

## 📄 License

This project is for demonstration purposes. Modify as needed for your use case.

---

**Built with ❤️ using Turborepo, FastAPI, and React**
