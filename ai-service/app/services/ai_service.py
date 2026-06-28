import json
import logging
import re
from typing import Any

from app.errors import AIServiceError, LLMRequestError
from app.models.schemas import (
    AtsKeywordRequest,
    AtsKeywordResponse,
    CvEnrichRequest,
    CvEnrichResponse,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    GenerateQuizRequest,
    GenerateQuizResponse,
    GenerateRoadmapRequest,
    GenerateRoadmapResponse,
    GitHubAnalyzeRequest,
    GitHubAnalyzeResponse,
    GradeQuizRequest,
    GradeQuizResponse,
    QuestionItem,
    QuizQuestion,
    RecommendationItem,
    RoadmapItemDto,
    RoleContext,
    SummarizeInterviewRequest,
    SummarizeInterviewResponse,
)
from app.services import llm as llm_service

logger = logging.getLogger(__name__)

_AI_SETUP_HINT = "Set AI_PROVIDER=grok and GROK_API_KEY in .env, then restart ai-service."


def _require_llm(feature: str) -> None:
    if not llm_service.is_llm_enabled():
        raise AIServiceError(
            f"AI provider is not configured for {feature}. {_AI_SETUP_HINT}",
            feature=feature,
        )


def _require_ai_result(result: Any, feature: str) -> Any:
    if result is None:
        raise AIServiceError(
            f"Grok could not complete {feature}. Check your API key and try again.",
            feature=feature,
        )
    return result


_COMMON_SKILLS = [
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "sql",
    "git",
    "docker",
    "aws",
    "communication",
    "leadership",
    "problem solving",
    "teamwork",
    "agile",
    "rest",
    "api",
    "html",
    "css",
    "node",
    "spring",
]

_BEHAVIORAL_QUESTIONS = [
    "Tell me about yourself and why you are interested in this role.",
    "Describe a challenging project you worked on and how you handled it.",
    "Tell me about a time you had to work with a difficult teammate.",
    "Give an example of when you showed leadership.",
    "Describe a situation where you had to learn something quickly.",
]

_TECHNICAL_QUESTIONS = [
    "Explain a technical concept you recently learned.",
    "How would you debug a production issue?",
    "Describe your approach to writing clean, maintainable code.",
    "Walk me through how you would design a REST API.",
    "What trade-offs would you consider when choosing a database?",
]

_MIXED_QUESTIONS = [
    "Tell me about yourself.",
    "Explain a technical concept relevant to {role}.",
    "Describe a time you solved a complex problem.",
    "How do you stay current with industry trends?",
    "What is your greatest strength for this role?",
]


def _round_score(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 2)


def _role_title(request_role: str, role_context: RoleContext | None) -> str:
    if role_context and role_context.title:
        return role_context.title
    return request_role or "Software Engineering Intern"


def _format_role_context(role_context: RoleContext | None, fallback_title: str) -> str:
    if role_context is None:
        return f"Target role: {fallback_title}"
    lines = [
        f"Target role: {role_context.title or fallback_title}",
        f"Industry: {role_context.industry or 'General'}",
    ]
    if role_context.description:
        lines.append(f"Role description: {role_context.description}")
    if role_context.required_skills:
        skill_lines = [
            f"- {s.skill_name} (minimum level {s.min_level}, weight {s.weight})"
            for s in role_context.required_skills
        ]
        lines.append("Required skills for this role:\n" + "\n".join(skill_lines))
    return "\n".join(lines)


def _required_keywords(role_context: RoleContext | None) -> list[str]:
    if role_context is None or not role_context.required_skills:
        return []
    return [skill.skill_name for skill in role_context.required_skills if skill.skill_name]


def _parse_keyword_notes(
    data: dict[str, Any],
    include_justifications: bool,
) -> list[RecommendationItem]:
    return _dedupe_parsed_recommendations(
        _parse_recommendations(data.get("keywordNotes") or data.get("keyword_notes"), include_justifications),
        limit=3,
    )


def _justification_clause(include: bool) -> str:
    if not include:
        return (
            "For each recommendation, set justification and evidence to null. "
            "Keep recommendations concise and role-specific."
        )
    return (
        "For recommendations (full report only): include non-empty justification and evidence. "
        "justification: why this matters for the role — must NOT repeat or rephrase the recommendation text. "
        "evidence: one specific CV/repo detail not already stated in the recommendation text."
    )


def _summary_text_clause() -> str:
    return (
        "summaryText: at most 2 short sentences (under 40 words total) — a quick overview of top gaps only. "
        "Do NOT repeat roleFitSummary or list every missing skill; full detail belongs in reportSummary and recommendations. "
        "Actionable gaps only — never praise strengths."
    )


def _report_summary_clause() -> str:
    return (
        "reportSummary: a descriptive paragraph (4-6 sentences, 80-150 words) for the full analysis report. "
        "Explain the most important gaps, missing role requirements, and what to prioritize fixing first. "
        "Improvements only — never praise. More detailed than summaryText; do not copy recommendation text verbatim."
    )


def _role_fit_summary_clause() -> str:
    return (
        "roleFitSummary: exactly one brief sentence (under 25 words) on overall fit — strengths and main gap in plain language. "
        "This is shown next to the score; keep it concise."
    )


def _role_alignment_summary_clause() -> str:
    return (
        "roleAlignmentSummary: exactly one brief sentence (under 25 words) on portfolio-role alignment. "
        "Shown next to the score; keep it concise."
    )


def _recommendations_clause() -> str:
    return (
        "recommendations: 5-8 DISTINCT actionable improvements for a full report — gaps to fix only. "
        "Each item must be something the candidate should ADD, CHANGE, or FIX. "
        "Each item must address a different theme — never repeat the same gap twice. "
        "Do not duplicate summaryTips; go deeper with specific, actionable detail."
    )


