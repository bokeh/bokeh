"""Reconstruct an open aggregate PR and add or remove backports."""

# Standard library imports
import re
from pathlib import Path
from typing import Any

# Bokeh imports
from . import BackportError
from .aggregate import CHERRY_PICK_ORIGIN_RE, load_aggregate, matching_backport
from .candidates import (
    candidate_policy_problems,
    candidate_target_problems,
    discover_candidates,
    target_branch_for,
)
from .git import GitRepo
from .github import GitHubAPI, get_pr, repository_path
from .models import Candidate, DedicatedCommit, PlanState

REVERT_RE = re.compile(
    r"^This reverts commit (?P<sha>[0-9a-f]{40})\.$",
    re.MULTILINE,
)
PR_URL_RE = re.compile(r"^https://github\.com/[^/]+/[^/]+/pull/(?P<number>\d+)/?$")
COMMIT_RE = re.compile(r"^[0-9a-fA-F]{7,40}$")


def prepare_update_plan(
    api: GitHubAPI,
    git: GitRepo,
    repository: str,
    aggregate_number: int,
    *,
    worktree: Path | None = None,
    review_each: bool = False,
    candidate_numbers: list[int] | None = None,
    revert_selectors: tuple[str, ...] = (),
) -> PlanState:
    pr = get_pr(api, repository, aggregate_number)
    snapshot = load_aggregate(
        api,
        repository,
        pr,
        require_open=True,
        require_ready=False,
    )
    version = snapshot.version
    commits = snapshot.commits
    by_origin = snapshot.commits_by_origin
    listed = discover_candidates(
        api,
        repository,
        [summary.number for summary in snapshot.summaries],
    )
    listed_by_number = {candidate.number: candidate for candidate in listed}
    adapted_by_number = {summary.number: summary.adapted for summary in snapshot.summaries}

    for candidate in listed:
        candidate.replay_sha = matching_backport(
            snapshot,
            candidate.merge_sha,
            candidate.number,
        )["sha"]
        candidate.adapted = adapted_by_number[candidate.number]

    reverted_candidates, dropped_commits = _resolve_reverts(
        api,
        repository,
        commits,
        listed_by_number,
        revert_selectors,
    )
    removed_numbers = set(reverted_candidates)
    removed_backports: set[str] = set()
    for candidate in reverted_candidates.values():
        reverted_matches = by_origin.get(candidate.merge_sha)
        if reverted_matches:
            removed_backports.add(reverted_matches[0]["sha"])
    missing_reverts = [candidate.number for candidate in reverted_candidates.values() if candidate.merge_sha not in by_origin]
    if missing_reverts:
        rendered = ", ".join(f"#{number}" for number in sorted(missing_reverts))
        raise BackportError(f"cannot revert PRs that are not in the aggregate PR: {rendered}")

    removed_manual_reverts = {commit["sha"] for commit in commits if _reverted_sha(commit) in removed_backports}
    known_origins = {candidate.merge_sha for candidate in listed} | {candidate.merge_sha for candidate in reverted_candidates.values()}
    unlisted = sorted(set(by_origin) - known_origins)
    if unlisted:
        rendered = ", ".join(sha[:12] for sha in unlisted)
        raise BackportError(
            f"aggregate PR has cherry-picked commits missing from its table; identify them with --revert PR_OR_COMMIT: {rendered}",
        )

    candidate_commit_shas = {commit["sha"] for matches in by_origin.values() for commit in matches}
    for commit in commits:
        target = _reverted_sha(commit)
        if target in candidate_commit_shas and target not in removed_backports:
            raise BackportError(
                f"commit {commit['sha'][:12]} reverts an included backport; identify it with --revert PR_OR_COMMIT",
            )

    dedicated = _dedicated_tail(
        commits,
        candidate_commit_shas,
        dropped_commits | removed_manual_reverts,
    )

    additions = discover_candidates(api, repository, candidate_numbers)
    existing_numbers = set(listed_by_number) | removed_numbers
    additions = [candidate for candidate in additions if candidate.number not in existing_numbers]
    if not additions and not reverted_candidates and not dropped_commits:
        source = "the file" if candidate_numbers is not None else "the label queue"
        raise BackportError(
            f"{source} contains no PRs that are new to aggregate PR #{aggregate_number}",
        )

    repo = api.request("GET", repository_path(repository))
    problems = candidate_policy_problems(
        additions,
        version=version,
        development_branch=repo["default_branch"],
        release_branch=target_branch_for(version),
        explicit=candidate_numbers is not None,
    )
    target_branch = pr["base"]["ref"]
    branch = pr["head"]["ref"]
    if target_branch == repo["default_branch"]:
        problems.append(
            f"aggregate target {target_branch} is the repository's current development branch",
        )
    if not git.remote_branch_exists(target_branch):
        problems.append(f"target branch does not exist on {git.remote}: {target_branch}")
    if not git.remote_branch_exists(branch):
        problems.append(f"aggregate branch does not exist on {git.remote}: {branch}")
    if problems:
        raise BackportError("candidate eligibility validation failed:\n- " + "\n- ".join(problems))

    git.fetch_branches(target_branch, repo["default_branch"], branch)
    if git.rev_parse(f"{git.remote}/{branch}") != pr["head"]["sha"]:
        raise BackportError(
            f"{git.remote}/{branch} does not match the head of aggregate PR #{aggregate_number}",
        )
    target_problems = candidate_target_problems(
        git,
        additions,
        f"{git.remote}/{target_branch}",
    )
    if target_problems:
        raise BackportError(
            "candidate eligibility validation failed:\n- " + "\n- ".join(target_problems),
        )

    kept = [candidate for candidate in listed if candidate.number not in removed_numbers]
    for candidate in reverted_candidates.values():
        candidate.status = "rejected"
        candidate.replay_sha = by_origin[candidate.merge_sha][0]["sha"]
        candidate.reject_reason = f"removed from aggregate PR #{aggregate_number} with --revert"
    candidates = sorted(
        [*kept, *additions, *reverted_candidates.values()],
        key=lambda candidate: (candidate.merged_at, candidate.number),
    )
    selected_worktree = (worktree or git.default_worktree(version)).resolve()
    return PlanState(
        repository=repository,
        version=version,
        target_branch=target_branch,
        branch=branch,
        worktree=str(selected_worktree),
        base_sha=git.rev_parse(f"{git.remote}/{target_branch}"),
        candidates=candidates,
        review_each=review_each,
        remote=git.remote,
        detached_worktree=True,
        pull_request_number=aggregate_number,
        pull_request_url=pr["html_url"],
        dedicated_commits=dedicated,
    )


