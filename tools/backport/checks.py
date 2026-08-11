"""Aggregate pull-request and CI validation."""

# Standard library imports
import re
from typing import Any

# Bokeh imports
from . import BackportError
from .github import GitHubAPI, repository_path

ALLOWED_CHECK_CONCLUSIONS = {"success", "neutral", "skipped"}
TITLE_RE = re.compile(r"^\[MERGE WITH CLI\] Backports for (?P<version>\d+\.\d+\.\d+)$")


def require_rebase_merge(api: GitHubAPI, repository: str) -> None:
    settings = api.request("GET", repository_path(repository))
    if settings.get("allow_rebase_merge") is not True:
        raise BackportError(
            f"rebase merging is not enabled for {repository}\n\n"
            "In the GitHub web UI, open Settings → General, scroll to Pull Requests, "
            "enable Allow rebase merging, then run 'python -m tools.backport merge' again.",
        )


def validate_pr(
    pr: dict[str, Any],
    repository: str,
    *,
    expected_version: str | None = None,
    expected_target_branch: str | None = None,
    expected_head_branch: str | None = None,
    require_open: bool = True,
    require_ready: bool | None = None,
) -> str:
    """Validate the identity and current state of an aggregate backport PR."""
    errors: list[str] = []
    match = TITLE_RE.fullmatch(pr.get("title", ""))
    version = match.group("version") if match else ""
    base = pr.get("base", {}).get("ref", "")

    if require_ready is None:
        require_ready = require_open
    if require_open:
        if pr.get("state") != "open":
            errors.append("PR is not open")
    if require_ready:
        if pr.get("draft"):
            errors.append("PR is still a draft")
        if pr.get("mergeable") is not True:
            errors.append("PR is not confirmed mergeable")
    if not match:
        errors.append("title must be exactly '[MERGE WITH CLI] Backports for X.Y.Z'")
    if expected_version is not None and version != expected_version:
        errors.append(f"title version must be exactly {expected_version}")
    if expected_target_branch is not None:
        if base != expected_target_branch:
            errors.append(f"base branch must be exactly {expected_target_branch}")
    elif not base:
        errors.append("PR has no base branch")
    expected_head = expected_head_branch or (f"backport/{version}" if version else "")
    if expected_head and pr.get("head", {}).get("ref") != expected_head:
        errors.append(f"head branch must be exactly {expected_head}")
    if pr.get("head", {}).get("repo", {}).get("full_name") != repository:
        errors.append("head branch must belong to the target repository")
    if not pr.get("head", {}).get("sha"):
        errors.append("PR has no head SHA")

    if errors:
        raise BackportError("invalid aggregate backport PR:\n- " + "\n- ".join(errors))
    return version


def latest_check_runs(
    check_runs: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Keep the newest attempt for each check/app pair."""
    latest: dict[tuple[str, int | None], dict[str, Any]] = {}
    for run in check_runs:
        key = (run["name"], (run.get("app") or {}).get("id"))
        if key not in latest or run.get("id", 0) > latest[key].get("id", 0):
            latest[key] = run
    return list(latest.values())


def evaluate_checks(
    check_runs: list[dict[str, Any]],
    combined_status: dict[str, Any],
) -> list[str]:
    """Return the CI results that block a merge."""
    problems: list[str] = []
    for run in check_runs:
        name = run.get("name", "<unnamed>")
        status = run.get("status")
        conclusion = run.get("conclusion")
        if status != "completed":
            problems.append(f"{name}: {status}")
        elif conclusion not in ALLOWED_CHECK_CONCLUSIONS:
            problems.append(f"{name}: {conclusion}")

    statuses = combined_status.get("statuses", [])
    if statuses and combined_status.get("state") != "success":
        problems.append(f"combined commit status: {combined_status.get('state')}")

    if not check_runs and not statuses:
        problems.append("no CI checks or commit statuses were reported")

    return sorted(problems)


def check_pr_ci(
    api: GitHubAPI,
    repository: str,
    pr: dict[str, Any],
) -> None:
    root = repository_path(repository)
    candidate_shas = [
        pr.get("merge_commit_sha"),
        pr.get("head", {}).get("sha"),
    ]
    seen: set[str] = set()
    problems: list[str] = []

    for sha in candidate_shas:
        if not sha or sha in seen:
            continue
        seen.add(sha)
        runs = api.get_all(
            f"{root}/commits/{sha}/check-runs",
            list_key="check_runs",
        )
        runs = latest_check_runs(runs)
        status = api.request("GET", f"{root}/commits/{sha}/status")
        problems = evaluate_checks(runs, status)
        if not problems:
            return

    detail = "\n- ".join(problems) if problems else "no check SHA"
    raise BackportError(f"CI is not ready:\n- {detail}")