def _improvements_only_clause() -> str:
    return (
        "CRITICAL — improvements only: "
        "summaryText and recommendations must NEVER praise strengths or describe what is already good "
        "(e.g. 'strong Java skills', 'showcases ability', 'significant asset'). "
        "Put all positive observations in roleFitSummary only (one brief sentence). "
        "summaryText is a 1-2 sentence teaser only — never duplicate recommendation details. "
        "reportSummary is the detailed narrative for the downloadable full report. "
        "BAD: 'The candidate demonstrates strong Python skills'. "
        "GOOD: 'Add GitHub links for Auditra and other projects on your CV'."
    )


_PRAISE_ONLY_PATTERNS = (
    r"demonstrates a strong",
    r"significant asset",
    r"showcases (?:their|your) ability",
    r"is a (?:strong|good|great|significant)",
    r"well[- ]?(?:suited|aligned|prepared|positioned)",
    r"essential for .{0,40} and (?:the )?candidate",
    r"which is (?:essential|important|valuable|crucial) for",
)


def _is_actionable_improvement(text: str) -> bool:
    lower = text.lower().strip()
    if not lower:
        return False
    improvement_markers = (
        "add ",
        "include ",
        "improve ",
        "tailor ",
        "highlight ",
        "strengthen ",
        "fix ",
        "missing ",
        "lack ",
        "expand ",
        "clarify ",
        "quantify ",
        "remove ",
        "rewrite ",
        "emphasiz",
        " should ",
        " consider ",
        " need to ",
        " needs to ",
        " gap ",
        " weak ",
        " unclear ",
        " absent ",
        " without ",
    )
    has_action = any(marker in lower for marker in improvement_markers)
    looks_like_praise = any(re.search(pattern, lower) for pattern in _PRAISE_ONLY_PATTERNS)
    if looks_like_praise and not has_action:
        return False
    if lower.startswith(
        (
            "the candidate demonstrates",
            "the candidate shows",
            "the candidate has a strong",
            "proficiency in",
        )
    ) and not has_action:
        return False
    return True


def _filter_improvements_only(items: list[RecommendationItem]) -> list[RecommendationItem]:
    return [item for item in items if item.text and _is_actionable_improvement(item.text)]


def _filter_summary_tips(tips: list[str]) -> list[str]:
    return [tip for tip in tips if _is_actionable_improvement(tip)]


def _normalize_key(text: str) -> str:
    return re.sub(r"[^a-z0-9\s]", " ", text.lower()).strip()


def _is_similar_text(a: str, b: str) -> bool:
    na, nb = _normalize_key(a), _normalize_key(b)
    if not na or not nb:
        return False
    if na == nb or na in nb or nb in na:
        return True
    words_a = {w for w in na.split() if len(w) > 2}
    words_b = {w for w in nb.split() if len(w) > 2}
    if not words_a or not words_b:
        return False
    overlap = len(words_a & words_b) / min(len(words_a), len(words_b))
    return overlap >= 0.55


def _dedupe_recommendations(
    items: list[RecommendationItem],
    limit: int | None = None,
) -> list[RecommendationItem]:
    deduped: list[RecommendationItem] = []
    for item in items:
        if not item.text:
            continue
        if any(_is_similar_text(item.text, existing.text) for existing in deduped):
            continue
        deduped.append(item)
        if limit and len(deduped) >= limit:
            break
    return deduped


def _brief_text(text: str, *, max_sentences: int = 2, max_chars: int = 220) -> str:
    cleaned = text.strip()
    if not cleaned:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    parts = [part.strip() for part in parts if part.strip()]
    brief = " ".join(parts[:max_sentences]).strip()
    if len(brief) > max_chars:
        brief = brief[: max_chars - 1].rsplit(" ", 1)[0] + "…"
    return brief


def _parse_report_summary(
    data: dict[str, Any],
    fallback: list[RecommendationItem] | None = None,
    *,
    role_fit_summary: str = "",
    summary_text: str = "",
) -> str:
    text = _coerce_text(data.get("reportSummary") or data.get("report_summary"))
    if text:
        lower = text.lower()
        looks_like_praise = any(re.search(pattern, lower) for pattern in _PRAISE_ONLY_PATTERNS)
        if not looks_like_praise:
            parts = re.split(r"(?<=[.!?])\s+", text.strip())
            parts = [part.strip() for part in parts if part.strip()]
            detailed = " ".join(parts[:6]).strip()
            if len(detailed) > 900:
                detailed = detailed[:899].rsplit(" ", 1)[0] + "…"
            if detailed:
                return detailed

    parts: list[str] = []
    if role_fit_summary.strip():
        parts.append(role_fit_summary.strip())
    if summary_text.strip():
        parts.append(summary_text.strip())
    if fallback:
        rec_parts = [item.text for item in _dedupe_recommendations(_filter_improvements_only(fallback), limit=4) if item.text]
        if rec_parts:
            parts.append("Priority improvements include: " + "; ".join(rec_parts) + ".")
    return " ".join(parts).strip()


def _parse_summary_text(
    data: dict[str, Any],
    fallback: list[RecommendationItem] | None = None,
) -> str:
    text = _coerce_text(data.get("summaryText") or data.get("summary_text"))
    if text:
        lower = text.lower()
        looks_like_praise = any(re.search(pattern, lower) for pattern in _PRAISE_ONLY_PATTERNS)
        if not looks_like_praise:
            return _brief_text(text, max_sentences=2, max_chars=220)

    raw_tips = data.get("summaryTips") or data.get("summary_tips")
    if isinstance(raw_tips, list):
        parts = [
            tip
            for tip in (_coerce_text(entry if isinstance(entry, str) else None) for entry in raw_tips)
            if tip and _is_actionable_improvement(tip)
        ]
        if parts:
            return _brief_text(" ".join(parts), max_sentences=2, max_chars=220)

    if fallback:
        parts = [
            item.text
            for item in _dedupe_recommendations(_filter_improvements_only(fallback), limit=2)
            if item.text
        ]
        if parts:
            return _brief_text(" ".join(parts), max_sentences=2, max_chars=220)
    return _brief_text(text or "", max_sentences=2, max_chars=220)


