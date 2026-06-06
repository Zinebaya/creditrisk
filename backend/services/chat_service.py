import os
from typing import Optional
import requests

SYSTEM_PROMPTS = {
    "en": """You are PayPredict Assistant, an expert on credit risk analysis and the PayPredict platform.
You help users understand:
- How to use PayPredict for credit risk prediction
- How to upload CSV files for batch scoring
- How to interpret risk scores and probabilities
- Subscription plans and features
- API usage and integration
- Best practices for credit analysis

Be helpful, concise, and professional. If asked about topics unrelated to PayPredict or credit risk, politely redirect to PayPredict topics.
Always provide accurate information about the platform features.""",
    "fr": """Vous êtes l'Assistant PayPredict, un expert en analyse du risque crédit et en plateforme PayPredict.
Vous aidez les utilisateurs à comprendre:
- Comment utiliser PayPredict pour la prédiction du risque crédit
- Comment télécharger des fichiers CSV pour l'évaluation par lots
- Comment interpréter les scores de risque et les probabilités
- Les plans d'abonnement et les fonctionnalités
- L'utilisation et l'intégration de l'API
- Les bonnes pratiques en matière d'analyse du crédit

Soyez utile, concis et professionnel. Si on vous pose des questions non liées à PayPredict ou au risque crédit, redirigez poliment vers les sujets PayPredict.
Fournissez toujours des informations précises sur les fonctionnalités de la plateforme.""",
    "ar": """أنت مساعد PayPredict، خبير في تحليل مخاطر الائتمان ومنصة PayPredict.
تساعد المستخدمين على فهم:
- كيفية استخدام PayPredict للتنبؤ بمخاطر الائتمان
- كيفية تحميل ملفات CSV للتقييم على دفعات
- كيفية تفسير درجات المخاطر والاحتماليات
- خطط الاشتراك والميزات
- استخدام API والتكامل
- أفضل الممارسات في تحليل الائتمان

كن مفيداً وموجزاً واحترافياً. إذا سُئلت عن موضوعات غير مرتبطة بـ PayPredict أو مخاطر الائتمان، أعد توجيه اللسان بلطف نحو مواضيع PayPredict.
قدم دائماً معلومات دقيقة حول ميزات المنصة.""",
}


