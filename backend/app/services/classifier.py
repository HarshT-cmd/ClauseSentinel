import re
from typing import Tuple, List, Dict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

class TextNormalizer:
    """
    Normalizes grassroots citizen complaints while carefully preserving
    regional phonetics, Devanagari characters, and transliterated vernacular forms.
    """

    @staticmethod
    def normalize(text: str) -> str:
        if not text:
            return ""
        # Lowercase Latin characters
        normalized = text.lower()
        # Compress elongated characters (e.g. 'paniiiii' -> 'pani', 'plzzzz' -> 'plz')
        # while keeping valid double letters (up to 2)
        normalized = re.sub(r"(.)\1{2,}", r"\1\1", normalized)
        # Normalize excessive whitespace and punctuation
        normalized = re.sub(r"[\r\n\t]+", " ", normalized)
        normalized = re.sub(r"[!?,.:;\"\'\(\)\[\]{}]+", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized

# Curated multilingual grassroots training dataset for Maharashtra civic categories
TRAINING_DATA = [
    # --- Water Supply ---
    ("Amhala amchya gavath pani puravtha hot nahi", "Water Supply"),
    ("Pani puravtha purna thap zala ahe pinayche pani milat nahi", "Water Supply"),
    ("Gaavat borewell kharab ahe pani nahi", "Water Supply"),
    ("Pipelinela leak ahe pani vahat ahe", "Water Supply"),
    ("Pinaychya panyachi khup kami ahe tanker pathva", "Water Supply"),
    ("Tap water supply is stopped for 4 days", "Water Supply"),
    ("Water pipeline broken drinking water contaminated", "Water Supply"),
    ("Severe water shortage in our village need urgent water tanker", "Water Supply"),
    ("Borewell motor is burned no drinking water available", "Water Supply"),
    ("आमच्या गावात पिण्याचे पाणी पुरवठा होत नाही", "Water Supply"),
    ("पिण्याच्या पाण्याची तीव्र टंचाई आहे टँकर पाठवा", "Water Supply"),
    ("पाईपलाईन फुटली असून घाण पाणी येत आहे", "Water Supply"),
    ("विहिरीचे पाणी दूषित झाले आहे शुद्ध पाणी द्या", "Water Supply"),
    ("Hamare gaon me peene ka paani nahi aa raha hai", "Water Supply"),
    ("Pani ki samasya hai 5 din se supply band hai", "Water Supply"),
    ("Water pipeline leak zali amchya lane madhe", "Water Supply"),

    # --- Roads ---
    ("Rastyavr khup mothe khadde padlet apghat hot ahet", "Roads"),
    ("Amchya gavacha mukhy rasta purna kharab zala ahe", "Roads"),
    ("Pawasala lagla ki rastyavr chikhil ani khadde hotat", "Roads"),
    ("Damar nighun gele ahe rastyachi durusti kara", "Roads"),
    ("Main road to taluka has huge potholes and danger of accidents", "Roads"),
    ("Road construction left incomplete by contractor", "Roads"),
    ("Bridge connecting village is damaged and cracked", "Roads"),
    ("Street road needs asphalt paving immediately", "Roads"),
    ("गावातील मुख्य रस्त्यावर मोठमोठे खड्डे पडले आहेत", "Roads"),
    ("रस्त्याची दुरवस्था झाली असून डांबरीकरण करावे", "Roads"),
    ("पावसामुळे रस्ता वाहून गेला आहे दळणवळण बंद झाले", "Roads"),
    ("Hamare gaon ki sadak puri tarah toot chuki hai", "Roads"),
    ("Sadak par bahut bade gaddhe hai gaadi chalana mushkil hai", "Roads"),
    ("Road var khadde ahet dharashiv road purna kharab", "Roads"),
    ("There are potholes infront of my house in satara", "Roads"),
    ("Huge potholes on the street outside my home", "Roads"),
    ("Potholes and broken asphalt on society road", "Roads"),
    ("Road repair needed due to deep potholes and water logging", "Roads"),

    # --- Electricity ---
    ("Gavath light geli ahe transformer blast zala ahe", "Electricity"),
    ("Vijecha puravtha satat khandit hoto current nahiye", "Electricity"),
    ("Light geun 3 divas zale mahavitaran koni baghat nahi", "Electricity"),
    ("Street light band ahet rastyavr andhar ahe", "Electricity"),
    ("Frequent power cuts and low voltage burned motor", "Electricity"),
    ("Electricity transformer exploded no power for 2 days", "Electricity"),
    ("Electric wire hanging dangerously on street", "Electricity"),
    ("Street lights are not functioning darkness everywhere", "Electricity"),
    ("गावात वीज पुरवठा खंडित झाला असून ट्रान्सफॉर्मर जळाला आहे", "Electricity"),
    ("कमी व्होल्टेजमुळे शेतीचे पंप चालत नाहीत वीज द्या", "Electricity"),
    ("रस्त्यावरील विजेच्या तारा तुटून लोंबकळत आहेत", "Electricity"),
    ("Bijli nahi aa rahi hai gaon me andhera hai", "Electricity"),
    ("Light connection issue continuous load shedding in amcha area", "Electricity"),
    ("Vijecha puravtha thap zala ahe transformer jala ahe", "Electricity"),
    ("Vidarbhat Nagpur jilhyat vijecha puravtha thap zala ahe transformer jala", "Electricity"),
    ("Bijli transformer jal gaya hai current nahi aa raha", "Electricity"),
    ("Transformer jala light nahi vijechi samasya current cut", "Electricity"),

    # --- Sanitation ---
    ("Kachra saaf kela nahiye gavath durgandhi pasrali ahe", "Sanitation"),
    ("Gutter bharun rastyavr vahat ahe rograi pasrel", "Sanitation"),
    ("Kachryachi gadi yet nahi kachra kondi zali ahe", "Sanitation"),
    ("Nali saaf kara ganda pani gharat yet ahe", "Sanitation"),
    ("Garbage has piled up on street causing foul smell", "Sanitation"),
    ("Open sewage drainage overflowing on public road", "Sanitation"),
    ("Public toilet is choked and unhygienic", "Sanitation"),
    ("No garbage collection vehicle visiting for past week", "Sanitation"),
    ("गावात कचरा उचलला जात नाही दुर्गंधी पसरली आहे", "Sanitation"),
    ("सांडपाण्याची गटारे तुंबली असून रोगराईची भीती आहे", "Sanitation"),
    ("सार्वजनिक स्वच्छतागृह अस्वच्छ असून साफसफाई करावी", "Sanitation"),
    ("Kachra aur gandagi har jagah faili hui hai safai karo", "Sanitation"),
    ("Nali ka ganda paani sadak par beh raha hai", "Sanitation"),
    ("Drainage block zala ahe sanitation department help please", "Sanitation"),

    # --- Healthcare ---
    ("Dawakhanyat doctor nahit aushadhe milat nahit", "Healthcare"),
    ("Prathamik arogya kendrat nurse ani doctor uplabdh nahit", "Healthcare"),
    ("Rugnalayat emergency saathi ambulance nahiye", "Healthcare"),
    ("Rograi pasrali ahe dawakhana band ahe", "Healthcare"),
    ("No doctor available at primary health center", "Healthcare"),
    ("Hospital lacks emergency medicines and anti-venom", "Healthcare"),
    ("Ambulance facility not responding in rural health clinic", "Healthcare"),
    ("Doctor is constantly absent patients are suffering", "Healthcare"),
    ("प्राथमिक आरोग्य केंद्रात डॉक्टर हजर नसतात", "Healthcare"),
    ("दवाखान्यात आवश्यक औषधे आणि सर्पदंश लस उपलब्ध नाही", "Healthcare"),
    ("रुग्णालयात रुग्णवाहिका उपलब्ध नसल्याने रुग्णांचे हाल होत आहेत", "Healthcare"),
    ("Aspataal me doctor nahi aate dawai nahi milti", "Healthcare"),
    ("Prathmik swasthya kendra band pada rehta hai", "Healthcare"),
    ("Hospital madhe doctor absent ahet emergency patient ahe", "Healthcare"),

    # --- Education ---
    ("Shalechi imarat modkalis ali ahe chhat galat ahe", "Education"),
    ("Shalet shikshak nahit mulanche shikshan kharab hot ahe", "Education"),
    ("Zilla parishad school madhe benches ani pustake nahit", "Education"),
    ("Shalet toilet ani pinayche pani nahiye", "Education"),
    ("School building roof leaking dangerously during classes", "Education"),
    ("Government school lacks teachers for science and math", "Education"),
    ("No drinking water or sanitation facility for students in school", "Education"),
    ("Desks and blackboards missing in village primary school", "Education"),
    ("शाळेची इमारत धोकादायक झाली असून छताचे स्लॅब पडत आहेत", "Education"),
    ("जिल्हा परिषद शाळेत शिक्षक कमी असल्याने मुलांचे नुकसान होत आहे", "Education"),
    ("शाळेत मुला-मुलींसाठी स्वतंत्र स्वच्छतागृह नाही", "Education"),
    ("School me master ji nahi aate bachhon ki padhai kharab ho rahi", "Education"),
    ("Vidyalaya ki chhat tapak rahi hai repair karvao", "Education"),
    ("Shala madhe infrastructure kharab ahe shikshan issue", "Education"),

    # --- Other ---
    ("Gram panchayat office satat band asate karyalay kam hot nahi", "Education" if False else "Other"),
    ("Ration card milat nahi dukan dar dhanya det nahi", "Other"),
    ("Pension jama zali nahi 3 mahine zale", "Other"),
    ("General complaint regarding panchayat officer behavior", "Other"),
    ("Ration shop dealer charging excessive price for grain", "Other"),
    ("Old age pension not credited into bank account", "Other"),
    ("रेशन दुकानावर माल दिला जात नाही गैरव्यवहार चालू आहे", "Other"),
    ("ग्रामपंचायत कार्यालयात अधिकारी उपस्थित राहत नाहीत", "Other"),
    ("Panchayat karyalay band hai shikayat sunne wala koi nahi", "Other"),
]

class ComplaintCategoryClassifier:
    """
    scikit-learn TF-IDF + Logistic Regression pipeline
    trained on multilingual and code-mixed grassroots communications.
    Provides calibrated probability estimates and handles out-of-vocabulary gracefully.
    """

    def __init__(self):
        self.normalizer = TextNormalizer()
        self.pipeline: Pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),
                sublinear_tf=True,
                token_pattern=r"(?u)\b\w+\b"
            )),
            ("clf", LogisticRegression(
                C=1.5,
                max_iter=300,
                class_weight="balanced",
                random_state=42
            ))
        ])
        self._is_trained = False
        self._train_baseline()

    def _train_baseline(self):
        """Train the baseline pipeline on the curated grassroots dataset."""
        texts = [self.normalizer.normalize(item[0]) for item in TRAINING_DATA]
        labels = [item[1] for item in TRAINING_DATA]
        self.pipeline.fit(texts, labels)
        self._is_trained = True

    def predict_category(self, text: str) -> Tuple[str, float]:
        """
        Predicts complaint category and returns (category, calibrated_confidence).
        Confidence is derived from predict_proba().
        """
        if not text or not text.strip():
            return "Other", 0.0

        normalized = self.normalizer.normalize(text)
        if not normalized:
            return "Other", 0.0

        try:
            # Predict category and class probabilities
            classes = list(self.pipeline.classes_)
            probas = self.pipeline.predict_proba([normalized])[0]
            max_idx = int(np.argmax(probas))
            predicted_label = classes[max_idx]
            confidence = float(probas[max_idx])

            # Safety guard: if confidence is extremely diffuse (uniform distribution among 7 classes ~ 0.14)
            # flag as low confidence
            if confidence < 0.25:
                return "Other", round(confidence, 2)

            return predicted_label, round(confidence, 2)
        except Exception:
            return "Other", 0.0

# Singleton instance
complaint_classifier = ComplaintCategoryClassifier()
