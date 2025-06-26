from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from parser.module import parse_campaign
from prefs.module import get_preferences
from audience.module import list_segments
from planner.module import build_plan
from exporter.module import export_csv
from models.campaign import CampaignSpec, CampaignPlan
from agents.multi_agent_orchestrator import MultiAgentOrchestrator
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

# Initialize Multi-Agent Orchestrator
orchestrator = MultiAgentOrchestrator()

# Mount static files for exports
exports_dir = os.path.join(os.path.dirname(__file__), "data", "exports")
os.makedirs(exports_dir, exist_ok=True)
app.mount("/exports", StaticFiles(directory=exports_dir), name="exports")

class AgentRequest(BaseModel):
    input: str
    files: list = []

@app.get("/")
async def root():
    return {"message": "Neural CTV Campaign Management API", "status": "running", "system": "multi-agent"}

@app.post("/agent/process")
async def process_agent_request(request: AgentRequest):
    """Process campaign request through Multi-Agent Orchestrator"""
    try:
        # Process through orchestrator
        result = await orchestrator.process_step(request.input)
        
        # Get current status
        status = orchestrator.get_current_status()
        
        return {
            "step": result.step.value,
            "reasoning": result.reasoning,
            "action": result.action,
            "data": result.data,
            "confidence": result.confidence,
            "progress": status["progress"],
            "current_step": status["current_step"],
            "avatar_state": status["avatar_state"],
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent processing error: {str(e)}")

@app.get("/agent/status")
async def get_agent_status():
    """Get current multi-agent orchestrator status"""
    try:
        status = orchestrator.get_current_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status error: {str(e)}")

@app.post("/agent/advance")
async def advance_agent_step():
    """Advance orchestrator to next step"""
    try:
        next_step = orchestrator.advance_step()
        status = orchestrator.get_current_status()
        return {
            "current_step": next_step.value,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advance error: {str(e)}")

@app.post("/agent/reset")
async def reset_workflow():
    """Reset workflow to initial state"""
    try:
        orchestrator.reset_workflow()
        status = orchestrator.get_current_status()
        return {
            "message": "Workflow reset successfully",
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset error: {str(e)}")

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
    return {"status": "healthy", "service": "neural-backend", "system": "multi-agent"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 