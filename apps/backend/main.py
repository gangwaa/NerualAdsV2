from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from parser.module import parse_campaign
from prefs.module import get_preferences
from audience.module import list_segments
from planner.module import build_plan
from exporter.module import export_csv
from models.campaign import CampaignSpec, CampaignPlan
from agents.cot_agent import COTReasoningAgent
from pydantic import BaseModel
import os

# Create FastAPI app
app = FastAPI(title="CTV Campaign Management API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize COT Agent
cot_agent = COTReasoningAgent()

# Mount static files for exports
exports_dir = os.path.join(os.path.dirname(__file__), "data", "exports")
os.makedirs(exports_dir, exist_ok=True)
app.mount("/exports", StaticFiles(directory=exports_dir), name="exports")

class AgentRequest(BaseModel):
    input: str
    files: list = []

@app.get("/")
async def root():
    return {"message": "CTV Campaign Management API", "status": "running"}

@app.post("/agent/process")
async def process_agent_request(request: AgentRequest):
    """Process campaign request through COT Agent"""
    try:
        # Process through COT agent
        thought = await cot_agent.process_campaign_request(request.input, request.files)
        
        # Get current status
        status = cot_agent.get_current_status()
        
        return {
            "step": thought.step.value,
            "reasoning": thought.reasoning,
            "action": thought.action,
            "data": thought.data,
            "confidence": thought.confidence,
            "progress": status["progress"],
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent processing error: {str(e)}")

@app.get("/agent/status")
async def get_agent_status():
    """Get current agent status"""
    try:
        status = cot_agent.get_current_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status error: {str(e)}")

@app.post("/agent/advance")
async def advance_agent_step():
    """Advance agent to next step"""
    try:
        next_step = await cot_agent.advance_to_next_step()
        status = cot_agent.get_current_status()
        return {
            "current_step": next_step.value,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advance error: {str(e)}")

@app.post("/parse", response_model=CampaignSpec)
async def parse_endpoint(file: UploadFile = File(...)):
    """Parse campaign specification from uploaded text file."""
    try:
        content = await file.read()
        text = content.decode('utf-8')
        campaign_spec = parse_campaign(text)
        return campaign_spec
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

@app.get("/preferences/{adv_id}")
async def prefs_endpoint(adv_id: str):
    """Get advertiser preferences by ID."""
    try:
        preferences = get_preferences(adv_id)
        return preferences
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Preferences not found: {str(e)}")

@app.get("/segments")
async def segments_endpoint():
    """List all available audience segments."""
    try:
        segments = list_segments()
        return {"segments": segments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading segments: {str(e)}")

@app.post("/plan")
async def plan_endpoint(spec: CampaignSpec):
    """Generate campaign plan and export to CSV."""
    try:
        # Build the plan
        plan = build_plan(spec)
        
        # Export to CSV
        csv_url = export_csv(plan)
        
        return {
            "plan": plan.dict(),
            "csvUrl": csv_url,
            "summary": plan.summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating plan: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 