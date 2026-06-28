from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


# --- Shared ---


class RoleSkillRequirement(CamelModel):
    skill_name: str = Field(alias="skillName")
    min_level: int = Field(default=1, alias="minLevel")
    weight: float = Field(default=1.0)


class RoleContext(CamelModel):
    title: str
    industry: str = ""
    description: str = ""
    required_skills: list[RoleSkillRequirement] = Field(default_factory=list, alias="requiredSkills")


class RecommendationItem(CamelModel):
    text: str
    justification: str | None = None
    evidence: str | None = None
    priority: str = "medium"


# --- CV ---


class CvEnrichRequest(CamelModel):
    cv_text: str = Field(alias="cvText")
    target_role: str = Field(alias="targetRole")
    role_context: RoleContext | None = Field(default=None, alias="roleContext")
    include_justifications: bool = Field(default=True, alias="includeJustifications")


class CvEnrichResponse(CamelModel):
    parsed_data: dict[str, Any] = Field(default_factory=dict, alias="parsedData")
    suggestions: list[str] = Field(default_factory=list)
    recommendations: list[RecommendationItem] = Field(default_factory=list)
    summary_tips: list[str] = Field(default_factory=list, alias="summaryTips")
    summary_text: str = Field(default="", alias="summaryText")
    report_summary: str = Field(default="", alias="reportSummary")
    completeness_score: float = Field(alias="completenessScore")
    role_fit_score: float | None = Field(default=None, alias="roleFitScore")
    role_fit_summary: str | None = Field(default=None, alias="roleFitSummary")
    keyword_score: float | None = Field(default=None, alias="keywordScore")
    matched: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    keyword_notes: list[RecommendationItem] = Field(default_factory=list, alias="keywordNotes")


class AtsKeywordRequest(CamelModel):
    cv_text: str = Field(alias="cvText")
    required_keywords: list[str] = Field(default_factory=list, alias="requiredKeywords")
    job_description: str = Field(default="", alias="jobDescription")
    role_context: RoleContext | None = Field(default=None, alias="roleContext")
    include_justifications: bool = Field(default=True, alias="includeJustifications")


class AtsKeywordResponse(CamelModel):
    keyword_score: float = Field(alias="keywordScore")
    matched: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    keyword_notes: list[RecommendationItem] = Field(default_factory=list, alias="keywordNotes")


# --- GitHub ---


class GitHubRepoSummary(CamelModel):
    name: str
    description: str = ""
    language: str = ""
    stars: int = 0
    topics: list[str] = Field(default_factory=list)
    has_readme: bool = Field(default=False, alias="hasReadme")
    updated_at: str = Field(default="", alias="updatedAt")


class GitHubAnalyzeRequest(CamelModel):
    repos: list[GitHubRepoSummary] = Field(default_factory=list)
    role_context: RoleContext = Field(alias="roleContext")
    portfolio_stats: dict[str, Any] = Field(default_factory=dict, alias="portfolioStats")
    include_justifications: bool = Field(default=True, alias="includeJustifications")


class GitHubAnalyzeResponse(CamelModel):
    recommendations: list[RecommendationItem] = Field(default_factory=list)
    summary_tips: list[str] = Field(default_factory=list, alias="summaryTips")
    summary_text: str = Field(default="", alias="summaryText")
    report_summary: str = Field(default="", alias="reportSummary")
    role_alignment_score: float = Field(alias="roleAlignmentScore")
    role_alignment_summary: str = Field(default="", alias="roleAlignmentSummary")


# --- Interview ---


class QuestionItem(CamelModel):
    text: str
    type: str


class GenerateQuestionsRequest(CamelModel):
    target_role: str = Field(alias="targetRole")
    interview_type: str = Field(default="MIXED", alias="interviewType")
    difficulty: str = Field(default="MEDIUM")
    profile_summary: str = Field(default="", alias="profileSummary")
    count: int = Field(default=5, ge=1, le=20)


class GenerateQuestionsResponse(CamelModel):
    questions: list[QuestionItem] = Field(default_factory=list)


class EvaluateAnswerRequest(CamelModel):
    question: str
    answer: str
    target_role: str = Field(alias="targetRole")
    question_type: str = Field(default="BEHAVIORAL", alias="questionType")


class EvaluateAnswerResponse(CamelModel):
    score: float
    feedback: dict[str, Any] = Field(default_factory=dict)


class SummarizeInterviewRequest(CamelModel):
    qa_pairs: list[dict[str, Any]] = Field(default_factory=list, alias="qaPairs")
    target_role: str = Field(alias="targetRole")


class SummarizeInterviewResponse(CamelModel):
    overall_score: float = Field(alias="overallScore")
    summary: str
    tips: list[str] = Field(default_factory=list)


# --- Roadmap ---


class RoadmapItemDto(CamelModel):
    item_type: str = Field(alias="itemType")
    title: str
    description: str
    resources: list[dict[str, str]] = Field(default_factory=list)
    skill_name: str | None = Field(default=None, alias="skillName")


class GenerateRoadmapRequest(CamelModel):
    target_role: str = Field(alias="targetRole")
    skill_gaps: list[str] = Field(default_factory=list, alias="skillGaps")
    weak_areas: str = Field(default="", alias="weakAreas")


class GenerateRoadmapResponse(CamelModel):
    items: list[RoadmapItemDto] = Field(default_factory=list)


# --- Verification ---


class QuizQuestion(CamelModel):
    id: str
    type: str
    question: str
    options: list[str] = Field(default_factory=list)


class GenerateQuizRequest(CamelModel):
    skill_name: str = Field(alias="skillName")
    question_count: int = Field(default=5, alias="questionCount", ge=1, le=20)


class GenerateQuizResponse(CamelModel):
    questions: list[QuizQuestion] = Field(default_factory=list)


class GradeQuizRequest(CamelModel):
    skill_name: str = Field(alias="skillName")
    questions: list[dict[str, Any]] = Field(default_factory=list)
    answers: list[dict[str, Any]] = Field(default_factory=list)


class GradeQuizResponse(CamelModel):
    score: float
    passed: bool
    feedback: dict[str, Any] = Field(default_factory=dict)


# --- Health ---


class HealthResponse(CamelModel):
    status: str
    ai_provider: str = Field(default="none", alias="aiProvider")
    ai_enabled: bool = Field(default=False, alias="aiEnabled")
    gemini_enabled: bool = Field(default=False, alias="geminiEnabled")
