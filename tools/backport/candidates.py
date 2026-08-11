"""Release inference, candidate discovery, and eligibility policy."""

# Standard library imports
import re
from collections.abc import Iterable
from pathlib import Path
from typing import Any

# Bokeh imports
from . import BackportError
from .github import GitHubAPI, split_repository
from .models import Candidate, IssueRef

BACKPORT_LABEL = "NEEDS BACK PORT"
PATCH_RELEASE_ISSUE_TYPES = {"bug", "task"}
FEATURE_ISSUE_TYPE = "feature"
BASE_RE = re.compile(r"^branch-(?P<series>\d+\.\d+)$")
VERSION_RE = re.compile(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)$")
_PULL_REQUEST_FRAGMENT = """
fragment BackportCandidateFields on PullRequest {
  number
  title
  url
  merged
  mergedAt
  baseRefName
  mergeCommit { oid }
  milestone { title }
  labels(first: 50) { nodes { name } }
  closingIssuesReferences(first: 50) {
    nodes {
      number
      issueType { name }
    }
  }
}
"""


def next_patch_version(tags: Iterable[str]) -> str:
    versions: list[tuple[int, int, int]] = []
    for tag in tags:
        match = VERSION_RE.fullmatch(tag.strip())
        if match:
            versions.append(
                (
                    int(match.group("major")),
                    int(match.group("minor")),
                    int(match.group("patch")),
                ),
            )
    if not versions:
        raise BackportError("no stable X.Y.Z release tags were found")
    major, minor, patch = max(versions)
    return f"{major}.{minor}.{patch + 1}"


def target_branch_for(version: str) -> str:
    match = VERSION_RE.fullmatch(version)
    if not match:
        raise BackportError(f"invalid release version: {version}")
    return f"branch-{match.group('major')}.{match.group('minor')}"


def backport_branch_for(version: str) -> str:
    if not VERSION_RE.fullmatch(version):
        raise BackportError(f"invalid release version: {version}")
    return f"backport/{version}"


def milestone_for_version(version: str) -> str:
    match = VERSION_RE.fullmatch(version)
    if not match:
        raise BackportError(f"invalid release version: {version}")
    if match.group("patch") == "0":
        return f"{match.group('major')}.{match.group('minor')}"
    return version


def read_pr_numbers(path: Path, repository: str) -> list[int]:
    """Read bare numbers, ``#number``, or repository PR URLs."""
    url = re.compile(rf"^https://github\.com/{re.escape(repository)}/pull/(?P<number>\d+)/?$")
    numbers: list[int] = []
    first_lines: dict[int, int] = {}
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.strip()
        if not line:
            continue
        match = re.fullmatch(r"#?(?P<number>\d+)", line) or url.fullmatch(line)
        if match is None:
            raise BackportError(
                f"{path}:{line_number}: expected a PR number, #number, or https://github.com/{repository}/pull/number",
            )
        number = int(match.group("number"))
        if number in first_lines:
            raise BackportError(
                f"{path}:{line_number}: PR #{number} was already listed on line {first_lines[number]}",
            )
        first_lines[number] = line_number
        numbers.append(number)
    if not numbers:
        raise BackportError(f"{path}: no PRs were listed")
    return numbers


def _labels(node: dict[str, Any]) -> list[str]:
    return sorted(label["name"] for label in node.get("labels", {}).get("nodes", []))


def _candidate(node: dict[str, Any] | None, requested_number: int | None = None) -> Candidate:
    if node is None:
        assert requested_number is not None
        raise BackportError(f"PR #{requested_number} does not exist")
    number = node["number"]
    merge_commit = node.get("mergeCommit")
    if not node.get("merged"):
        raise BackportError(f"PR #{number} is not merged")
    if not node.get("mergedAt") or not merge_commit:
        raise BackportError(f"merged PR #{number} has no usable merge commit")
    return Candidate(
        number=number,
        title=node["title"],
        url=node["url"],
        merged_at=node["mergedAt"],
        merge_sha=merge_commit["oid"],
        base_branch=node["baseRefName"],
        labels=_labels(node),
        milestone=(node.get("milestone") or {}).get("title"),
        issues=[
            IssueRef(
                number=issue["number"],
                issue_type=(issue.get("issueType") or {}).get("name"),
            )
            for issue in node["closingIssuesReferences"]["nodes"]
        ],
    )


