import json
import logging
import re
from typing import Any

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
    GradeQuizRequest,
    GradeQuizResponse,
    QuestionItem,
    QuizQuestion,
    RoadmapItemDto,
    SummarizeInterviewRequest,
    SummarizeInterviewResponse,
)
from app.services import llm as llm_service

logger = logging.getLogger(__name__)

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
    if llm_service.is_llm_enabled():
        result = _enrich_cv_gemini(request)
        if result:
            return result
    return _enrich_cv_fallback(request)


def _enrich_cv_gemini(request: CvEnrichRequest) -> CvEnrichResponse | None:
    prompt = f"""Analyze this CV for a {request.target_role} role.
Return JSON with keys:
- parsedData: object with name, email, phone, skills (array of strings), experience (array of strings), education (array of strings)
- suggestions: array of actionable improvement strings
- completenessScore: number 0-100

CV:
{request.cv_text[:12000]}"""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    return CvEnrichResponse(
        parsedData=data.get("parsedData") or data.get("parsed_data") or {},
        suggestions=data.get("suggestions") or [],
        completenessScore=_round_score(float(data.get("completenessScore", data.get("completeness_score", 70)))),
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

    return CvEnrichResponse(
        parsedData=parsed_data,
        suggestions=suggestions[:8],
        completenessScore=_round_score(float(completeness)),
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
    if llm_service.is_llm_enabled():
        result = _ats_keywords_gemini(request)
        if result:
            return result
    return _ats_keywords_fallback(request)


def _ats_keywords_gemini(request: AtsKeywordRequest) -> AtsKeywordResponse | None:
    prompt = f"""Score CV keyword match for ATS.
Return JSON with keywordScore (0-100), matched (array), missing (array).

Target role / job description: {request.job_description}
Required keywords: {json.dumps(request.required_keywords)}

CV:
{request.cv_text[:12000]}"""
    data = llm_service.generate_json(prompt)
    if not isinstance(data, dict):
        return None
    matched = data.get("matched") or []
    missing = data.get("missing") or []
    return AtsKeywordResponse(
        keywordScore=_round_score(float(data.get("keywordScore", data.get("keyword_score", 50)))),
        matched=matched,
        missing=missing,
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
    return AtsKeywordResponse(keywordScore=score, matched=matched, missing=missing)


def generate_questions(request: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    if llm_service.is_llm_enabled():
        result = _questions_gemini(request)
        if result:
            return result
    return _questions_fallback(request)


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
    if llm_service.is_llm_enabled():
        result = _evaluate_gemini(request)
        if result:
            return result
    return _evaluate_fallback(request)


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
    if llm_service.is_llm_enabled():
        result = _summarize_gemini(request)
        if result:
            return result
    return _summarize_fallback(request)


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
    if llm_service.is_llm_enabled():
        result = _roadmap_gemini(request)
        if result:
            return result
    return _roadmap_fallback(request)


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
    if llm_service.is_llm_enabled():
        result = _quiz_gemini(request)
        if result:
            return result
    return _quiz_fallback(request)


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
    if llm_service.is_llm_enabled():
        result = _grade_gemini(request)
        if result:
            return result
    return _grade_fallback(request)


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
