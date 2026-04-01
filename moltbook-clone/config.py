# ── Moltbook-Clone Configuration ─────────────────────────────────────────────

# Models
QUESTION_MODEL = "claude-sonnet-4-20250514"   # LLM — generates questions
ANSWER_MODEL   = "claude-haiku-4-5-20251001"  # SLM — generates answers

# Engine
NUM_THREADS = 5       # Default number of conversation threads
MAX_RETRIES = 3       # API call retry limit
RETRY_DELAY = 2       # Base delay (seconds) — doubles on each retry

# Evaluation
TAU = 200             # Consistency bonus threshold (characters)

# System prompts
QUESTION_SYSTEM_PROMPT = (
    "You are a curious skincare enthusiast. Ask a single, detailed question "
    "about skincare ingredients, routines, or skin conditions. Output only the "
    "question — no preamble, no follow-up."
)
ANSWER_SYSTEM_PROMPT = (
    "You are a knowledgeable skincare expert. Provide a helpful, accurate, and "
    "detailed response to the user's skincare question."
)

# Knowledge base — skincare keywords with their weights
SKINCARE_KEYWORDS = [
    "ceramides", "hyaluronic acid", "niacinamide", "retinol", "salicylic acid",
    "vitamin c", "peptides", "spf", "moisturizer", "exfoliation",
    "skin barrier", "collagen", "antioxidants", "aha", "bha",
    "glycolic acid", "lactic acid", "squalane", "zinc oxide", "centella asiatica",
    "tranexamic acid", "azelaic acid", "benzoyl peroxide", "urea", "panthenol",
]

KEYWORD_WEIGHTS = {kw: 1.0 for kw in SKINCARE_KEYWORDS}

# Output paths
OUTPUT_JSON = "frontend/data/evaluation_results.json"
OUTPUT_JS   = "frontend/data/data.js"   # loaded by frontend via <script>
SAMPLE_PATH = "sample_output.json"
