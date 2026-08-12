# Bokeh imports
from tools.backport.models import Candidate, IssueRef, PlanState


def valid_pr(*, body: str = "") -> dict:
    return {
        "base": {"ref": "branch-3.9"},
        "body": body,
        "draft": False,
        "head": {
            "ref": "backport/3.9.2",
            "repo": {"full_name": "bokeh/bokeh"},
            "sha": "abc123",
        },
        "html_url": "https://github.com/bokeh/bokeh/pull/15264",
        "merge_commit_sha": "def456",
        "mergeable": True,
        "merged_at": None,
        "number": 15264,
        "state": "open",
        "title": "[MERGE WITH CLI] Backports for 3.9.2",
    }


def candidate(
    number: int,
    *,
    merged_at: str | None = None,
    base_branch: str = "branch-3.10",
    milestone: str | None = "3.10",
    labels: list[str] | None = None,
    issues: list[IssueRef] | None = None,
    status: str = "pending",
    backport_sha: str | None = None,
) -> Candidate:
    return Candidate(
        number=number,
        title=f"Fix #{number}",
        url=f"https://github.com/bokeh/bokeh/pull/{number}",
        merged_at=merged_at or f"2026-07-{number % 28 + 1:02d}T12:00:00Z",
        merge_sha=f"{number:040x}",
        base_branch=base_branch,
        labels=labels or [],
        milestone=milestone,
        issues=issues or [],
        status=status,
        backport_sha=backport_sha,
    )


def state_with(candidates: list[Candidate]) -> PlanState:
    return PlanState(
        repository="bokeh/bokeh",
        version="3.9.2",
        target_branch="branch-3.9",
        branch="backport/3.9.2",
        worktree="/tmp/bokeh-backport-3.9.2",
        base_sha="0" * 40,
        candidates=candidates,
    )


class FakeGraphQLAPI:
    def __init__(self, pages: list[dict]) -> None:
        self.pages = pages
        self.calls: list[tuple[str, dict]] = []

    def graphql(self, query: str, variables: dict) -> dict:
        self.calls.append((query, variables))
        return self.pages[len(self.calls) - 1]


class RecordingAPI:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, dict]] = []

    def request(self, method: str, path: str, **kwargs: object) -> dict:
        self.calls.append((method, path, kwargs))
        return {"merged": True, "sha": "f" * 40}
