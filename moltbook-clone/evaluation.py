"""
Module 2 — Evaluation Pipeline
Implements Score(R) = Σ(wi * match(R, ki)) + C(R)
"""

from config import SKINCARE_KEYWORDS, KEYWORD_WEIGHTS, TAU


def _match_keywords(text: str, keywords: list[str], weights: dict[str, float]) -> dict:
    """Return matched keywords and their total weight sum."""
    lower = text.lower()
    matched = [kw for kw in keywords if kw in lower]
    keyword_score = sum(weights.get(kw, 1.0) for kw in matched)
    return {"matched_keywords": matched, "keyword_score": keyword_score}


def _consistency_bonus(text: str, tau: int = TAU) -> int:
    """C(R): +5 if len(R) >= tau, else -5."""
    return 5 if len(text) >= tau else -5


def score_response(
    response_text: str,
    keywords: list[str] = SKINCARE_KEYWORDS,
    weights: dict[str, float] = KEYWORD_WEIGHTS,
    tau: int = TAU,
) -> dict:
    """
    Score a single response.
    Returns dict with total_score, keyword_score, consistency_bonus, matched_keywords.
    """
    match_result = _match_keywords(response_text, keywords, weights)
    bonus = _consistency_bonus(response_text, tau)
    total = match_result["keyword_score"] + bonus

    return {
        "total_score": total,
        "keyword_score": match_result["keyword_score"],
        "consistency_bonus": bonus,
        "matched_keywords": match_result["matched_keywords"],
    }


def evaluate_threads(threads: list[dict]) -> dict:
    """
    Score all threads, compute per-model averages, and determine the winner.
    Returns the full results dict ready for JSON serialisation.
    """
    scored_threads = []
    model_score_lists: dict[str, list[float]] = {}

    for thread in threads:
        score_result = score_response(thread["answer_text"])
        scored_thread = {**thread, **score_result}
        scored_threads.append(scored_thread)

        model = thread["answer_model"]
        model_score_lists.setdefault(model, []).append(score_result["total_score"])

    model_averages = {
        model: round(sum(scores) / len(scores), 2)
        for model, scores in model_score_lists.items()
    }
    winner = max(model_averages, key=model_averages.get)

    return {
        "threads": scored_threads,
        "model_averages": model_averages,
        "winner": winner,
    }
