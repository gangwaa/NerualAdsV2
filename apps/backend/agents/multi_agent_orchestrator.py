"""
Multi-Agent Orchestrator - Coordinates Specialized Campaign Agents
Neural Ads - Connected TV Advertising Platform
"""

import asyncio
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

from .campaign_parser import CampaignParserAgent, CampaignParameters
from .advertiser_preferences import AdvertiserPreferencesAgent, AdvertiserPreferences
from .audience_generation import AudienceGenerationAgent, AudienceAnalysis
from .lineitem_generator import LineItemGeneratorAgent, CampaignStructure

class WorkflowStep(Enum):
    CAMPAIGN_DATA = "campaign_data"
    ADVERTISER_PREFERENCES = "advertiser_preferences" 
    AUDIENCE_GENERATION = "audience_generation"
    CAMPAIGN_GENERATION = "campaign_generation"
    COMPLETE = "complete"

@dataclass
class WorkflowResult:
    step: WorkflowStep
    reasoning: str
    action: str
    data: Dict[str, Any]
    confidence: float

class MultiAgentOrchestrator:
    """
    Orchestrates specialized agents for CTV campaign planning
    
    Workflow:
    1. CampaignParserAgent - Parse campaign requirements
    2. AdvertiserPreferencesAgent - Analyze historical patterns  
    3. AudienceGenerationAgent - Create ACR segments
    4. LineItemGeneratorAgent - Build executable campaigns
    
    Each agent receives structured output from the previous agent,
    ensuring clean data flow and proper step progression.
    """
    
    def __init__(self):
        self.current_step = WorkflowStep.CAMPAIGN_DATA
        self.campaign_context = {}
        
        # Initialize specialized agents
        self.campaign_parser = CampaignParserAgent()
        self.preferences_agent = AdvertiserPreferencesAgent()
        self.audience_agent = AudienceGenerationAgent()
        self.lineitem_agent = LineItemGeneratorAgent()
        
        # Store results from each step
        self.campaign_parameters: Optional[CampaignParameters] = None
        self.advertiser_preferences: Optional[AdvertiserPreferences] = None
        self.audience_analysis: Optional[AudienceAnalysis] = None
        self.campaign_structure: Optional[CampaignStructure] = None
    
    async def process_step(self, user_input: str = "") -> WorkflowResult:
        """Process the current workflow step"""
        
        if self.current_step == WorkflowStep.CAMPAIGN_DATA:
            return await self._process_campaign_parsing(user_input)
        elif self.current_step == WorkflowStep.ADVERTISER_PREFERENCES:
            return await self._process_advertiser_analysis()
        elif self.current_step == WorkflowStep.AUDIENCE_GENERATION:
            return await self._process_audience_generation()
        elif self.current_step == WorkflowStep.CAMPAIGN_GENERATION:
            return await self._process_line_item_generation()
        else:
            return WorkflowResult(
                step=self.current_step,
                reasoning="Workflow complete",
                action="Campaign ready for deployment",
                data={"status": "complete"},
                confidence=1.0
            )
    
    async def _process_campaign_parsing(self, user_input: str) -> WorkflowResult:
        """Step 1: Parse campaign requirements"""
        
        self.campaign_parameters = await self.campaign_parser.parse_campaign_brief(user_input)
        reasoning = await self.campaign_parser.generate_reasoning(self.campaign_parameters)
        
        # Convert to dict for frontend
        data = {
            "advertiser": self.campaign_parameters.advertiser,
            "budget": self.campaign_parameters.budget,
            "objective": self.campaign_parameters.objective,
            "timeline": self.campaign_parameters.timeline,
            "additional_requirements": self.campaign_parameters.additional_requirements or {}
        }
        
        return WorkflowResult(
            step=WorkflowStep.CAMPAIGN_DATA,
            reasoning=reasoning,
            action="Proceed to historical pattern analysis",
            data=data,
            confidence=self.campaign_parameters.confidence
        )
    
    async def _process_advertiser_analysis(self) -> WorkflowResult:
        """Step 2: Analyze advertiser historical patterns"""
        
        if not self.campaign_parameters:
            raise ValueError("Campaign parameters required for advertiser analysis")
        
        self.advertiser_preferences = await self.preferences_agent.analyze_advertiser_patterns(
            self.campaign_parameters.advertiser,
            self.campaign_parameters.objective
        )
        
        reasoning = await self.preferences_agent.generate_reasoning(self.advertiser_preferences)
        
        # Convert to dict for frontend
        data = {
            "advertiser": self.advertiser_preferences.advertiser,
            "preferred_targeting": self.advertiser_preferences.preferred_targeting,
            "content_preferences": self.advertiser_preferences.content_preferences,
            "geo_preferences": self.advertiser_preferences.geo_preferences,
            "device_preferences": self.advertiser_preferences.device_preferences,
            "cpm_range": self.advertiser_preferences.cpm_range,
            "performance": self.advertiser_preferences.performance,
            "insights": self.advertiser_preferences.insights
        }
        
        return WorkflowResult(
            step=WorkflowStep.ADVERTISER_PREFERENCES,
            reasoning=reasoning,
            action="Generate ACR audience segments",
            data=data,
            confidence=self.advertiser_preferences.confidence
        )
    
    async def _process_audience_generation(self) -> WorkflowResult:
        """Step 3: Generate ACR audience segments"""
        
        if not self.campaign_parameters or not self.advertiser_preferences:
            raise ValueError("Campaign parameters and preferences required for audience generation")
        
        # Convert preferences to dict for audience agent
        preferences_dict = {
            "content_preferences": self.advertiser_preferences.content_preferences,
            "geo_preferences": self.advertiser_preferences.geo_preferences,
            "device_preferences": self.advertiser_preferences.device_preferences
        }
        
        self.audience_analysis = await self.audience_agent.generate_audience_segments(
            self.campaign_parameters.advertiser,
            preferences_dict,
            self.campaign_parameters.budget
        )
        
        reasoning = await self.audience_agent.generate_reasoning(
            self.audience_analysis,
            self.campaign_parameters.advertiser
        )
        
        # Convert segments to dict for frontend
        segments_data = []
        for segment in self.audience_analysis.segments:
            segments_data.append({
                "name": segment.name,
                "description": segment.description,
                "scale": segment.scale,
                "cpm": segment.cpm,
                "reach": segment.reach,
                "targeting_criteria": segment.targeting_criteria
            })
        
        data = {
            "segments": segments_data,
            "pricing_insights": self.audience_analysis.pricing_insights,
            "yield_signals": self.audience_analysis.yield_signals,
            "recommendations": self.audience_analysis.recommendations
        }
        
        return WorkflowResult(
            step=WorkflowStep.AUDIENCE_GENERATION,
            reasoning=reasoning,
            action="Build executable line items",
            data=data,
            confidence=self.audience_analysis.confidence
        )
    
    async def _process_line_item_generation(self) -> WorkflowResult:
        """Step 4: Generate executable line items"""
        
        if not all([self.campaign_parameters, self.advertiser_preferences, self.audience_analysis]):
            raise ValueError("All previous steps required for line item generation")
        
        # Convert preferences to dict
        preferences_dict = {
            "content_preferences": self.advertiser_preferences.content_preferences,
            "geo_preferences": self.advertiser_preferences.geo_preferences,
            "device_preferences": self.advertiser_preferences.device_preferences
        }
        
        # Convert audience segments to dict list
        audience_segments = []
        for segment in self.audience_analysis.segments:
            audience_segments.append({
                "name": segment.name,
                "cpm": segment.cpm,
                "scale": segment.scale,
                "reach": segment.reach
            })
        
        self.campaign_structure = await self.lineitem_agent.generate_line_items(
            self.campaign_parameters.advertiser,
            self.campaign_parameters.budget,
            preferences_dict,
            audience_segments
        )
        
        reasoning = await self.lineitem_agent.generate_reasoning(
            self.campaign_structure,
            self.campaign_parameters.advertiser
        )
        
        # Convert line items to dict for frontend
        line_items_data = []
        for item in self.campaign_structure.line_items:
            line_items_data.append({
                "name": item.name,
                "content": item.content,
                "geo": item.geo,
                "device": item.device,
                "audience": item.audience,
                "cpm": item.bid_cpm,
                "budget": item.budget,
                "daily_cap": item.daily_cap,
                "frequency_cap": item.frequency_cap,
                "targeting_criteria": item.targeting_criteria
            })
        
        data = {
            "line_items": line_items_data,
            "total_budget": self.campaign_structure.total_budget,
            "total_line_items": self.campaign_structure.total_line_items,
            "budget_allocation": self.campaign_structure.budget_allocation,
            "deployment_notes": self.campaign_structure.deployment_notes
        }
        
        return WorkflowResult(
            step=WorkflowStep.CAMPAIGN_GENERATION,
            reasoning=reasoning,
            action="Campaign structure ready for deployment",
            data=data,
            confidence=self.campaign_structure.confidence
        )
    
    def advance_step(self) -> WorkflowStep:
        """Advance to the next workflow step"""
        
        step_progression = {
            WorkflowStep.CAMPAIGN_DATA: WorkflowStep.ADVERTISER_PREFERENCES,
            WorkflowStep.ADVERTISER_PREFERENCES: WorkflowStep.AUDIENCE_GENERATION,
            WorkflowStep.AUDIENCE_GENERATION: WorkflowStep.CAMPAIGN_GENERATION,
            WorkflowStep.CAMPAIGN_GENERATION: WorkflowStep.COMPLETE
        }
        
        if self.current_step in step_progression:
            self.current_step = step_progression[self.current_step]
        
        return self.current_step
    
    def get_current_status(self) -> Dict[str, Any]:
        """Get current orchestrator status"""
        
        step_mapping = {
            WorkflowStep.CAMPAIGN_DATA: "campaign_data",
            WorkflowStep.ADVERTISER_PREFERENCES: "advertiser_preferences",
            WorkflowStep.AUDIENCE_GENERATION: "audience_generation", 
            WorkflowStep.CAMPAIGN_GENERATION: "campaign_generation",
            WorkflowStep.COMPLETE: "complete"
        }
        
        progress_mapping = {
            WorkflowStep.CAMPAIGN_DATA: 25,
            WorkflowStep.ADVERTISER_PREFERENCES: 50,
            WorkflowStep.AUDIENCE_GENERATION: 75,
            WorkflowStep.CAMPAIGN_GENERATION: 100,
            WorkflowStep.COMPLETE: 100
        }
        
        return {
            "current_step": step_mapping[self.current_step],
            "progress": progress_mapping[self.current_step],
            "avatar_state": "complete" if self.current_step == WorkflowStep.COMPLETE else "thinking"
        }
    
    def reset_workflow(self):
        """Reset workflow to initial state"""
        self.current_step = WorkflowStep.CAMPAIGN_DATA
        self.campaign_context = {}
        self.campaign_parameters = None
        self.advertiser_preferences = None
        self.audience_analysis = None
        self.campaign_structure = None 