def discover_candidates(
    api: GitHubAPI,
    repository: str,
    numbers: list[int] | None = None,
) -> list[Candidate]:
    if numbers is not None:
        owner, name = split_repository(repository)
        query = (
            """
            query SelectedBackportCandidate($owner: String!, $name: String!, $number: Int!) {
              repository(owner: $owner, name: $name) {
                pullRequest(number: $number) { ...BackportCandidateFields }
              }
            }
            """
            + _PULL_REQUEST_FRAGMENT
        )
        selected = [
            _candidate(
                api.graphql(
                    query,
                    {"owner": owner, "name": name, "number": number},
                )["repository"]["pullRequest"],
                number,
            )
            for number in numbers
        ]
        return sorted(selected, key=lambda candidate: (candidate.merged_at, candidate.number))

    query = (
        """
    query BackportCandidates($query: String!, $cursor: String) {
      search(type: ISSUE, query: $query, first: 100, after: $cursor) {
        nodes {
          ... on PullRequest { ...BackportCandidateFields }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
    """
        + _PULL_REQUEST_FRAGMENT
    )
    search = f'repo:{repository} is:pr label:"{BACKPORT_LABEL}"'
    cursor: str | None = None
    candidates: list[Candidate] = []
    invalid: list[str] = []
    while True:
        data = api.graphql(query, {"query": search, "cursor": cursor})
        result = data["search"]
        for node in result["nodes"]:
            try:
                candidates.append(_candidate(node))
            except BackportError as error:
                invalid.append(str(error))
        page_info = result["pageInfo"]
        if not page_info["hasNextPage"]:
            break
        cursor = page_info["endCursor"]
    if invalid:
        raise BackportError("invalid labeled PRs:\n- " + "\n- ".join(invalid))
    return sorted(
        candidates,
        key=lambda candidate: (candidate.merged_at, candidate.number),
    )


def candidate_type_problems(
    candidates: Iterable[Candidate],
    *,
    allow_features: bool = False,
) -> list[str]:
    allowed_types = PATCH_RELEASE_ISSUE_TYPES | ({FEATURE_ISSUE_TYPE} if allow_features else set())
    expected = "Bug, Task, or Feature" if allow_features else "Bug or Task"
    problems: list[str] = []
    for candidate in candidates:
        if not candidate.issues:
            problems.append(
                f"PR #{candidate.number} has no associated issue; GitHub issue types do not apply to pull requests",
            )
        for issue in candidate.issues:
            issue_type = issue.issue_type.casefold() if issue.issue_type is not None else None
            if issue_type not in allowed_types:
                rendered = issue.issue_type or "no type"
                problems.append(
                    f"issue #{issue.number} for PR #{candidate.number} must have GitHub issue type {expected}; found {rendered}",
                )
    return problems


def candidate_source_problems(
    candidates: Iterable[Candidate],
    development_branch: str,
    release_branch: str,
) -> list[str]:
    if not BASE_RE.fullmatch(development_branch):
        return [
            f"repository default branch {development_branch!r} is not a development release branch named branch-X.Y",
        ]
    development_milestone = development_branch.removeprefix("branch-")
    allowed_branches = {development_branch, release_branch}
    problems: list[str] = []
    for candidate in candidates:
        if candidate.base_branch not in allowed_branches:
            problems.append(
                f"PR #{candidate.number} was merged into {candidate.base_branch}, not current "
                f"development branch {development_branch} or release branch {release_branch}",
            )
        if candidate.milestone != development_milestone:
            rendered = candidate.milestone or "no milestone"
            problems.append(
                f"PR #{candidate.number}'s current milestone is {rendered!r}, not {development_milestone!r}",
            )
    return problems
