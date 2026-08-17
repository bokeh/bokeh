"""Aggregate pull-request summaries and commit snapshots."""

# Standard library imports
import re
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

# Bokeh imports
from . import BackportError
from .checks import validate_pr
from .github import GitHubAPI, repository_path
from .models import BackportSummary, PlanState

CHERRY_PICK_ORIGIN_RE = re.compile(
    r"^\(cherry picked from commit (?P<sha>[0-9a-f]{40})\)$",
    re.MULTILINE,
)


@dataclass(frozen=True, slots=True)
class AggregateSnapshot:
    version: str
    summaries: list[BackportSummary]
    commits: list[dict[str, Any]]
    commits_by_origin: dict[str, list[dict[str, Any]]]


def load_aggregate(
    api: GitHubAPI,
    repository: str,
    pr: dict[str, Any],
    *,
    require_open: bool,
    require_ready: bool | None = None,
    include_commits: bool = True,
) -> AggregateSnapshot:
    version = validate_pr(
        pr,
        repository,
        require_open=require_open,
        require_ready=require_ready,
    )
    body = pr.get("body") or ""
    lines = body.splitlines()
    if not lines or lines[0] != f"This PR collects backports for {version}.":
        raise BackportError("aggregate PR body version does not match its title")
    summaries = parse_pr_body(body, repository)
    commits = api.get_all(f"{repository_path(repository)}/pulls/{pr['number']}/commits") if include_commits else []
    return AggregateSnapshot(version, summaries, commits, commits_by_origin(commits))


def commits_by_origin(
    commits: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {}
    for commit in commits:
        origins = CHERRY_PICK_ORIGIN_RE.findall(commit.get("commit", {}).get("message", ""))
        if origins:
            result.setdefault(origins[-1], []).append(commit)
    return result


def matching_backport(
    snapshot: AggregateSnapshot,
    original_sha: str,
    number: int,
) -> dict[str, Any]:
    matches = snapshot.commits_by_origin.get(original_sha, [])
    if not matches:
        raise BackportError(
            f"no aggregate commit has the cherry-pick trailer for PR #{number}",
        )
    if len(matches) > 1:
        raise BackportError(
            f"multiple aggregate commits have the cherry-pick trailer for PR #{number}",
        )
    return matches[0]


def _escape_link_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("[", "\\[").replace("]", "\\]").replace("|", "\\|")


def render_pr_body(
    state: PlanState,
    range_diff_urls: Mapping[int, str] | None = None,
) -> str:
    lines = [
        f"This PR collects backports for {state.version}.",
        "",
        "> [!IMPORTANT]",
        "> Merge this PR with `python -m tools.backport merge`. Do not use GitHub's web UI.",
        "",
        "| PR | Result | Details |",
        "| --- | --- | --- |",
    ]
    for candidate in sorted(state.accepted, key=lambda item: item.number):
        assert candidate.backport_sha is not None
        result = "adapted" if candidate.adapted else "clean"
        title = _escape_link_text(candidate.title)
        range_diff = ""
        if candidate.adapted:
            url = (range_diff_urls or {}).get(candidate.number)
            range_diff = f"[diff]({url})" if url is not None else "generated on publish"
        lines.append(
            f"| [#{candidate.number} {title}]({candidate.url}) | {result} | {range_diff} |",
        )
    return "\n".join([*lines, ""])


def parse_pr_body(body: str, repository: str) -> list[BackportSummary]:
    lines = body.strip().splitlines()
    if (
        len(lines) < 8
        or re.fullmatch(r"This PR collects backports for \d+\.\d+\.\d+\.", lines[0]) is None
        or lines[1] != ""
        or lines[2] != "> [!IMPORTANT]"
        or lines[3] != "> Merge this PR with `python -m tools.backport merge`. Do not use GitHub's web UI."
        or lines[4] != ""
        or lines[5] != "| PR | Result | Details |"
        or lines[6] != "| --- | --- | --- |"
    ):
        raise BackportError("aggregate PR body is not the generated backport summary")

    repo_url = re.escape(f"https://github.com/{repository}")
    row = re.compile(
        rf"^\| \[#(?P<number>\d+) (?P<title>(?:\\.|[^\]])+)\]"
        rf"\({repo_url}/pull/(?P=number)\) "
        rf"\| (?P<result>clean|adapted) "
        rf"\| (?P<range_diff>(?:\[diff\]\(https://[^ )]+\))?) \|$",
    )
    entries: list[BackportSummary] = []
    for line in lines[7:]:
        match = row.fullmatch(line)
        if match is None:
            raise BackportError(f"invalid aggregate PR summary row: {line}")
        adapted = match.group("result") == "adapted"
        if adapted != bool(match.group("range_diff")):
            raise BackportError(f"range-diff link does not match result for PR #{match['number']}")
        entries.append(BackportSummary(number=int(match["number"]), adapted=adapted))
    if len({entry.number for entry in entries}) != len(entries):
        raise BackportError("aggregate PR summary contains duplicate PRs")
    if [entry.number for entry in entries] != sorted(entry.number for entry in entries):
        raise BackportError("aggregate PR summary is not sorted by PR number")
    return entries
