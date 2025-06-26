"""
COT Reasoning Agent - Primary Intelligence for CTV Campaign Setup
Neural Ads - Connected TV Advertising Platform
"""

import asyncio
import json
import os
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class CampaignStep(Enum):
    PARSING = "campaign_data"
    PREFERENCES = "advertiser_preferences" 
    AUDIENCE = "audience_generation"
    GENERATION = "campaign_generation"
    COMPLETE = "complete"

@dataclass
class AgentThought:
    step: CampaignStep
    reasoning: str
    action: str
    data: Dict[str, Any]
    confidence: float
    next_step: Optional[CampaignStep] = None

class COTReasoningAgent:
    """
    Chain of Thought Reasoning Agent for CTV Campaign Management
    
    This agent orchestrates the entire campaign setup process using OpenAI:
    1. Analyzes campaign requirements with GPT-4
    2. Reasons through optimal configurations
    3. Coordinates other specialized agents
    4. Provides transparent thinking process to UI
    """
    
    def __init__(self):
        self.current_step = CampaignStep.PARSING
        self.campaign_context = {}
        self.thinking_history = []
        self.agents = {}  # Will hold references to specialized agents
        
        # Initialize OpenAI client
        self.client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "your_api_key_here")
        )
        self.model = os.getenv("AGENT_MODEL", "gpt-4o-mini")
        self.temperature = float(os.getenv("AGENT_TEMPERATURE", "0.7"))
        self.max_tokens = int(os.getenv("AGENT_MAX_TOKENS", "2000"))
        
    async def process_campaign_request(self, user_input: str, uploaded_files: List = None) -> AgentThought:
        """
        Main entry point for campaign processing
        Returns agent's reasoning and next actions
        """
        
        # Generate reasoning using OpenAI
        reasoning = await self._generate_reasoning_with_openai(user_input)
        action = await self._determine_action_with_openai(user_input, reasoning)
        data = await self._extract_data_with_openai(user_input)
        
        thought = AgentThought(
            step=self.current_step,
            reasoning=reasoning,
            action=action,
            data=data,
            confidence=0.85
        )
        
        self.thinking_history.append(thought)
        return thought
    
    async def _generate_reasoning_with_openai(self, user_input: str) -> str:
        """Generate chain of thought reasoning using OpenAI based on current step and input"""
        
        step_context = {
            CampaignStep.PARSING: """
            You are analyzing campaign requirements for a Connected TV advertising platform.
            Focus on extracting key campaign parameters like budget, target audience, 
            objectives, timeline, and creative specifications.
            """,
            CampaignStep.PREFERENCES: """
            You are accessing advertiser behavioral data to understand historical preferences
            for network affinities, genre preferences, audience segments, and performance patterns.
            """,
            CampaignStep.AUDIENCE: """
            You are generating optimal audience segments by combining campaign objectives
            with advertiser preferences for precision targeting.
            """,
            CampaignStep.GENERATION: """
            You are creating campaign line items for ad server execution, including
            budget distribution, dayparting, creative rotation, and optimization settings.
            """
        }
        
        system_prompt = f"""
        You are a CTV Campaign Intelligence Agent. {step_context.get(self.current_step, "")}
        
        Provide clear, step-by-step reasoning about what you're analyzing and why.
        Use emojis to make your reasoning engaging and easy to follow.
        Be specific about the data you're working with and the insights you're generating.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Campaign input: {user_input}"}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            # Fallback to original reasoning if OpenAI fails
            return self._generate_fallback_reasoning(user_input)
    
    async def _determine_action_with_openai(self, user_input: str, reasoning: str) -> str:
        """Determine next action using OpenAI"""
        
        system_prompt = f"""
        Based on the campaign analysis and current step ({self.current_step.value}),
        determine the specific next action to take. Be concise and actionable.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Reasoning: {reasoning}\nCampaign input: {user_input}"}
                ],
                temperature=0.5,
                max_tokens=200
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return self._determine_fallback_action()
    
    async def _extract_data_with_openai(self, user_input: str) -> Dict[str, Any]:
        """Extract structured data using OpenAI"""
        
        system_prompt = """
        Extract structured campaign data from the user input.
        Return a JSON object with relevant campaign parameters.
        Include fields like campaign_name, budget, objective, target_demographics, 
        timeline, creative_formats, and a confidence score.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            # Try to parse JSON response
            try:
                return json.loads(response.choices[0].message.content)
            except json.JSONDecodeError:
                # If not valid JSON, return a structured fallback
                return self._extract_fallback_data(user_input)
                
        except Exception as e:
            return self._extract_fallback_data(user_input)
    
    def _generate_fallback_reasoning(self, user_input: str) -> str:
        """Fallback reasoning when OpenAI is unavailable"""
        
        if self.current_step == CampaignStep.PARSING:
            return f"""
            🤔 ANALYZING CAMPAIGN REQUIREMENTS:
            
            I need to extract key campaign parameters from the user input:
            • Budget allocation and constraints
            • Target audience demographics
            • Campaign objectives (awareness, conversion, etc.)
            • Timeline and scheduling requirements
            • Creative specifications and formats
            
            From the input: "{user_input[:100]}..."
            
            I can identify several key elements that will drive the campaign strategy.
            Let me parse this systematically...
            """
        
        return "Processing campaign requirements..."
    
    def _determine_fallback_action(self) -> str:
        """Fallback action when OpenAI is unavailable"""
        action_map = {
            CampaignStep.PARSING: "Parse campaign data and extract parameters",
            CampaignStep.PREFERENCES: "Query MCP database for advertiser preferences", 
            CampaignStep.AUDIENCE: "Generate optimal audience segments",
            CampaignStep.GENERATION: "Create line items for ad server upload",
            CampaignStep.COMPLETE: "Finalize campaign and prepare download"
        }
        
        return action_map.get(self.current_step, "Continue processing...")
    
    def _extract_fallback_data(self, user_input: str) -> Dict[str, Any]:
        """Fallback data extraction when OpenAI is unavailable"""
        return {
            "campaign_name": "Extracted Campaign",
            "budget": 100000,
            "objective": "awareness",
            "target_demographics": ["25-54", "streaming_viewers"],
            "timeline": "Q1 2024",
            "creative_formats": ["video", "display"],
            "confidence": 0.85,
            "source": "fallback_extraction"
        }
    
    async def advance_to_next_step(self) -> CampaignStep:
        """Move to next step in campaign setup process"""
        
        step_progression = {
            CampaignStep.PARSING: CampaignStep.PREFERENCES,
            CampaignStep.PREFERENCES: CampaignStep.AUDIENCE,
            CampaignStep.AUDIENCE: CampaignStep.GENERATION,
            CampaignStep.GENERATION: CampaignStep.COMPLETE
        }
        
        if self.current_step in step_progression:
            self.current_step = step_progression[self.current_step]
            
        return self.current_step
    
    def get_thinking_process(self) -> List[AgentThought]:
        """Return full thinking history for UI display"""
        return self.thinking_history
    
    def get_current_status(self) -> Dict[str, Any]:
        """Get current agent status for UI updates"""
        return {
            "current_step": self.current_step.value,
            "progress": len(self.thinking_history) / 4 * 100,  # 4 total steps
            "last_reasoning": self.thinking_history[-1].reasoning if self.thinking_history else "",
            "next_action": self.thinking_history[-1].action if self.thinking_history else "",
            "openai_enabled": bool(os.getenv("OPENAI_API_KEY"))
        } 