def _parse_summary_tips(raw: Any, fallback: list[RecommendationItem] | None = None) -> list[str]:
    tips: list[str] = []
    if isinstance(raw, list):
        for entry in raw:
            text = _coerce_text(entry if isinstance(entry, str) else None)
            if not text:
                continue
            if any(_is_similar_text(text, existing) for existing in tips):
                continue
            tips.append(text)
    if not tips and fallback:
        tips = [
            item.text
            for item in _dedupe_recommendations(_filter_improvements_only(fallback), limit=4)
            if item.text
        ]
    return _filter_summary_tips(tips)[:4]


def _coerce_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _extract_field(entry: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        val = _coerce_text(entry.get(key))
        if val:
            return val
    return None


def _parse_recommendations(raw: Any, include_justifications: bool = True) -> list[RecommendationItem]:
    if not isinstance(raw, list):
        return []
    items: list[RecommendationItem] = []
    for entry in raw:
        if isinstance(entry, str) and entry.strip():
            items.append(RecommendationItem(text=entry.strip()))
        elif isinstance(entry, dict):
            text = _extract_field(entry, "text", "recommendation", "suggestion", "tip")
            if not text:
                continue
            justification = _extract_field(
                entry, "justification", "reason", "why", "explanation", "rationale"
            )
            evidence = _extract_field(entry, "evidence", "proof", "reference", "source")
            items.append(
                RecommendationItem(
                    text=text,
                    justification=justification if include_justifications else None,
                    evidence=evidence if include_justifications else None,
                    priority=str(entry.get("priority") or "medium").lower(),
                )
            )
    return items[:10]


def _dedupe_parsed_recommendations(
    items: list[RecommendationItem],
    limit: int = 8,
) -> list[RecommendationItem]:
    return _dedupe_recommendations(_filter_improvements_only(items), limit=limit)


def _needs_llm_justifications(items: list[RecommendationItem]) -> bool:
    return any(
        not _coerce_text(item.justification) or not _coerce_text(item.evidence)
        for item in items
        if item.text
    )


def _merge_justified_items(
    original: list[RecommendationItem],
    justified: list[RecommendationItem],
) -> list[RecommendationItem]:
    by_text: dict[str, RecommendationItem] = {}
    for entry in justified:
        if entry.text:
            by_text[entry.text.strip().lower()] = entry

    merged: list[RecommendationItem] = []
    for item in original:
        match = by_text.get(item.text.strip().lower())
        merged.append(
            RecommendationItem(
                text=item.text,
                justification=_coerce_text(match.justification if match else None)
                or _coerce_text(item.justification),
                evidence=_coerce_text(match.evidence if match else None)
                or _coerce_text(item.evidence),
                priority=item.priority or (match.priority if match else "medium"),
            )
        )

    if _needs_llm_justifications(merged) and len(justified) == len(original):
        merged = []
        for index, item in enumerate(original):
            match = justified[index]
            merged.append(
                RecommendationItem(
                    text=item.text,
                    justification=_coerce_text(match.justification)
                    or _coerce_text(item.justification),
                    evidence=_coerce_text(match.evidence) or _coerce_text(item.evidence),
                    priority=item.priority or match.priority or "medium",
                )
            )
    return merged


def _justify_recommendations_llm(
    items: list[RecommendationItem],
    role_title: str,
    role_context: RoleContext | None,
    source_material: str,
    source_label: str,
) -> list[RecommendationItem] | None:
    if not items or not source_material.strip() or not llm_service.is_llm_enabled():
        return None

    role_block = _format_role_context(role_context, role_title)
    recs_payload = [
        {"index": index + 1, "text": item.text, "priority": item.priority or "medium"}
        for index, item in enumerate(items)
        if item.text
    ]
    if not recs_payload:
        return None

    prompt = f"""You are a senior hiring manager with deep knowledge of the {role_title} role.

Write a SPECIFIC justification and evidence for EACH recommendation below using ONLY details from the {source_label} content.

Rules (strict):
- justification: 1-2 sentences on why this matters for {role_title} — must NOT repeat or rephrase the recommendation text.
- evidence: cite one concrete detail from the {source_label} not already in the recommendation text.
- Copy each recommendation "text" field verbatim from the input.
- Return exactly {len(recs_payload)} items in the same order.

Return JSON: {{ "recommendations": [{{ "text": "...", "priority": "high|medium|low", "justification": "...", "evidence": "..." }}] }}

{role_block}

Recommendations:
{json.dumps(recs_payload, ensure_ascii=False)}

{source_label} content:
{source_material[:12000]}"""

    data = llm_service.generate_json(
        prompt,
        system=(
            "Produce role-specific, evidence-based career feedback grounded in the source material. "
            "Never use template or generic justification language."
        ),
    )
    if not isinstance(data, dict):
        logger.warning("LLM justification pass returned no JSON for %s", source_label)
        return None

    justified = _parse_recommendations(data.get("recommendations"), include_justifications=True)
    if not justified:
        return None

    merged = _merge_justified_items(items, justified)
    if any(_coerce_text(entry.justification) for entry in merged):
        return merged
    return None


def _finalize_recommendations(
    items: list[RecommendationItem],
    role_title: str,
    source_label: str,
    include_justifications: bool,
    role_context: RoleContext | None = None,
    source_material: str = "",
) -> list[RecommendationItem]:
    parsed = items[:10]
    if not include_justifications:
        return parsed

    if _needs_llm_justifications(parsed) and source_material.strip() and llm_service.is_llm_enabled():
        llm_result = _justify_recommendations_llm(
            parsed, role_title, role_context, source_material, source_label
        )
        if llm_result:
            return llm_result

    return parsed


def _format_github_source(request: GitHubAnalyzeRequest) -> str:
    lines = [f"Portfolio stats: {json.dumps(request.portfolio_stats)[:2000]}"]
    for repo in request.repos[:25]:
        lines.append(
            f"Repo: {repo.name} | language={repo.language} | stars={repo.stars} | "
            f"readme={repo.has_readme} | topics={repo.topics} | "
            f"description={repo.description} | updated={repo.updated_at}"
        )
    return "\n".join(lines)


def _recommendation_texts(items: list[RecommendationItem]) -> list[str]:
    return [item.text for item in items if item.text]


def _extract_skills(text: str) -> list[str]:
    lower = text.lower()
    found = [skill for skill in _COMMON_SKILLS if skill in lower]
    for token in re.findall(r"\b[A-Z][a-zA-Z+#.]+\b", text):
        if len(token) > 2 and token.lower() not in {s.lower() for s in found}:
            found.append(token)
    return found[:15]


def _extract_contact(text: str, pattern: str) -> str | None:
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(0) if match else None


def _section_present(text: str, keywords: list[str]) -> bool:
    lower = text.lower()
    return any(keyword in lower for keyword in keywords)


def enrich_cv(request: CvEnrichRequest) -> CvEnrichResponse:
    _require_llm("CV analysis")
    return _require_ai_result(_enrich_cv_gemini(request), "CV analysis")


def _enrich_cv_gemini(request: CvEnrichRequest) -> CvEnrichResponse | None:
    role_title = _role_title(request.target_role, request.role_context)
    role_block = _format_role_context(request.role_context, role_title)
    justification_clause = _justification_clause(request.include_justifications)
    try:
        data = _call_enrich_cv_llm(request, role_block, justification_clause, role_title)
    except LLMRequestError:
        raise
    except Exception as exc:
        raise AIServiceError(
            f"CV analysis failed: {exc}",
            feature="CV analysis",
        ) from exc
    if not isinstance(data, dict):
        return None
    recommendations = _finalize_recommendations(
        _dedupe_parsed_recommendations(
            _parse_recommendations(
                data.get("recommendations") or data.get("suggestions"),
                request.include_justifications,
            )
        ),
        role_title,
        "CV",
        request.include_justifications,
        request.role_context,
        request.cv_text or "",
    )
    summary_text = _parse_summary_text(data, recommendations)
    role_fit_summary = _brief_text(
        str(data.get("roleFitSummary") or data.get("role_fit_summary") or ""),
        max_sentences=1,
        max_chars=140,
    )
    report_summary = _parse_report_summary(
        data,
        recommendations,
        role_fit_summary=role_fit_summary,
        summary_text=summary_text,
    )
    keyword_notes = _parse_keyword_notes(data, request.include_justifications)
    matched = data.get("matched") or []
    missing = data.get("missing") or []
    if not isinstance(matched, list):
        matched = []
    if not isinstance(missing, list):
        missing = []
    return CvEnrichResponse(
        parsedData=data.get("parsedData") or data.get("parsed_data") or {},
        suggestions=[summary_text] if summary_text else _recommendation_texts(recommendations[:4]),
        recommendations=recommendations,
        summaryTips=[],
        summaryText=summary_text,
        reportSummary=report_summary,
        completenessScore=_round_score(float(data.get("completenessScore", data.get("completeness_score", 70)))),
        roleFitScore=_round_score(float(data.get("roleFitScore", data.get("role_fit_score", 60)))),
        roleFitSummary=role_fit_summary,
        keywordScore=_round_score(float(data.get("keywordScore", data.get("keyword_score", 50)))),
        matched=[str(item) for item in matched if item],
        missing=[str(item) for item in missing if item],
        keywordNotes=keyword_notes,
    )


def _call_enrich_cv_llm(
    request: CvEnrichRequest,
    role_block: str,
    justification_clause: str,
    role_title: str,
) -> dict[str, Any] | list[Any] | None:
    required_keywords = _required_keywords(request.role_context)
    keywords_clause = (
        f"Required ATS keywords to evaluate: {json.dumps(required_keywords)}"
        if required_keywords
        else "Infer important ATS keywords from the target role."
    )
    prompt = f"""You are an expert career advisor. Analyze this CV specifically for the candidate's target role.
{role_block}

Focus on role fit and the highest-impact improvements for this role.
Return JSON with keys:
- parsedData: object with name, email, phone, skills (deduplicated array, max 20), experience (max 5 short lines), education (max 5 short lines)
- summaryText: 1-2 short sentences on the biggest improvements (details go in recommendations)
- reportSummary: descriptive paragraph for the full report (see rules below)
- recommendations: array of objects with text (string), priority (high|medium|low), justification (string or null), evidence (string or null)
- completenessScore: number 0-100
- roleFitScore: number 0-100 measuring alignment with the target role
- roleFitSummary: one brief sentence on overall role fit
- keywordScore: number 0-100 for ATS keyword match against the role
- matched: array of role keywords/skills found in the CV
- missing: array of important missing role keywords/skills
- keywordNotes: at most 3 objects (text, priority, justification, evidence) for keyword gaps only — must not duplicate recommendations

{keywords_clause}

{_role_fit_summary_clause()}
{_summary_text_clause()}
{_report_summary_clause()}
{_recommendations_clause()}
{_improvements_only_clause()}
{justification_clause}

CV:
{request.cv_text[:12000]}"""
    return llm_service.generate_json(
        prompt,
        system=(
            "Give role-aware CV feedback in one JSON response including ATS keyword match. "
            "List only actionable improvements and gaps — never praise. "
            "roleFitSummary is one brief sentence; summaryText is a 1-2 sentence teaser; "
            "reportSummary is the detailed narrative for the full report; "
            "recommendations hold itemized actionable improvements."
        ),
    )


def _enrich_cv_fallback(request: CvEnrichRequest) -> CvEnrichResponse:
    text = request.cv_text or ""
    skills = _extract_skills(text)
    parsed_data: dict[str, Any] = {
        "name": _extract_name(text),
        "email": _extract_contact(text, r"[\w.+-]+@[\w-]+\.[\w.-]+"),
        "phone": _extract_contact(text, r"\+?\d[\d\s().-]{7,}\d"),
        "skills": skills,
        "experience": _extract_bullet_lines(text, ["experience", "work", "employment"]),
        "education": _extract_bullet_lines(text, ["education", "degree", "university", "college"]),
        "targetRole": request.target_role,
    }

    sections = {
        "contact": bool(parsed_data["email"] or parsed_data["phone"]),
        "skills": len(skills) >= 3,
        "experience": len(parsed_data["experience"]) >= 1 or _section_present(text, ["experience", "intern", "work"]),
        "education": len(parsed_data["education"]) >= 1 or _section_present(text, ["education", "bachelor", "degree"]),
        "summary": _section_present(text, ["summary", "objective", "profile"]),
    }
    completeness = sum(20 for present in sections.values() if present)
    if len(text.strip()) > 500:
        completeness = min(100, completeness + 10)

    suggestions: list[str] = []
    if not sections["contact"]:
        suggestions.append("Add a professional email and phone number at the top of your CV.")
    if not sections["skills"]:
        suggestions.append(f"Add a skills section with keywords relevant to {request.target_role}.")
    if not sections["experience"]:
        suggestions.append("Include relevant work experience, projects, or volunteer work.")
    if not sections["education"]:
        suggestions.append("Add your degree, institution, and expected graduation date.")
    if not sections["summary"]:
        suggestions.append("Add a 2–3 line professional summary tailored to your target role.")
    if len(skills) < 5:
        suggestions.append("List at least 5 technical and soft skills mentioned in the job description.")
    suggestions.append(f"Tailor bullet points to emphasize fit for {request.target_role}.")
    recommendations = _finalize_recommendations(
        [
            RecommendationItem(text=s, priority="medium")
            for s in suggestions[:8]
        ],
        request.target_role,
        "CV",
        request.include_justifications,
        request.role_context,
        text,
    )

    return CvEnrichResponse(
        parsedData=parsed_data,
        suggestions=_recommendation_texts(recommendations),
        recommendations=recommendations,
        completenessScore=_round_score(float(completeness)),
        roleFitScore=_round_score(float(completeness * 0.85)),
        roleFitSummary=f"Rule-based review for {request.target_role}. Configure an AI provider for deeper role-fit analysis.",
    )


def _extract_name(text: str) -> str | None:
    for line in text.splitlines()[:5]:
        stripped = line.strip()
        if stripped and len(stripped.split()) <= 4 and not re.search(r"[@\d]", stripped):
            return stripped
    return None


def _extract_bullet_lines(text: str, section_hints: list[str]) -> list[str]:
    lines = [line.strip("•-* \t") for line in text.splitlines() if line.strip()]
    bullets = [line for line in lines if line.startswith(("•", "-", "*")) or re.match(r"^\d+\.", line)]
    if bullets:
        return [re.sub(r"^[\d•\-*.\s]+", "", b).strip() for b in bullets[:6]]
    lower = text.lower()
    if any(hint in lower for hint in section_hints):
        return [line for line in lines if 20 < len(line) < 200][:4]
    return []


def match_ats_keywords(request: AtsKeywordRequest) -> AtsKeywordResponse:
    _require_llm("ATS keyword analysis")
    return _require_ai_result(_ats_keywords_gemini(request), "ATS keyword analysis")


def _ats_keywords_gemini(request: AtsKeywordRequest) -> AtsKeywordResponse | None:
    role_block = _format_role_context(request.role_context, request.job_description or "target role")
    justification_clause = _justification_clause(request.include_justifications)
    prompt = f"""Score CV keyword match for ATS systems and the target role.
{role_block}

Return JSON with:
- keywordScore (0-100)
- matched (array of matched keywords/skills)
- missing (array of important missing keywords/skills for this role)
- keywordNotes (array of at most 3 objects with text, priority, justification, evidence) — actionable gaps ONLY, never praise

Required keywords: {json.dumps(request.required_keywords)}

{justification_clause}

CV:
{request.cv_text[:12000]}"""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    matched = data.get("matched") or []
    missing = data.get("missing") or []
    role_title = request.role_context.title if request.role_context else request.job_description
    keyword_notes = _finalize_recommendations(
        _dedupe_parsed_recommendations(
            _parse_recommendations(data.get("keywordNotes"), request.include_justifications),
            limit=3,
        ),
        role_title or "target role",
        "ATS keyword",
        request.include_justifications,
        request.role_context,
        request.cv_text or "",
    )
    return AtsKeywordResponse(
        keywordScore=_round_score(float(data.get("keywordScore", data.get("keyword_score", 50)))),
        matched=matched,
        missing=missing,
        keywordNotes=keyword_notes,
    )


def _ats_keywords_fallback(request: AtsKeywordRequest) -> AtsKeywordResponse:
    cv_lower = (request.cv_text or "").lower()
    job_lower = (request.job_description or "").lower()
    corpus = f"{cv_lower} {job_lower}"
    matched: list[str] = []
    missing: list[str] = []
    for keyword in request.required_keywords or []:
        kw = keyword.strip()
        if not kw:
            continue
        if kw.lower() in corpus:
            matched.append(kw)
        else:
            missing.append(kw)
    total = len(request.required_keywords or [])
    score = 100.0 if total == 0 else _round_score(len(matched) / total * 100)
    role_title = request.role_context.title if request.role_context else "your target role"
    keyword_notes = _finalize_recommendations(
        [
            RecommendationItem(
                text=f"Add '{kw}' to your CV — it is required for {role_title} roles.",
                priority="high",
            )
            for kw in missing[:6]
        ],
        role_title,
        "ATS keyword",
        request.include_justifications,
        request.role_context,
        request.cv_text or "",
    )
    return AtsKeywordResponse(keywordScore=score, matched=matched, missing=missing, keywordNotes=keyword_notes)


def generate_questions(request: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    _require_llm("interview question generation")
    return _require_ai_result(_questions_gemini(request), "interview question generation")


def _questions_gemini(request: GenerateQuestionsRequest) -> GenerateQuestionsResponse | None:
    prompt = f"""Generate {request.count} mock interview questions.
Return JSON: {{ "questions": [{{ "text": "...", "type": "BEHAVIORAL|TECHNICAL|MIXED" }}] }}

Target role: {request.target_role}
Interview type: {request.interview_type}
Difficulty: {request.difficulty}
Profile: {request.profile_summary[:2000]}"""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    items = []
    for q in data.get("questions") or []:
        if isinstance(q, dict) and q.get("text"):
            items.append(QuestionItem(text=q["text"], type=q.get("type") or request.interview_type))
    if not items:
        return None
    return GenerateQuestionsResponse(questions=items[: request.count])


def _questions_fallback(request: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    pool: list[tuple[str, str]] = []
    interview_type = (request.interview_type or "MIXED").upper()
    if interview_type == "BEHAVIORAL":
        pool = [(q, "BEHAVIORAL") for q in _BEHAVIORAL_QUESTIONS]
    elif interview_type == "TECHNICAL":
        pool = [(q, "TECHNICAL") for q in _TECHNICAL_QUESTIONS]
    else:
        pool = [(q.format(role=request.target_role), "MIXED") for q in _MIXED_QUESTIONS]

    difficulty_prefix = {
        "EASY": "",
        "MEDIUM": "",
        "HARD": "Advanced: ",
    }.get((request.difficulty or "MEDIUM").upper(), "")

    questions = [
        QuestionItem(text=f"{difficulty_prefix}{text}", type=qtype)
        for text, qtype in pool[: request.count]
    ]
    while len(questions) < request.count:
        questions.append(
            QuestionItem(
                text=f"Why are you a good fit for {request.target_role}?",
                type="BEHAVIORAL",
            )
        )
    return GenerateQuestionsResponse(questions=questions[: request.count])


def evaluate_answer(request: EvaluateAnswerRequest) -> EvaluateAnswerResponse:
    _require_llm("answer evaluation")
    return _require_ai_result(_evaluate_gemini(request), "answer evaluation")


def _evaluate_gemini(request: EvaluateAnswerRequest) -> EvaluateAnswerResponse | None:
    prompt = f"""Evaluate this interview answer for a {request.target_role} candidate.
Return JSON with score (0-100) and feedback object with keys: strengths (array), improvements (array), comment (string).

Question ({request.question_type}): {request.question}
Answer: {request.answer[:4000]}"""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    return EvaluateAnswerResponse(
        score=_round_score(float(data.get("score", 60))),
        feedback=data.get("feedback") if isinstance(data.get("feedback"), dict) else {"comment": str(data.get("feedback", ""))},
    )


def _evaluate_fallback(request: EvaluateAnswerRequest) -> EvaluateAnswerResponse:
    answer = (request.answer or "").strip()
    words = answer.split()
    score = 40.0
    strengths: list[str] = []
    improvements: list[str] = []

    if len(words) >= 30:
        score += 15
        strengths.append("Answer has reasonable depth.")
    elif len(words) < 10:
        improvements.append("Expand your answer with more detail and examples.")

    star_keywords = ["situation", "task", "action", "result", "because", "learned", "impact"]
    if (request.question_type or "").upper() == "BEHAVIORAL":
        if any(kw in answer.lower() for kw in star_keywords):
            score += 20
            strengths.append("Uses situational structure (STAR-like).")
        else:
            improvements.append("Structure behavioral answers using Situation, Task, Action, Result.")

    if request.target_role and request.target_role.lower() in answer.lower():
        score += 10
        strengths.append("Connects answer to the target role.")

    if re.search(r"\b(I|my|we)\b", answer, re.IGNORECASE):
        score += 5

    feedback: dict[str, Any] = {
        "strengths": strengths or ["Answer recorded for review."],
        "improvements": improvements or ["Add a concrete example with measurable outcome."],
        "comment": "Rule-based evaluation — configure an AI provider in .env for AI feedback.",
    }
    return EvaluateAnswerResponse(score=_round_score(score), feedback=feedback)


def summarize_interview(request: SummarizeInterviewRequest) -> SummarizeInterviewResponse:
    _require_llm("interview summary")
    return _require_ai_result(_summarize_gemini(request), "interview summary")


def _summarize_gemini(request: SummarizeInterviewRequest) -> SummarizeInterviewResponse | None:
    prompt = f"""Summarize this mock interview for {request.target_role}.
Return JSON with overallScore (0-100), summary (string), tips (array of strings).

Q&A pairs: {json.dumps(request.qa_pairs)[:8000]}"""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    return SummarizeInterviewResponse(
        overallScore=_round_score(float(data.get("overallScore", data.get("overall_score", 60)))),
        summary=data.get("summary") or "Interview session summarized.",
        tips=data.get("tips") or [],
    )


def _summarize_fallback(request: SummarizeInterviewRequest) -> SummarizeInterviewResponse:
    scores: list[float] = []
    for pair in request.qa_pairs or []:
        for key in ("score", "answerScore", "evaluationScore"):
            val = pair.get(key)
            if isinstance(val, (int, float)):
                scores.append(float(val))
                break

    overall = _round_score(sum(scores) / len(scores) if scores else 65.0)
    answered = sum(1 for p in request.qa_pairs or [] if (p.get("answer") or "").strip())
    total = len(request.qa_pairs or [])

    summary = (
        f"Completed {answered}/{total} questions for {request.target_role}. "
        f"Average answer quality score: {overall}/100. "
        "Focus on structured responses and role-specific examples."
    )
    tips = [
        "Use the STAR method for behavioral questions.",
        "Quantify impact where possible (metrics, timelines, outcomes).",
        f"Research common {request.target_role} interview topics before your next session.",
    ]
    if overall < 70:
        tips.insert(0, "Practice shorter, clearer opening statements for each answer.")
    return SummarizeInterviewResponse(overallScore=overall, summary=summary, tips=tips)


def generate_roadmap(request: GenerateRoadmapRequest) -> GenerateRoadmapResponse:
    _require_llm("roadmap generation")
    return _require_ai_result(_roadmap_gemini(request), "roadmap generation")


def _roadmap_gemini(request: GenerateRoadmapRequest) -> GenerateRoadmapResponse | None:
    prompt = f"""Create a learning roadmap for {request.target_role}.
Return JSON: {{ "items": [{{ "itemType": "LEARN|PROJECT|INTERVIEW|VERIFY", "title": "...", "description": "...", "resources": [{{"title":"...","url":"..."}}], "skillName": "..." }}] }}

Skill gaps: {request.skill_gaps}
Weak areas: {request.weak_areas}"""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    items = []
    for item in data.get("items") or []:
        if isinstance(item, dict) and item.get("title"):
            items.append(
                RoadmapItemDto(
                    itemType=item.get("itemType") or item.get("item_type") or "LEARN",
                    title=item["title"],
                    description=item.get("description") or "",
                    resources=item.get("resources") or [],
                    skillName=item.get("skillName") or item.get("skill_name"),
                )
            )
    if not items:
        return None
    return GenerateRoadmapResponse(items=items)


def _roadmap_fallback(request: GenerateRoadmapRequest) -> GenerateRoadmapResponse:
    gaps = request.skill_gaps or ["core technical skills"]
    items: list[RoadmapItemDto] = []

    for skill in gaps[:5]:
        items.append(
            RoadmapItemDto(
                itemType="LEARN",
                title=f"Build fundamentals in {skill}",
                description=f"Study core concepts of {skill} relevant to {request.target_role}.",
                resources=[
                    {"title": f"{skill} official documentation", "url": "https://developer.mozilla.org/"},
                    {"title": f"Free {skill} course", "url": "https://www.freecodecamp.org/"},
                ],
                skillName=skill,
            )
        )
        items.append(
            RoadmapItemDto(
                itemType="PROJECT",
                title=f"Apply {skill} in a portfolio project",
                description=f"Build a small project demonstrating {skill} for your {request.target_role} portfolio.",
                resources=[{"title": "Project ideas", "url": "https://github.com/"}],
                skillName=skill,
            )
        )

    items.append(
        RoadmapItemDto(
            itemType="INTERVIEW",
            title=f"Practice {request.target_role} interview questions",
            description="Complete mock interviews covering behavioral and technical topics.",
            resources=[{"title": "CareerSucceX mock interviews", "url": "/interview"}],
            skillName=None,
        )
    )
    items.append(
        RoadmapItemDto(
            itemType="VERIFY",
            title="Verify top skills with quizzes",
            description="Pass skill verification quizzes to boost your readiness score.",
            resources=[],
            skillName=gaps[0] if gaps else None,
        )
    )

    if request.weak_areas:
        items.insert(
            0,
            RoadmapItemDto(
                itemType="LEARN",
                title=f"Address weak area: {request.weak_areas[:80]}",
                description="Dedicated study plan for your identified weak area.",
                resources=[{"title": "Study guide", "url": "https://roadmap.sh/"}],
                skillName=None,
            ),
        )

    return GenerateRoadmapResponse(items=items)


def generate_quiz(request: GenerateQuizRequest) -> GenerateQuizResponse:
    _require_llm("quiz generation")
    return _require_ai_result(_quiz_gemini(request), "quiz generation")


def _quiz_gemini(request: GenerateQuizRequest) -> GenerateQuizResponse | None:
    prompt = f"""Generate {request.question_count} MCQ quiz questions to verify {request.skill_name} skill.
Return JSON: {{ "questions": [{{ "id": "1", "type": "MCQ", "question": "...", "options": ["A","B","C","D"], "correctIndex": 0 }}] }}
Include correctIndex in each question for grading (backend stores full payload)."""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    questions = []
    for idx, q in enumerate(data.get("questions") or [], start=1):
        if isinstance(q, dict) and q.get("question"):
            questions.append(
                QuizQuestion(
                    id=str(q.get("id") or idx),
                    type=q.get("type") or "MCQ",
                    question=q["question"],
                    options=q.get("options") or [],
                )
            )
    if not questions:
        return None
    return GenerateQuizResponse(questions=questions[: request.question_count])


def _quiz_fallback(request: GenerateQuizRequest) -> GenerateQuizResponse:
    skill = request.skill_name or "General"
    templates = [
        f"What is a fundamental concept in {skill}?",
        f"Which best describes a common use case for {skill}?",
        f"What is a best practice when working with {skill}?",
        f"Which tool or pattern is commonly associated with {skill}?",
        f"How would you explain {skill} to a beginner?",
    ]
    questions: list[QuizQuestion] = []
    for i in range(request.question_count):
        template = templates[i % len(templates)]
        questions.append(
            QuizQuestion(
                id=str(i + 1),
                type="MCQ",
                question=template,
                options=[
                    f"Core principle of {skill}",
                    f"Unrelated concept",
                    f"Deprecated approach in {skill}",
                    f"Misconception about {skill}",
                ],
            )
        )
    return GenerateQuizResponse(questions=questions)


def grade_quiz(request: GradeQuizRequest) -> GradeQuizResponse:
    _require_llm("quiz grading")
    return _require_ai_result(_grade_gemini(request), "quiz grading")


def _grade_gemini(request: GradeQuizRequest) -> GradeQuizResponse | None:
    prompt = f"""Grade this {request.skill_name} skill verification quiz.
Return JSON with score (0-100), passed (boolean, pass if score >= 70), feedback object with perQuestion (array) and comment (string).

Questions: {json.dumps(request.questions)[:6000]}
Answers: {json.dumps(request.answers)[:6000]}"""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    score = _round_score(float(data.get("score", 0)))
    passed = bool(data.get("passed", score >= 70))
    feedback = data.get("feedback") if isinstance(data.get("feedback"), dict) else {"comment": "Graded by AI."}
    return GradeQuizResponse(score=score, passed=passed, feedback=feedback)


def _grade_fallback(request: GradeQuizRequest) -> GradeQuizResponse:
    answer_by_id = {
        str(a.get("questionId") or a.get("id") or ""): a
        for a in request.answers or []
        if isinstance(a, dict)
    }
    correct = 0
    total = len(request.questions or [])
    per_question: list[dict[str, Any]] = []

    for q in request.questions or []:
        qid = str(q.get("id") or "")
        answer = answer_by_id.get(qid, {})
        selected = answer.get("selectedIndex", answer.get("selectedOption", answer.get("answer")))
        correct_index = q.get("correctIndex", q.get("correct_index"))
        correct_answer = q.get("correctAnswer", q.get("correct_answer"))

        is_correct = False
        if correct_index is not None and selected is not None:
            try:
                is_correct = int(selected) == int(correct_index)
            except (TypeError, ValueError):
                is_correct = str(selected).strip().lower() == str(correct_index).strip().lower()
        elif correct_answer is not None and selected is not None:
            is_correct = str(selected).strip().lower() == str(correct_answer).strip().lower()
        elif q.get("type") == "MCQ" and selected is not None:
            is_correct = int(selected) == 0

        if is_correct:
            correct += 1
        per_question.append({"questionId": qid, "correct": is_correct})

    score = _round_score(correct / total * 100 if total else 0)
    passed = score >= 70
    feedback: dict[str, Any] = {
        "comment": f"Scored {correct}/{total} correct on {request.skill_name} verification.",
        "perQuestion": per_question,
        "correctCount": correct,
        "totalCount": total,
    }
    return GradeQuizResponse(score=score, passed=passed, feedback=feedback)


def analyze_github(request: GitHubAnalyzeRequest) -> GitHubAnalyzeResponse:
    _require_llm("GitHub portfolio analysis")
    return _require_ai_result(_analyze_github_gemini(request), "GitHub portfolio analysis")


def _analyze_github_gemini(request: GitHubAnalyzeRequest) -> GitHubAnalyzeResponse | None:
    role_block = _format_role_context(request.role_context, request.role_context.title)
    justification_clause = _justification_clause(request.include_justifications)
    repo_payload = [
        {
            "name": r.name,
            "description": r.description,
            "language": r.language,
            "stars": r.stars,
            "topics": r.topics,
            "hasReadme": r.has_readme,
            "updatedAt": r.updated_at,
        }
        for r in request.repos[:25]
    ]
    prompt = f"""You are a technical recruiter reviewing a GitHub portfolio for a specific target role.
{role_block}

Portfolio stats: {json.dumps(request.portfolio_stats)[:2000]}
Repositories: {json.dumps(repo_payload)[:8000]}

Evaluate how well this GitHub portfolio supports the target role. Consider project relevance, tech stack alignment, documentation, and activity.
Return JSON with:
- summaryText: 1-2 short sentences on the biggest improvements (details go in recommendations)
- reportSummary: descriptive paragraph for the full report (see rules below)
- recommendations: array of objects with text, priority (high|medium|low), justification, evidence (repo name or detail)
- roleAlignmentScore: number 0-100
- roleAlignmentSummary: one brief sentence on portfolio-role alignment

{_role_alignment_summary_clause()}
{_summary_text_clause()}
{_report_summary_clause()}
{_recommendations_clause()}
{_improvements_only_clause()}
{justification_clause}"""
    data = llm_service.generate_json(
        prompt,
        system=(
            "Give practical, role-specific GitHub portfolio advice. "
            "List only actionable improvements — never praise existing repos or skills. "
            "roleAlignmentSummary is one brief sentence; summaryText is a 1-2 sentence teaser; "
            "reportSummary is the detailed narrative for the full report; "
            "recommendations hold itemized actionable improvements."
        ),
    )
    if not isinstance(data, dict):
        return None
    recommendations = _finalize_recommendations(
        _dedupe_parsed_recommendations(
            _parse_recommendations(data.get("recommendations"), request.include_justifications),
        ),
        request.role_context.title,
        "GitHub portfolio",
        request.include_justifications,
        request.role_context,
        _format_github_source(request),
    )
    if not recommendations:
        return None
    summary_text = _parse_summary_text(data, recommendations)
    role_alignment_summary = _brief_text(
        str(data.get("roleAlignmentSummary") or data.get("role_alignment_summary") or ""),
        max_sentences=1,
        max_chars=140,
    )
    report_summary = _parse_report_summary(
        data,
        recommendations,
        role_fit_summary=role_alignment_summary,
        summary_text=summary_text,
    )
    return GitHubAnalyzeResponse(
        recommendations=recommendations,
        summaryTips=[],
        summaryText=summary_text,
        reportSummary=report_summary,
        roleAlignmentScore=_round_score(float(data.get("roleAlignmentScore", data.get("role_alignment_score", 60)))),
        roleAlignmentSummary=role_alignment_summary,
    )


def _analyze_github_fallback(request: GitHubAnalyzeRequest) -> GitHubAnalyzeResponse:
    role_title = request.role_context.title
    stats = request.portfolio_stats or {}
    repo_count = int(stats.get("repoCount") or stats.get("count") or len(request.repos))
    languages = stats.get("languages") or []
    if isinstance(languages, dict):
        languages = list(languages.keys())
    recommendations: list[RecommendationItem] = []

    if repo_count < 3:
        recommendations.append(
            RecommendationItem(
                text=f"Add more original projects that demonstrate skills for {role_title}",
                priority="high",
            )
        )
    if int(stats.get("readmeScore") or 0) < 50:
        recommendations.append(
            RecommendationItem(
                text="Add detailed README files explaining problem, approach, and tech stack",
                priority="high",
            )
        )
    if len(languages) < 2:
        recommendations.append(
            RecommendationItem(
                text=f"Showcase projects using technologies relevant to {role_title}",
                priority="medium",
            )
        )
    if not recommendations:
        recommendations.append(
            RecommendationItem(
                text=f"Highlight your strongest repositories on your CV for {role_title} applications",
                priority="low",
            )
        )

    alignment = min(100, repo_count * 15 + len(languages) * 10)
    return GitHubAnalyzeResponse(
        recommendations=_finalize_recommendations(
            recommendations,
            role_title,
            "GitHub portfolio",
            request.include_justifications,
            request.role_context,
            _format_github_source(request),
        ),
        roleAlignmentScore=_round_score(float(alignment)),
        roleAlignmentSummary=f"Rule-based GitHub review for {role_title}. Configure an AI provider for deeper role alignment.",
    )