def _resolve_reverts(
    api: GitHubAPI,
    repository: str,
    commits: list[dict[str, Any]],
    listed: dict[int, Candidate],
    selectors: tuple[str, ...],
) -> tuple[dict[int, Candidate], set[str]]:
    if not selectors:
        return {}, set()

    requested_numbers: set[int] = set()
    requested_origins: set[str] = set()
    dropped_commits: set[str] = set()
    by_sha = {commit["sha"]: commit for commit in commits}
    for selector in selectors:
        if number := _pr_number(selector, repository):
            requested_numbers.add(number)
            continue
        if not COMMIT_RE.fullmatch(selector):
            raise BackportError(
                f"invalid --revert value {selector!r}; expected a PR number, PR URL, or commit SHA",
            )
        matches: set[tuple[str, str]] = set()
        prefix = selector.lower()
        for commit in commits:
            sha = commit["sha"]
            origins = CHERRY_PICK_ORIGIN_RE.findall(commit.get("commit", {}).get("message", ""))
            if sha.startswith(prefix):
                if origins:
                    matches.add(("origin", origins[-1]))
                elif target := _reverted_sha(commit):
                    target_commit = by_sha.get(target)
                    target_origins = (
                        CHERRY_PICK_ORIGIN_RE.findall(
                            target_commit.get("commit", {}).get("message", ""),
                        )
                        if target_commit is not None
                        else []
                    )
                    if target_origins:
                        matches.add(("origin", target_origins[-1]))
                    else:
                        matches.add(("commit", sha))
                else:
                    matches.add(("commit", sha))
            for origin in origins:
                if origin.startswith(prefix):
                    matches.add(("origin", origin))
        if not matches:
            raise BackportError(f"--revert commit {selector} is not in the aggregate PR")
        if len(matches) > 1:
            raise BackportError(f"--revert commit {selector} is ambiguous")
        kind, sha = matches.pop()
        if kind == "origin":
            requested_origins.add(sha)
        else:
            dropped_commits.add(sha)

    known_by_origin = {candidate.merge_sha: candidate for candidate in listed.values()}
    for origin in requested_origins:
        candidate = known_by_origin.get(origin)
        if candidate is not None:
            requested_numbers.add(candidate.number)
        else:
            requested_numbers.add(_pull_number_for_commit(api, repository, origin))

    discovered = discover_candidates(api, repository, sorted(requested_numbers))
    return {candidate.number: candidate for candidate in discovered}, dropped_commits


def _pr_number(value: str, repository: str) -> int | None:
    if match := re.fullmatch(r"#?(?P<number>\d+)", value):
        return int(match.group("number"))
    if match := PR_URL_RE.fullmatch(value):
        expected = f"https://github.com/{repository}/pull/"
        if not value.startswith(expected):
            raise BackportError(f"--revert PR URL must belong to {repository}")
        return int(match.group("number"))
    return None


def _pull_number_for_commit(api: GitHubAPI, repository: str, sha: str) -> int:
    pulls = api.get_all(f"{repository_path(repository)}/commits/{sha}/pulls")
    matches = [pull for pull in pulls if pull.get("merge_commit_sha") == sha and pull.get("merged_at")]
    if len(matches) != 1:
        raise BackportError(f"could not identify one merged PR for commit {sha}")
    return matches[0]["number"]


def _reverted_sha(commit: dict[str, Any]) -> str | None:
    message = commit.get("commit", {}).get("message", "")
    match = REVERT_RE.search(message)
    return match.group("sha") if match else None


def _dedicated_tail(
    commits: list[dict[str, Any]],
    candidate_shas: set[str],
    dropped_shas: set[str],
) -> list[DedicatedCommit]:
    positions = {commit["sha"]: index for index, commit in enumerate(commits)}
    last_candidate = max((positions[sha] for sha in candidate_shas), default=-1)
    interleaved = [commit["sha"] for commit in commits[:last_candidate] if commit["sha"] not in candidate_shas and commit["sha"] not in dropped_shas]
    if interleaved:
        rendered = ", ".join(sha[:12] for sha in interleaved)
        raise BackportError(
            "aggregate PR has dedicated commits interleaved with backports and cannot be rebuilt safely: " + rendered,
        )
    return [
        DedicatedCommit(
            sha=commit["sha"],
            subject=commit.get("commit", {}).get("message", "").splitlines()[0],
        )
        for commit in commits[last_candidate + 1 :]
        if commit["sha"] not in dropped_shas
    ]
