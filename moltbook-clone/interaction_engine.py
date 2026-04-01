"""
Module 1 — Interaction Engine
Orchestrates LLM→SLM conversations via the Anthropic API.
"""

import os
import time
import anthropic
from datetime import datetime, timezone

from config import (
    QUESTION_MODEL, ANSWER_MODEL,
    QUESTION_SYSTEM_PROMPT, ANSWER_SYSTEM_PROMPT,
    MAX_RETRIES, RETRY_DELAY,
)


def create_client() -> anthropic.Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY environment variable is not set. "
            "Copy .env.example to .env and add your key, or export it in your shell."
        )
    return anthropic.Anthropic(api_key=api_key)


def _call_with_retry(
    client: anthropic.Anthropic,
    model: str,
    system: str,
    user_message: str,
    max_retries: int = MAX_RETRIES,
) -> str:
    """Call client.messages.create with exponential-backoff retries."""
    last_exc: Exception | None = None

    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model=model,
                max_tokens=1024,
                system=system,
                messages=[{"role": "user", "content": user_message}],
            )
            return response.content[0].text

        except anthropic.RateLimitError as exc:
            wait = RETRY_DELAY * (2 ** attempt)
            print(f"\n    [rate limit] waiting {wait}s before retry {attempt + 1}/{max_retries}...",
                  end="", flush=True)
            time.sleep(wait)
            last_exc = exc

        except anthropic.APITimeoutError as exc:
            print(f"\n    [timeout] retry {attempt + 1}/{max_retries}...", end="", flush=True)
            time.sleep(RETRY_DELAY)
            last_exc = exc

        except anthropic.APIStatusError as exc:
            print(f"\n    [api error {exc.status_code}] retry {attempt + 1}/{max_retries}...",
                  end="", flush=True)
            time.sleep(RETRY_DELAY)
            last_exc = exc

    raise RuntimeError(
        f"API call failed after {max_retries} attempts"
    ) from last_exc


def generate_thread(client: anthropic.Anthropic, thread_id: int) -> dict:
    """Generate one question→answer thread. Returns thread dict (no printing)."""
    question_text = _call_with_retry(
        client, QUESTION_MODEL, QUESTION_SYSTEM_PROMPT,
        "Please ask your skincare question.",
    )

    answer_text = _call_with_retry(
        client, ANSWER_MODEL, ANSWER_SYSTEM_PROMPT,
        question_text,
    )

    return {
        "thread_id": thread_id,
        "question_model": QUESTION_MODEL,
        "answer_model": ANSWER_MODEL,
        "question_text": question_text,
        "answer_text": answer_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