class ChatService:
    """Service for handling chatbot interactions using OpenAI or Claude API."""

    @staticmethod
    def get_api_key() -> str:
        """Get the LLM API key from environment."""
        return os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY") or ""

    @staticmethod
    def get_model() -> str:
        """Determine which model to use."""
        if os.getenv("OPENAI_API_KEY"):
            return "openai"
        elif os.getenv("ANTHROPIC_API_KEY"):
            return "claude"
        return "mock"  # For testing without API keys

    @staticmethod
    def generate_response(
        message: str, language: str = "en", conversation_id: Optional[str] = None
    ) -> str:
        """
        Generate a response to a user message using the configured LLM.

        Args:
            message: User message
            language: User's language preference (en, fr, ar)
            conversation_id: For maintaining conversation context

        Returns:
            Assistant's response
        """
        model = ChatService.get_model()
        api_key = ChatService.get_api_key()

        if language not in SYSTEM_PROMPTS:
            language = "en"

        system_prompt = SYSTEM_PROMPTS[language]

        try:
            if model == "openai":
                return ChatService._call_openai(message, system_prompt, api_key)
            elif model == "claude":
                return ChatService._call_claude(message, system_prompt, api_key)
            else:
                return ChatService._mock_response(message, language)
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return (
                "I apologize, I'm unable to process your request at the moment."
                if language == "en"
                else "Je m'excuse, je ne peux pas traiter votre demande pour le moment."
                if language == "fr"
                else "أعتذر، لا يمكنني معالجة طلبك في الوقت الحالي."
            )

    @staticmethod
    def _call_openai(message: str, system_prompt: str, api_key: str) -> str:
        """Call OpenAI API (GPT-3.5 or GPT-4)."""
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "temperature": 0.7,
            "max_tokens": 500,
        }

        response = requests.post(
            "https://api.openai.com/v1/chat/completions", json=data, headers=headers
        )
        response.raise_for_status()

        result = response.json()
        return result["choices"][0]["message"]["content"].strip()

    @staticmethod
    def _call_claude(message: str, system_prompt: str, api_key: str) -> str:
        """Call Anthropic Claude API."""
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        data = {
            "model": "claude-3-haiku-20240307",
            "max_tokens": 500,
            "system": system_prompt,
            "messages": [{"role": "user", "content": message}],
        }

        response = requests.post(
            "https://api.anthropic.com/v1/messages", json=data, headers=headers
        )
        response.raise_for_status()

        result = response.json()
        return result["content"][0]["text"].strip()

    @staticmethod
    def _mock_response(message: str, language: str) -> str:
        """Return a mock response for testing without API keys."""
        responses = {
            "en": {
                "default": "That's a great question about PayPredict! To get the most accurate answer, please refer to our documentation or contact our support team.",
                "pricing": "We offer three plans: Free (up to 100 predictions/month), Professional ($299/month with unlimited predictions), and Enterprise (custom pricing).",
                "upload": "You can upload CSV or Excel files with client data. The file must include required columns like client_id, loan amount, income, and other credit metrics.",
                "risk": "PayPredict uses machine learning to assess credit risk. The prediction output includes a probability score (0-1) and a decision (approve/decline).",
            },
            "fr": {
                "default": "C'est une excellente question sur PayPredict! Pour obtenir la réponse la plus précise, veuillez consulter notre documentation ou contacter notre équipe d'assistance.",
                "pricing": "Nous proposons trois forfaits: Gratuit (jusqu'à 100 prédictions/mois), Professionnel (299 $/mois avec prédictions illimitées) et Entreprise (tarification personnalisée).",
                "upload": "Vous pouvez télécharger des fichiers CSV ou Excel avec les données des clients. Le fichier doit inclure les colonnes requises comme client_id, montant du prêt, revenu, etc.",
                "risk": "PayPredict utilise l'apprentissage automatique pour évaluer le risque crédit. La sortie de prédiction inclut un score de probabilité (0-1) et une décision (approuver/refuser).",
            },
            "ar": {
                "default": "هذا سؤال رائع حول PayPredict! للحصول على الإجابة الأكثر دقة، يرجى الاطلاع على وثائقنا أو الاتصال بفريق الدعم لدينا.",
                "pricing": "نحن نقدم ثلاث خطط: مجانية (حتى 100 تنبؤ/شهر)، احترافية (299 دولار/شهر مع تنبؤات غير محدودة)، والمؤسسة (تسعير مخصص).",
                "upload": "يمكنك تحميل ملفات CSV أو Excel ببيانات العملاء. يجب أن يتضمن الملف الأعمدة المطلوبة مثل معرف العميل والمبلغ القرض والدخل وغيرها.",
                "risk": "يستخدم PayPredict التعلم الآلي لتقييم مخاطر الائتمان. يتضمن ناتج التنبؤ درجة احتمالية (0-1) وقرار (موافقة/رفض).",
            },
        }

        lang_responses = responses.get(language, responses["en"])

        # Simple keyword matching for mock responses
        message_lower = message.lower()
        if any(keyword in message_lower for keyword in ["price", "cost", "plan", "subscription"]):
            return lang_responses.get("pricing", lang_responses["default"])
        elif any(
            keyword in message_lower
            for keyword in ["upload", "csv", "file", "import", "batch"]
        ):
            return lang_responses.get("upload", lang_responses["default"])
        elif any(
            keyword in message_lower
            for keyword in ["risk", "prediction", "score", "probability", "decision"]
        ):
            return lang_responses.get("risk", lang_responses["default"])

        return lang_responses["default"]
