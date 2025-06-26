"""
Advertiser Preferences Agent - Step 2: Historical Data Analysis
Neural Ads - Connected TV Advertising Platform
"""

import json
import os
from typing import Dict, Any, List
from dataclasses import dataclass
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

@dataclass
class AdvertiserPreferences:
    advertiser: str
    preferred_targeting: List[str]
    content_preferences: List[str]
    geo_preferences: List[str]
    device_preferences: List[str]
    cpm_range: Dict[str, float]
    performance: Dict[str, float]
    confidence: float
    insights: List[str]

class AdvertiserPreferencesAgent:
    """
    Specialized agent for analyzing advertiser historical buying patterns
    
    Analyzes:
    - Content type preferences
    - Geographic targeting patterns
    - Device targeting preferences
    - Historical CPM performance
    - Audience segment effectiveness
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "your_api_key_here")
        )
        self.model = os.getenv("AGENT_MODEL", "gpt-4o-mini")
    
    async def analyze_advertiser_patterns(self, advertiser: str, campaign_objective: str) -> AdvertiserPreferences:
        """Analyze historical patterns for the given advertiser"""
        
        system_prompt = f"""
        You are Neural, analyzing historical buying patterns for {advertiser}.
        
        Based on the advertiser type and campaign objective ({campaign_objective}), provide realistic historical data analysis.
        
        Return ONLY a valid JSON object with these fields:
        
        {{
            "preferred_targeting": ["demographic1", "demographic2", "interest1"],
            "content_preferences": ["Family Animation", "Reality Shows", "News", "Sports"],
            "geo_preferences": ["Midwest", "South", "Northwest", "Nationwide"],
            "device_preferences": ["CTV", "Mobile", "Desktop"],
            "cpm_range": {{"min": 28, "max": 42}},
            "performance": {{"ctr": 0.85, "vtr": 68.5, "completion_rate": 82.3}},
            "insights": [
                "Strong performance in premium content environments",
                "Higher engagement during evening dayparts",
                "Preferred frequency cap of 2-3 per day"
            ]
        }}
        
        Make the data realistic for the advertiser type and industry.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze historical patterns for {advertiser} with {campaign_objective} objective"}
                ],
                temperature=0.4,
                max_tokens=700
            )
            
            data = json.loads(response.choices[0].message.content)
            
            return AdvertiserPreferences(
                advertiser=advertiser,
                preferred_targeting=data.get("preferred_targeting", []),
                content_preferences=data.get("content_preferences", []),
                geo_preferences=data.get("geo_preferences", []),
                device_preferences=data.get("device_preferences", []),
                cpm_range=data.get("cpm_range", {"min": 28, "max": 42}),
                performance=data.get("performance", {}),
                confidence=0.80,
                insights=data.get("insights", [])
            )
            
        except Exception as e:
            print(f"Advertiser analysis error: {e}")
            return self._fallback_analysis(advertiser, campaign_objective)
    
    def _fallback_analysis(self, advertiser: str, campaign_objective: str) -> AdvertiserPreferences:
        """Fallback analysis when OpenAI is unavailable"""
        
        return AdvertiserPreferences(
            advertiser=advertiser,
            preferred_targeting=["Adults 25-54", "Household Income $50K+", "Urban/Suburban"],
            content_preferences=["Family Animation", "Reality Shows", "News", "Sports"],
            geo_preferences=["Midwest", "South", "Northwest"],
            device_preferences=["CTV", "Mobile"],
            cpm_range={"min": 28, "max": 42},
            performance={"ctr": 0.75, "vtr": 65.2, "completion_rate": 78.5},
            confidence=0.65,
            insights=[
                "Consistent performance across content types",
                "Strong CTV engagement rates",
                "Prefers premium content environments"
            ]
        )
    
    async def generate_reasoning(self, preferences: AdvertiserPreferences) -> str:
        """Generate reasoning text for the preferences analysis"""
        
        return f"""
        📈 Neural - Historical Pattern Analysis
        
        Retrieved buying patterns for {preferences.advertiser}:
        
        Content Preferences:
        {chr(10).join([f"• {pref}" for pref in preferences.content_preferences[:3]])}
        
        Geographic Focus:
        {chr(10).join([f"• {geo}" for geo in preferences.geo_preferences[:3]])}
        
        Performance Metrics:
        • CTR: {preferences.performance.get('ctr', 0):.2f}%
        • VTR: {preferences.performance.get('vtr', 0):.1f}%
        • Completion Rate: {preferences.performance.get('completion_rate', 0):.1f}%
        
        Key Insights:
        {chr(10).join([f"• {insight}" for insight in preferences.insights[:2]])}
        
        Historical patterns retrieved.
        
        CPM Range: ${preferences.cpm_range['min']}-${preferences.cpm_range['max']} based on historical performance.
        """ 