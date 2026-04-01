/**
 * Moltbook — Frontend App
 * Renders evaluation_results.json as a forum-style feed.
 *
 * Data loading priority:
 *  1. window.MOLTBOOK_DATA  (set by data/data.js — works with file://)
 *  2. fetch("data/evaluation_results.json") — works when served via HTTP
 *  3. Embedded FALLBACK_DATA — always works, used if neither above is available
 */

// ── Embedded fallback (sample data) ─────────────────────────────────────────
const FALLBACK_DATA = null; // Will be replaced by inline data if needed

// ── Utility ──────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return escapeHtml(text);

  // Escape HTML first, then highlight keywords
  let result = escapeHtml(text);

  // Sort longest first to prevent partial overlaps (e.g. "acid" inside "glycolic acid")
  const sorted = [...keywords].sort((a, b) => b.length - a.length);

  for (const kw of sorted) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "gi");
    result = result.replace(re, '<mark class="keyword">$1</mark>');
  }
  return result;
}

function scoreClass(score) {
  if (score >= 18) return "high";
  if (score >= 10) return "medium";
  return "low";
}

function modelInitials(modelId) {
  if (!modelId) return "?";
  if (modelId.includes("haiku"))  return "Hk";
  if (modelId.includes("sonnet")) return "Sn";
  if (modelId.includes("opus"))   return "Op";
  // generic fallback — first two letters after last "-"
  const parts = modelId.split("-");
  return parts[parts.length - 1].slice(0, 2).toUpperCase();
}

function modelShortName(modelId) {
  if (!modelId) return "Unknown";
  // e.g. "claude-haiku-4-5-20251001" → "claude-haiku-4-5"
  const match = modelId.match(/^(claude-[a-z]+-[\d]+-?[\d]?)/);
  return match ? match[1] : modelId;
}

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderLeaderboard(data) {
  const { model_averages, winner, threads } = data;
  const threadCount = threads.length;

  const modelCards = Object.entries(model_averages)
    .sort(([, a], [, b]) => b - a)
    .map(([model, avg]) => {
      const isWinner = model === winner;
      const winnerBadge = isWinner
        ? `<div class="winner-badge">Winner</div>` : "";
      return `
        <div class="model-card ${isWinner ? "winner" : ""}">
          <div class="model-name">${escapeHtml(model)}</div>
          <div class="model-score">${avg.toFixed(2)}<span>avg score</span></div>
          ${winnerBadge}
        </div>`;
    }).join("");

  const allScores = threads.map(t => t.total_score);
  const best  = Math.max(...allScores);
  const worst = Math.min(...allScores);

  return `
    <div class="leaderboard">
      <div class="leaderboard-title">Leaderboard</div>
      <div class="leaderboard-models">${modelCards}</div>
      <div class="leaderboard-meta">
        <span>${threadCount} thread${threadCount !== 1 ? "s" : ""}</span>
        <span>Best score: <strong>${best}</strong></span>
        <span>Lowest score: <strong>${worst}</strong></span>
      </div>
    </div>`;
}

function renderThread(thread) {
  const {
    thread_id, question_model, answer_model,
    question_text, answer_text, timestamp,
    total_score, keyword_score, consistency_bonus, matched_keywords,
  } = thread;

  const qInitials = modelInitials(question_model);
  const aInitials = modelInitials(answer_model);
  const sc   = scoreClass(total_score);
  const bonusStr = consistency_bonus >= 0
    ? `<span class="pos">+${consistency_bonus} consistency</span>`
    : `<span class="neg">${consistency_bonus} consistency</span>`;

  const keywordsHtml = (matched_keywords && matched_keywords.length > 0)
    ? `<div class="keyword-list">
         <span class="keyword-list-label">Matched:</span>
         ${matched_keywords.map(k => `<span class="keyword-pill">${escapeHtml(k)}</span>`).join("")}
       </div>` : "";

  const highlightedAnswer = highlightKeywords(answer_text, matched_keywords || []);

  return `
    <div class="thread" id="thread-${thread_id}">
      <!-- Question post -->
      <div class="post post-type-q">
        <div class="post-header">
          <div class="avatar llm">${escapeHtml(qInitials)}</div>
          <div class="post-meta">
            <div class="post-username">Skincare Enthusiast</div>
            <div class="post-model">${escapeHtml(modelShortName(question_model))}</div>
          </div>
          <div class="post-actions">
            <span class="thread-badge">#${thread_id}</span>
            <span class="timestamp">${formatTimestamp(timestamp)}</span>
          </div>
        </div>
        <div class="post-body">${escapeHtml(question_text)}</div>
      </div>

      <!-- Answer post -->
      <div class="post post-type-a">
        <div class="post-header">
          <div class="avatar slm">${escapeHtml(aInitials)}</div>
          <div class="post-meta">
            <div class="post-username">Skincare Expert</div>
            <div class="post-model">${escapeHtml(modelShortName(answer_model))}</div>
          </div>
          <div class="post-actions">
            <div class="score-badge ${sc}">${total_score.toFixed(1)}</div>
          </div>
        </div>
        <div class="post-body">${highlightedAnswer}</div>
        <div class="score-details">
          <span>${keyword_score} keyword pts</span>
          ${bonusStr}
          <span>= <strong>${total_score}</strong> total</span>
        </div>
        ${keywordsHtml}
      </div>
    </div>`;
}

function renderApp(data) {
  const app = document.getElementById("app");
  if (!app) return;

  const threadsHtml = data.threads
    .map((t, i) => renderThread(t, i))
    .join("");

  app.innerHTML = `
    ${renderLeaderboard(data)}
    <div class="section-title">Threads (${data.threads.length})</div>
    ${threadsHtml}`;
}

function renderError(message) {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = `
    <div class="state-message">
      <div class="icon">!</div>
      <h3>No data loaded</h3>
      <p>${message}</p>
    </div>`;
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function loadData() {
  // 1. Try the JS-injected global (works with file://)
  if (typeof MOLTBOOK_DATA !== "undefined" && MOLTBOOK_DATA) {
    return MOLTBOOK_DATA;
  }

  // 2. Try fetch (works when served over HTTP)
  try {
    const res = await fetch("data/evaluation_results.json");
    if (res.ok) return await res.json();
  } catch (_) { /* ignore CORS/network errors */ }

  return null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadData();

  if (data && data.threads && data.threads.length > 0) {
    renderApp(data);
  } else {
    renderError(
      `Run <code>python main.py --dry-run</code> (or <code>python main.py</code>) first, ` +
      `then refresh this page. The results file will be written to ` +
      `<code>frontend/data/</code>.`
    );
  }
});
