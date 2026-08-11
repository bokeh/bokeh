"""In-memory backport workflow models."""

# Standard library imports
from dataclasses import dataclass, field

# Bokeh imports
from . import BackportError


@dataclass
class IssueRef:
    number: int
    issue_type: str | None = None


@dataclass
class Candidate:
    number: int
    title: str
    url: str
    merged_at: str
    merge_sha: str
    base_branch: str
    labels: list[str] = field(default_factory=list)
    milestone: str | None = None
    issues: list[IssueRef] = field(default_factory=list)
    status: str = "pending"
    backport_sha: str | None = None
    replay_sha: str | None = None
    adapted: bool = False
    conflict_files: list[str] = field(default_factory=list)
    reject_reason: str | None = None


@dataclass
class DedicatedCommit:
    sha: str
    subject: str
    status: str = "pending"
    backport_sha: str | None = None
    previous_head: str | None = None
    conflict_files: list[str] = field(default_factory=list)


@dataclass
class PlanState:
    repository: str
    version: str
    target_branch: str
    branch: str
    worktree: str
    base_sha: str
    candidates: list[Candidate]
    review_each: bool = False
    remote: str = "origin"
    detached_worktree: bool = False
    pull_request_number: int | None = None
    pull_request_url: str | None = None
    dedicated_commits: list[DedicatedCommit] = field(default_factory=list)

    def candidate(self, number: int) -> Candidate:
        try:
            return next(item for item in self.candidates if item.number == number)
        except StopIteration:
            raise BackportError(f"PR #{number} is not in the active plan") from None

    @property
    def accepted(self) -> list[Candidate]:
        return [candidate for candidate in self.candidates if candidate.status == "applied"]

    @property
    def rejected(self) -> list[Candidate]:
        return [candidate for candidate in self.candidates if candidate.status == "rejected"]

    @property
    def conflict(self) -> Candidate | None:
        return next(
            (
                candidate
                for candidate in self.candidates
                if candidate.status in {"applying", "conflict"}
            ),
            None,
        )

    @property
    def review(self) -> Candidate | None:
        return next(
            (candidate for candidate in self.candidates if candidate.status == "review"),
            None,
        )

    @property
    def dedicated_conflict(self) -> DedicatedCommit | None:
        return next(
            (
                commit
                for commit in self.dedicated_commits
                if commit.status in {"applying", "conflict"}
            ),
            None,
        )


@dataclass(frozen=True, slots=True)
class BackportEntry:
    number: int
    original_sha: str
    backport_sha: str
    adapted: bool


@dataclass(frozen=True, slots=True)
class BackportSummary:
    number: int
    adapted: bool


@dataclass(frozen=True, slots=True)
class PublishedPlan:
    repository: str
    version: str
    target_branch: str
    branch: str
    pull_request_number: int
    pull_request_url: str
    head_sha: str
    entries: list[BackportEntry]
