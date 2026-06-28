class AIServiceError(Exception):
    """Raised when AI analysis is required but cannot be completed."""

    def __init__(self, message: str, *, feature: str | None = None) -> None:
        self.feature = feature
        super().__init__(message)


class LLMRequestError(AIServiceError):
    """Raised when the configured LLM provider rejects or fails a request."""

    def __init__(
        self,
        message: str,
        *,
        feature: str | None = None,
        status_code: int | None = None,
    ) -> None:
        self.status_code = status_code
        super().__init__(message, feature=feature)
