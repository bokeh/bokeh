"""Discover, verify, rebase-merge, and finalize an aggregate backport PR."""

# Standard library imports
from typing import Any
from urllib.parse import quote

# Bokeh imports
from . import BackportError
from .aggregate import AggregateSnapshot, load_aggregate, matching_backport
from .candidates import BACKPORT_LABEL, milestone_for_version
from .checks import (
    TITLE_RE,
    check_pr_ci,
    require_rebase_merge,
)
from .github import (
    GitHubAPI,
    closing_issue_numbers,
    get_pr,
    repository_path,
)
from .models import BackportEntry, BackportSummary, PublishedPlan
from .publishing import ensure_milestone, remove_label, set_milestone


def find_backport_pr(
    api: GitHubAPI,
    repository: str,
    number: int | None = None,
) -> dict[str, Any]:
    if number is not None:
        return get_pr(api, repository, number)

    pulls = api.get_all(f"{repository_path(repository)}/pulls?state=open")
    matches = [
        pull
        for pull in pulls
        if (match := TITLE_RE.fullmatch(pull.get("title", "")))
        and pull.get("head", {}).get("ref") == f"backport/{match.group('version')}"
        and pull.get("head", {}).get("repo", {}).get("full_name") == repository
    ]
    if not matches:
        raise BackportError("no open aggregate backport PR was found")
    if len(matches) > 1:
        numbers = ", ".join(f"#{pull['number']}" for pull in matches)
        raise BackportError(f"multiple aggregate backport PRs are open ({numbers}); specify one")
    return get_pr(api, repository, matches[0]["number"])


def published_plan_from_pr(
    api: GitHubAPI,
    pr: dict[str, Any],
    repository: str,
    *,
    require_open: bool,
    require_ready: bool | None = None,
    expected_entries: list[BackportEntry] | None = None,
) -> PublishedPlan:
    snapshot = load_aggregate(
        api,
        repository,
        pr,
        require_open=require_open,
        require_ready=require_ready,
        include_commits=expected_entries is None,
    )
    if expected_entries is None:
        entries = resolve_backport_entries(
            api,
            repository,
            snapshot,
        )
    else:
        expected_summaries = [BackportSummary(entry.number, entry.adapted) for entry in expected_entries]
        if snapshot.summaries != expected_summaries:
            raise BackportError("aggregate PR summary changed during merge preparation")
        entries = expected_entries
    return PublishedPlan(
        repository=repository,
        version=snapshot.version,
        target_branch=pr["base"]["ref"],
        branch=pr["head"]["ref"],
        pull_request_number=pr["number"],
        pull_request_url=pr["html_url"],
        head_sha=pr["head"]["sha"],
        entries=entries,
    )


def resolve_backport_entries(
    api: GitHubAPI,
    repository: str,
    snapshot: AggregateSnapshot,
) -> list[BackportEntry]:
    entries: list[BackportEntry] = []
    for summary in snapshot.summaries:
        source = get_pr(api, repository, summary.number)
        original_sha = source.get("merge_commit_sha")
        if not source.get("merged_at") or not original_sha:
            raise BackportError(f"listed source PR #{summary.number} is not merged")
        backport = matching_backport(snapshot, original_sha, summary.number)
        entries.append(
            BackportEntry(
                number=summary.number,
                original_sha=original_sha,
                backport_sha=backport["sha"],
                adapted=summary.adapted,
            ),
        )
    unlisted = sorted(set(snapshot.commits_by_origin) - {entry.original_sha for entry in entries})
    if unlisted:
        rendered = ", ".join(sha[:12] for sha in unlisted)
        raise BackportError(
            f"aggregate PR has cherry-picked commits missing from its table: {rendered}",
        )
    return entries


def finalize_merged_plan(api: GitHubAPI, plan: PublishedPlan) -> list[str]:
    milestone_number = ensure_milestone(
        api,
        plan.repository,
        milestone_for_version(plan.version),
    )
    issue_numbers: set[int] = set()
    for entry in plan.entries:
        set_milestone(api, plan.repository, entry.number, milestone_number)
        remove_label(api, plan.repository, entry.number, BACKPORT_LABEL)
        issue_numbers.update(closing_issue_numbers(api, plan.repository, entry.number))
    for number in sorted(issue_numbers):
        set_milestone(api, plan.repository, number, milestone_number)

    set_milestone(api, plan.repository, plan.pull_request_number, milestone_number)
    encoded_ref = quote(f"heads/{plan.branch}", safe="/")
    remote_cleanup = api.request(
        "DELETE",
        f"{repository_path(plan.repository)}/git/refs/{encoded_ref}",
        expected=(204, 404, 422),
    )
    warnings: list[str] = []
    if isinstance(remote_cleanup, dict):
        message = remote_cleanup.get("message", "")
        if message and message != "Not Found":
            warnings.append(f"could not delete remote branch {plan.branch}: {message}")
    return warnings


def merge_plan(api: GitHubAPI, plan: PublishedPlan) -> tuple[str, list[str]]:
    pr = get_pr(api, plan.repository, plan.pull_request_number)
    if pr.get("state") == "open":
        require_rebase_merge(api, plan.repository)
        current_plan = published_plan_from_pr(
            api,
            pr,
            plan.repository,
            require_open=True,
            expected_entries=plan.entries,
        )
        if current_plan != plan:
            raise BackportError("aggregate PR changed during merge preparation; run merge again")

        commits = api.get_all(
            f"{repository_path(plan.repository)}/pulls/{plan.pull_request_number}/commits",
        )
        commit_shas = {commit["sha"] for commit in commits}
        missing = [entry.number for entry in plan.entries if entry.backport_sha not in commit_shas]
        if missing:
            raise BackportError(
                "summary references commits outside the aggregate PR: " + ", ".join(f"#{number}" for number in missing),
            )

        check_pr_ci(api, plan.repository, pr)
        current = get_pr(api, plan.repository, plan.pull_request_number)
        stable_plan = published_plan_from_pr(
            api,
            current,
            plan.repository,
            require_open=True,
            expected_entries=plan.entries,
        )
        if stable_plan != plan:
            raise BackportError("aggregate PR changed during preflight; run merge again")
        if current.get("merge_commit_sha") != pr.get("merge_commit_sha"):
            raise BackportError("PR test merge changed during preflight; run merge again")

        result = api.request(
            "PUT",
            f"{repository_path(plan.repository)}/pulls/{plan.pull_request_number}/merge",
            json={"merge_method": "rebase", "sha": plan.head_sha},
        )
        if not result.get("merged"):
            raise BackportError(f"GitHub did not merge the PR: {result.get('message')}")
        merge_sha = result["sha"]
    elif pr.get("merged_at"):
        current_plan = published_plan_from_pr(
            api,
            pr,
            plan.repository,
            require_open=False,
            expected_entries=plan.entries,
        )
        if current_plan != plan:
            raise BackportError("aggregate PR changed since this merge command started")
        merge_sha = pr.get("merge_commit_sha") or ""
    else:
        raise BackportError(f"PR #{plan.pull_request_number} is closed but was not merged")

    return merge_sha, finalize_merged_plan(api, plan)
