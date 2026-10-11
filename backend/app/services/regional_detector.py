import re
from typing import Tuple, List, Dict

class RegionalDetector:
    """
    Regional-origin estimation service for grassroots communications.
    
    METHODOLOGY & ETHICAL SAFEGUARD:
    A citizen complaint's topic (e.g. water scarcity or road repairs) is NOT proof 
    of geographic origin. In Maharashtra and neighboring states, civic grievances 
    and standard Marathi/Hindi vocabulary are shared statewide.
    
    To avoid hallucinating geographic districts or communities without empirical evidence:
    1. Only explicit geographic division markers or verified regional dialectal markers
       (e.g., Varhadi, Ahirani, Malvani) produce a region estimate.
    2. In the absence of conclusive linguistic or administrative clues, this service
       returns 'Uncertain' with 0.0 confidence and an empty clues list, directly triggering
       the 'needs_review' human-in-the-loop workflow.
    """

    # Regional indicators mapping to macro-regions
    # Keys: macro-region
    # Values: list of tuples (pattern, description)
    REGIONAL_RULES: Dict[str, List[Tuple[re.Pattern, str]]] = {
        "Vidarbha": [
            (re.compile(r"\b(vidarbha|vidarbhat|विदर्भ|विदर्भात)\b", re.IGNORECASE), "Regional division mention: Vidarbha"),
            (re.compile(r"\b(varhadi|varhad|वऱ्हाडी|वऱ्हाड)\b", re.IGNORECASE), "Dialectal marker: Varhadi"),
            (re.compile(r"\b(nagpur|amravati|akola|yavatmal|chandrapur|wardha|bhandara|gadchiroli|gondia|buldhana|वाशीम|washim)\b", re.IGNORECASE), "Administrative district cue: Vidarbha region"),
        ],
        "Marathwada": [
            (re.compile(r"\b(marathwada|marathwadyat|मराठवाडा|मराठवाड्यात)\b", re.IGNORECASE), "Regional division mention: Marathwada"),
            (re.compile(r"\b(aurangabad|chhatrapati sambhajinagar|nanded|latur|jalna|parbhani|beed|dharashiv|osmanabad)\b", re.IGNORECASE), "Administrative district cue: Marathwada region"),
        ],
        "Konkan": [
            (re.compile(r"\b(konkan|kokan|कोकण|कोकणात)\b", re.IGNORECASE), "Regional division mention: Konkan"),
            (re.compile(r"\b(malvani|malvan|मालवणी|मालवण)\b", re.IGNORECASE), "Dialectal marker: Malvani / South Konkan"),
            (re.compile(r"\b(ratnagiri|sindhudurg|raigad|alibag|chiplun|sawantwadi)\b", re.IGNORECASE), "Administrative district cue: Konkan coastal belt"),
        ],
        "Western Maharashtra": [
            (re.compile(r"\b(paschim maharashtra|पश्चिम महाराष्ट्र)\b", re.IGNORECASE), "Regional division mention: Western Maharashtra"),
            (re.compile(r"\b(pune|satara|sangli|kolhapur|solapur|बारामती|baramati|कराड|karad)\b", re.IGNORECASE), "Administrative district cue: Western Maharashtra / Desh"),
        ],
        "Khandesh": [
            (re.compile(r"\b(khandesh|खान्देश|खानदेश)\b", re.IGNORECASE), "Regional division mention: Khandesh"),
            (re.compile(r"\b(ahirani|अहिराणी)\b", re.IGNORECASE), "Dialectal marker: Ahirani / Khandeshi"),
            (re.compile(r"\b(jalgaon|dhule|nandurbar|bhusawal)\b", re.IGNORECASE), "Administrative district cue: Khandesh region"),
        ],
        "North Maharashtra": [
            (re.compile(r"\b(uttar maharashtra|उत्तर महाराष्ट्र)\b", re.IGNORECASE), "Regional division mention: North Maharashtra"),
            (re.compile(r"\b(nashik|ahmednagar|malegaon|shirdi)\b", re.IGNORECASE), "Administrative district cue: North Maharashtra"),
        ]
    }

    @classmethod
    def detect_region(cls, text: str) -> Tuple[str, float, List[str]]:
        """
        Estimates the regional origin based strictly on verifiable dialectal
        and geographic indicators.
        
        Returns:
            (predicted_region, confidence, regional_clues)
        """
        if not text or not text.strip():
            return "Uncertain", 0.0, []

        cleaned = text.strip()
        matched_regions: Dict[str, List[str]] = {}

        for region, rules in cls.REGIONAL_RULES.items():
            for pattern, clue_desc in rules:
                if pattern.search(cleaned):
                    if region not in matched_regions:
                        matched_regions[region] = []
                    matched_regions[region].append(clue_desc)

        # If no indicators match, transparently declare Uncertain
        if not matched_regions:
            return "Uncertain", 0.0, []

        # Find the region with the most matched clues
        best_region = max(matched_regions.keys(), key=lambda r: len(matched_regions[r]))
        clues = matched_regions[best_region]
        
        # Calibrate confidence based on number and type of evidence points
        # Base confidence for 1 clue is 0.75, 2+ clues is 0.85 - 0.90
        base_confidence = 0.75
        if len(clues) > 1:
            base_confidence = min(0.75 + (0.10 * (len(clues) - 1)), 0.92)

        return best_region, round(base_confidence, 2), clues

regional_detector = RegionalDetector()
