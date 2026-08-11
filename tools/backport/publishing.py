"""Aggregate pull-request publication and GitHub bookkeeping."""

# Standard library imports
from pathlib import Path
from typing import Any
from urllib.parse import quote

# Bokeh imports
from .candidates import BACKPORT_LABEL, milestone_for_version
from .git import GitRepo
from .github import GitHubAPI, repository_path
from .models import Candidate, PlanState
from .planning import render_pr_body
from .range_diffs import publish_range_diffs


def ensure_milestone(
    api: GitHubAPI,
    repository: str,
    title: str,
) -> int:
    root = repository_path(repository)
    milestones = api.get_all(f"{root}/milestones?state=all")
    for milestone in milestones:
        if milestone["title"] == title:
            return milestone["number"]
    created = api.request(
        "POST",
        f"{root}/milestones",
        expected=(201,),
        json={"title": title, "description": f"bokeh {title}"},
    )
    return created["number"]


def set_milestone(
    api: GitHubAPI,
    repository: str,
    number: int,
    milestone_number: int,
) -> None:
    api.request(
        "PATCH",
        f"{repository_path(repository)}/issues/{number}",
        json={"milestone": milestone_number},
    )


def remove_label(
    api: GitHubAPI,
    repository: str,
    number: int,
    label: str,
) -> None:
    encoded = quote(label, safe="")
    api.request(
        "DELETE",
        f"{repository_path(repository)}/issues/{number}/labels/{encoded}",
        expected=(200, 404),
    )


def publish_rejection(
    api: GitHubAPI,
    state: PlanState,
    candidate: Candidate,
) -> None:
    marker = f"<!-- backport-rejection:{state.version} -->"
    body = f"{marker}\nBackport to {state.version} rejected: {candidate.reject_reason}"
    root = repository_path(state.repository)
    comments = api.get_all(f"{root}/issues/{candidate.number}/comments")
    existing = next(
        (comment for comment in comments if marker in comment.get("body", "")),
        None,
    )
    if existing is None:
        api.request(
            "POST",
            f"{root}/issues/{candidate.number}/comments",
            expected=(201,),
            json={"body": body},
        )
    elif existing.get("body") != body:
        api.request(
            "PATCH",
            f"{root}/issues/comments/{existing['id']}",
            json={"body": body},
        )
    remove_label(
        api,
        state.repository,
        candidate.number,
        BACKPORT_LABEL,
    )


def clear_rejection(
    api: GitHubAPI,
    state: PlanState,
    candidate: Candidate,
) -> None:
    marker = f"<!-- backport-rejection:{state.version} -->"
    root = repository_path(state.repository)
    comments = api.get_all(f"{root}/issues/{candidate.number}/comments")
    for comment in comments:
        if marker in comment.get("body", ""):
            api.request(
                "DELETE",
                f"{root}/issues/comments/{comment['id']}",
                expected=(204, 404),
            )


def publish_plan(
    api: GitHubAPI,
    git: GitRepo,
    state: PlanState,
) -> dict[str, Any]:
    worktree = Path(state.worktree)
    git.push(worktree, state.branch)
    title = f"[MERGE WITH CLI] Backports for {state.version}"
    range_diff_urls = publish_range_diffs(api, git, state)
    body = render_pr_body(state, range_diff_urls)
    root = repository_path(state.repository)

    if state.pull_request_number is None:
        pull = api.request(
            "POST",
            f"{root}/pulls",
            expected=(201,),
            json={
                "base": state.target_branch,
                "body": body,
                "draft": True,
                "head": state.branch,
                "title": title,
            },
        )
    else:
        pull = api.request(
            "PATCH",
            f"{root}/pulls/{state.pull_request_number}",
            json={
                "body": body,
                "title": title,
            },
        )

    milestone_number = ensure_milestone(
        api,
        state.repository,
        milestone_for_version(state.version),
    )
    set_milestone(
        api,
        state.repository,
        pull["number"],
        milestone_number,
    )

    for candidate in state.rejected:
        publish_rejection(api, state, candidate)
    for candidate in state.accepted:
        if state.pull_request_number is not None and candidate.replay_sha is None:
            clear_rejection(api, state, candidate)

    return pull
