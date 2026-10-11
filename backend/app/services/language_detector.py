import re
from typing import Tuple

class LanguageDetector:
    """
    Lightweight rule and lexicon-assisted language & script detector
    for grassroots Indian communications, specializing in Devanagari
    and Romanized/code-mixed Marathi, Hindi, and English.
    """

    # Devanagari character range
    DEV_REGEX = re.compile(r"[\u0900-\u097F]")
    
    # Marathi Devanagari distinctive markers
    MR_DEVA_MARKERS = {
        "आहे", "नाही", "आहेत", "नाहीत", "झाला", "झाली", "झाले", "करणे", "करावे",
        "गावात", "गावातील", "पाणी", "रस्ता", "रस्त्यावर", "शाळा", "दवाखाना",
        "लाईट", "वीज", "कचरा", "समस्या", "पाहिजे", "द्यावा", "व्हावी", "येत",
        "असावा", "अमुच्या", "आमच्या", "आम्हाला", "करा", "बसावा", "पाहणी"
    }

    # Hindi Devanagari distinctive markers
    HI_DEVA_MARKERS = {
        "है", "हैं", "नहीं", "हुआ", "हुई", "हुए", "करना", "चाहिए", "गाँव",
        "सड़क", "बिजली", "अस्पताल", "साफ", "सफाई", "कचरा", "लोग", "परेशान",
        "हमारे", "हमें", "होगा", "होगी", "कृपा", "शिकायत", "रहता", "रही", "रहा"
    }

    # Romanized Marathi tokens (mr-Latn)
    MR_LATN_TOKENS = {
        "amhala", "amchya", "amcha", "amche", "gavath", "gaavat", "gaavath",
        "gav", "pani", "paani", "puravtha", "ahe", "nahi", "nahit", "ahet",
        "rastyavr", "rasta", "khadde", "shala", "dawakhana", "bolat", "karave",
        "purna", "hota", "hoti", "hote", "madhe", "var", "kadun", "sandarbhat",
        "takrar", "takraar", "dya", "karat", "kiti", "divas", "javal", "zala",
        "jali", "jale", "khup", "koni", "baghat", "lokanana", "shasan"
    }

    # Romanized Hindi tokens (hi-Latn)
    HI_LATN_TOKENS = {
        "humare", "hume", "humko", "gaon", "me", "mein", "hai", "hain", "nahi",
        "karo", "hoga", "hogi", "sadak", "bijli", "chahiye", "kripya", "shikayat",
        "kharab", "raha", "rahi", "rahe", "kuch", "bhi", "bahut", "log", "pareshan",
        "peene", "ka", "ki", "ke", "liye", "bhejo", "turant"
    }

    # English tokens
    EN_TOKENS = {
        "the", "is", "are", "in", "at", "to", "for", "we", "our", "water", "supply",
        "road", "roads", "electricity", "broken", "potholes", "hospital", "doctor",
        "school", "garbage", "village", "complaint", "issue", "problem", "urgently",
        "pipeline", "drainage", "sewage", "street", "light", "please", "help"
    }

    @classmethod
    def detect_language(cls, text: str) -> Tuple[str, float]:
        """
        Detects language and script.
        Returns:
            (language_code, confidence)
            e.g. ('mr-Latn', 0.85), ('mr-Deva', 0.95), ('hi-Deva', 0.90),
                 ('hi-Latn', 0.80), ('en', 0.90), ('code-mixed', 0.70), ('unknown', 0.30)
        """
        if not text or not text.strip():
            return "unknown", 0.0

        raw = text.strip()
        dev_chars = len(cls.DEV_REGEX.findall(raw))
        total_chars = max(len(re.sub(r"\s+", "", raw)), 1)

        # 1. Check Devanagari script presence
        if dev_chars / total_chars > 0.25:
            # Check for Marathi specific letter ळ
            if "ळ" in raw:
                return "mr-Deva", 0.95

            words = set(re.findall(r"[\u0900-\u097F]+", raw))
            mr_matches = len(words.intersection(cls.MR_DEVA_MARKERS))
            hi_matches = len(words.intersection(cls.HI_DEVA_MARKERS))

            if mr_matches > hi_matches:
                return "mr-Deva", min(0.65 + 0.1 * mr_matches, 0.95)
            elif hi_matches > mr_matches:
                return "hi-Deva", min(0.65 + 0.1 * hi_matches, 0.95)
            else:
                # Default Devanagari indicator if ambiguous
                return "mr-Deva" if mr_matches > 0 else "hi-Deva", 0.70

        # 2. Check Romanized text
        tokens = re.findall(r"[a-zA-Z]+", raw.lower())
        if not tokens:
            return "unknown", 0.20

        token_set = set(tokens)
        mr_count = len(token_set.intersection(cls.MR_LATN_TOKENS))
        hi_count = len(token_set.intersection(cls.HI_LATN_TOKENS))
        en_count = len(token_set.intersection(cls.EN_TOKENS))

        # Check for code-mixing
        vernacular_count = mr_count + hi_count
        if en_count >= 2 and vernacular_count >= 1:
            return "code-mixed", 0.80

        if mr_count > 0 and mr_count >= hi_count:
            return "mr-Latn", min(0.65 + 0.1 * mr_count, 0.95)

        if hi_count > 0 and hi_count > mr_count:
            return "hi-Latn", min(0.65 + 0.1 * hi_count, 0.95)

        if en_count >= 2 or (en_count == 1 and len(token_set) <= 3):
            return "en", min(0.70 + 0.05 * en_count, 0.95)

        return "unknown", 0.40

language_detector = LanguageDetector()
