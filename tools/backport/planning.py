"""Planning, cherry-picking, interruption recovery, adaptation, and rejection."""

# Standard library imports
from collections.abc import Callable
from pathlib import Path

# Bokeh imports
from . import BackportError
from .aggregate import CHERRY_PICK_ORIGIN_RE
from .candidates import (
    BACKPORT_LABEL,
    backport_branch_for,
    candidate_policy_problems,
    candidate_target_problems,
    discover_candidates,
    next_patch_version,
    target_branch_for,
)
from .git import GitRepo
from .github import GitHubAPI, repository_path
from .models import PlanState

type Checkpoint = Callable[[PlanState], None]


def prepare_plan(
    api: GitHubAPI,
    git: GitRepo,
    repository: str,
    *,
    version: str | None = None,
    target_branch: str | None = None,
    worktree: Path | None = None,
    review_each: bool = False,
    candidate_numbers: list[int] | None = None,
) -> PlanState:
    if target_branch is not None and version is None:
        raise BackportError("--target-branch requires an explicit --version")

    repo = api.request("GET", repository_path(repository))
    if version is None:
        git.fetch_tags()
        selected_version = next_patch_version(git.run("tag", "--list").stdout.splitlines())
    else:
        selected_version = version
    branch = backport_branch_for(selected_version)
    selected_target = target_branch or target_branch_for(selected_version)
    if selected_target == repo["default_branch"]:
        raise BackportError(
            f"aggregate target {selected_target} is the repository's current development branch; select an earlier release or a staging branch",
        )
    if not git.remote_branch_exists(selected_target):
        raise BackportError(f"target branch does not exist on {git.remote}: {selected_target}")
    git.fetch_branches(selected_target, repo["default_branch"])

    candidates = discover_candidates(api, repository, candidate_numbers)
    if not candidates:
        message = "no PRs were selected" if candidate_numbers is not None else f"no merged PRs have the {BACKPORT_LABEL!r} label"
        raise BackportError(message)
    problems = candidate_policy_problems(
        candidates,
        version=selected_version,
        development_branch=repo["default_branch"],
        release_branch=target_branch_for(selected_version),
        explicit=candidate_numbers is not None,
    )
    if not problems:
        problems = candidate_target_problems(
            git,
            candidates,
            f"{git.remote}/{selected_target}",
        )
    if problems:
        raise BackportError(
            "candidate eligibility validation failed:\n- " + "\n- ".join(problems),
        )

    if git.remote_branch_exists(branch):
        raise BackportError(f"standard backport branch already exists on {git.remote}: {branch}")
    selected_worktree = (worktree or git.default_worktree(selected_version)).resolve()
    return PlanState(
        repository=repository,
        version=selected_version,
        target_branch=selected_target,
        branch=branch,
        worktree=str(selected_worktree),
        base_sha=git.rev_parse(f"{git.remote}/{selected_target}"),
        candidates=candidates,
        review_each=review_each,
        remote=git.remote,
    )


def advance_plan(
    git: GitRepo,
    state: PlanState,
    checkpoint: Checkpoint | None = None,
) -> PlanState:
    if state.conflict is not None or state.review is not None or state.dedicated_conflict is not None:
        return state
    if not any(candidate.status == "pending" for candidate in state.candidates) and not any(commit.status == "pending" for commit in state.dedicated_commits):
        return state
    worktree = Path(state.worktree)
    if not git.is_clean(worktree):
        raise BackportError(f"backport worktree has uncommitted changes: {state.worktree}")

    for candidate in state.candidates:
        if candidate.status != "pending":
            continue
        pick_sha = candidate.replay_sha or candidate.merge_sha
        git.ensure_commit(pick_sha)
        candidate.status = "applying"
        _checkpoint(checkpoint, state)
        result = git.cherry_pick(
            worktree,
            pick_sha,
            record_origin=candidate.replay_sha is None,
        )
        if result.returncode != 0:
            candidate.status = "conflict"
            candidate.conflict_files = git.conflict_files(worktree)
            _checkpoint(checkpoint, state)
            return state
        candidate.status = "review" if state.review_each and candidate.replay_sha is None else "applied"
        candidate.backport_sha = git.head(worktree)
        candidate.conflict_files = []
        _checkpoint(checkpoint, state)
        if candidate.status == "review":
            return state
    return _advance_dedicated_commits(git, state, checkpoint)


def _advance_dedicated_commits(
    git: GitRepo,
    state: PlanState,
    checkpoint: Checkpoint | None,
) -> PlanState:
    worktree = Path(state.worktree)
    for commit in state.dedicated_commits:
        if commit.status != "pending":
            continue
        git.ensure_commit(commit.sha)
        commit.status = "applying"
        commit.previous_head = git.head(worktree)
        _checkpoint(checkpoint, state)
        result = git.cherry_pick(worktree, commit.sha, record_origin=False)
        if result.returncode != 0:
            commit.status = "conflict"
            commit.conflict_files = git.conflict_files(worktree)
            _checkpoint(checkpoint, state)
            return state
        commit.status = "applied"
        commit.backport_sha = git.head(worktree)
        commit.previous_head = None
        commit.conflict_files = []
        _checkpoint(checkpoint, state)
    return state


def accept_candidate(
    git: GitRepo,
    state: PlanState,
    number: int,
    checkpoint: Checkpoint | None = None,
) -> PlanState:
    candidate = state.candidate(number)
    if candidate.status != "review" or state.review is not candidate:
        raise BackportError(f"PR #{number} is not awaiting clean-pick review")
    if candidate.backport_sha != git.head(Path(state.worktree)):
        raise BackportError("worktree HEAD no longer matches the clean cherry-pick under review")
    candidate.status = "applied"
    _checkpoint(checkpoint, state)
    return advance_plan(git, state, checkpoint)


def continue_plan(
    git: GitRepo,
    state: PlanState,
    checkpoint: Checkpoint | None = None,
) -> PlanState:
    candidate = state.conflict
    if candidate is None:
        raise BackportError("there is no conflicted cherry-pick to continue")
    backport_sha = _continue_cherry_pick(
        git,
        Path(state.worktree),
        f"cherry-pick for #{candidate.number}",
    )
    candidate.status = "applied"
    candidate.backport_sha = backport_sha
    candidate.adapted = True
    candidate.conflict_files = []
    _checkpoint(checkpoint, state)
    return advance_plan(git, state, checkpoint)


def continue_dedicated_commit(
    git: GitRepo,
    state: PlanState,
    checkpoint: Checkpoint | None = None,
) -> PlanState:
    commit = state.dedicated_conflict
    if commit is None:
        raise BackportError("there is no conflicted dedicated commit to continue")
    backport_sha = _continue_cherry_pick(
        git,
        Path(state.worktree),
        f"dedicated commit {commit.sha[:12]}",
    )
    commit.status = "applied"
    commit.backport_sha = backport_sha
    commit.previous_head = None
    commit.conflict_files = []
    _checkpoint(checkpoint, state)
    return advance_plan(git, state, checkpoint)


def _continue_cherry_pick(
    git: GitRepo,
    worktree: Path,
    description: str,
) -> str:
    diff_check = git.diff_check(worktree)
    if diff_check.returncode != 0:
        detail = diff_check.stdout.strip() or diff_check.stderr.strip()
        raise BackportError(
            "resolve conflict markers and patch errors before continuing:\n" + detail,
        )
    if not git.cherry_pick_in_progress(worktree):
        raise BackportError(
            "Git no longer has a cherry-pick in progress; inspect the worktree manually",
        )
    result = git.continue_cherry_pick(worktree)
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        raise BackportError(f"could not continue {description}: {detail}")
    return git.head(worktree)


def reject_candidate(
    git: GitRepo,
    state: PlanState,
    number: int,
    reason: str,
    checkpoint: Checkpoint | None = None,
) -> PlanState:
    candidate = state.candidate(number)
    reason = reason.strip()
    if not reason:
        raise BackportError("a rejection reason is required")

    worktree = Path(state.worktree)
    if candidate.status in {"conflict", "applying"}:
        if state.conflict is not candidate:
            raise BackportError("another cherry-pick is currently in conflict")
        git.abort_cherry_pick(worktree)
    elif candidate.status == "review":
        if state.review is not candidate:
            raise BackportError("another clean cherry-pick is awaiting review")
        if candidate.backport_sha != git.head(worktree):
            raise BackportError(
                "worktree HEAD no longer matches the clean cherry-pick under review",
            )
        git.reset_hard(worktree, f"{candidate.backport_sha}^")
    else:
        raise BackportError(f"cannot reject candidate in state {candidate.status!r}")

    candidate.status = "rejected"
    candidate.reject_reason = reason
    candidate.backport_sha = None
    candidate.conflict_files = []
    _checkpoint(checkpoint, state)
    return advance_plan(git, state, checkpoint)


def resume_plan(
    git: GitRepo,
    state: PlanState,
    checkpoint: Checkpoint | None = None,
) -> PlanState:
    """Validate a local checkpoint and reconcile an interrupted cherry-pick."""
    if state.remote != git.remote:
        raise BackportError(
            f"saved plan uses Git remote {state.remote!r}; rerun with --remote {state.remote}",
        )
    worktree = Path(state.worktree)
    if not worktree.is_dir():
        raise BackportError(f"saved backport worktree no longer exists: {worktree}")
    if state.detached_worktree and not git.is_detached(worktree):
        raise BackportError("saved update worktree is no longer detached")
    if not state.detached_worktree and not git.branch_exists(state.branch):
        raise BackportError(f"saved local branch no longer exists: {state.branch}")
    if not state.detached_worktree and git.current_branch(worktree) != state.branch:
        raise BackportError(
            f"saved worktree is not on {state.branch}: {git.current_branch(worktree)}",
        )

    head = git.head(worktree)
    if not git.is_ancestor(state.base_sha, head, worktree):
        raise BackportError("saved backport branch no longer contains its recorded base commit")
    _validate_candidate_sequence(git, state, head)

    candidate = state.conflict
    if candidate is not None:
        if git.cherry_pick_in_progress(worktree):
            cherry_pick_sha = git.rev_parse("CHERRY_PICK_HEAD", cwd=worktree)
            pick_sha = candidate.replay_sha or candidate.merge_sha
            if cherry_pick_sha != pick_sha:
                raise BackportError(
                    f"worktree is cherry-picking {cherry_pick_sha}, not PR #{candidate.number}",
                )
            candidate.status = "conflict"
            candidate.conflict_files = git.conflict_files(worktree)
            _checkpoint(checkpoint, state)
            return state

        origin = _cherry_pick_origin(git.commit_message(worktree))
        if origin == candidate.merge_sha:
            was_conflict = candidate.status == "conflict"
            candidate.status = "review" if state.review_each and candidate.replay_sha is None else "applied"
            candidate.backport_sha = head
            candidate.adapted = candidate.adapted or was_conflict
            candidate.conflict_files = []
            _checkpoint(checkpoint, state)
            return state if candidate.status == "review" else advance_plan(git, state, checkpoint)

        if not git.is_clean(worktree):
            raise BackportError(
                f"saved worktree has changes but no cherry-pick is active: {state.worktree}",
            )
        candidate.status = "pending"
        candidate.conflict_files = []
        _checkpoint(checkpoint, state)

    review = state.review
    if review is not None:
        if review.backport_sha != head:
            raise BackportError("saved clean-pick review no longer matches worktree HEAD")
        if not git.is_clean(worktree):
            raise BackportError("saved clean-pick review has unexpected worktree changes")
        return state

    dedicated = state.dedicated_conflict
    if dedicated is not None:
        if git.cherry_pick_in_progress(worktree):
            cherry_pick_sha = git.rev_parse("CHERRY_PICK_HEAD", cwd=worktree)
            if cherry_pick_sha != dedicated.sha:
                raise BackportError(
                    f"worktree is cherry-picking {cherry_pick_sha}, not dedicated commit {dedicated.sha}",
                )
            dedicated.status = "conflict"
            dedicated.conflict_files = git.conflict_files(worktree)
            _checkpoint(checkpoint, state)
            return state

        if dedicated.previous_head is None:
            raise BackportError("saved dedicated commit has no recorded starting point")
        if head != dedicated.previous_head:
            if git.rev_parse("HEAD^", cwd=worktree) != dedicated.previous_head:
                raise BackportError("saved dedicated commit no longer matches worktree HEAD")
            dedicated.status = "applied"
            dedicated.backport_sha = head
            dedicated.previous_head = None
            dedicated.conflict_files = []
            _checkpoint(checkpoint, state)
            return advance_plan(git, state, checkpoint)
        if not git.is_clean(worktree):
            raise BackportError(
                f"saved worktree has changes but no cherry-pick is active: {state.worktree}",
            )
        dedicated.status = "pending"
        dedicated.previous_head = None
        dedicated.conflict_files = []
        _checkpoint(checkpoint, state)

    return advance_plan(git, state, checkpoint)


def _validate_candidate_sequence(git: GitRepo, state: PlanState, head: str) -> None:
    active = [candidate for candidate in state.candidates if candidate.status in {"applying", "conflict", "review"}]
    if len(active) > 1:
        raise BackportError("saved plan contains more than one active candidate")

    unfinished_seen = False
    backport_shas: set[str] = set()
    for candidate in state.candidates:
        if candidate.status in {"pending", "applying", "conflict", "review"}:
            unfinished_seen = True
        elif candidate.status == "applied" and unfinished_seen:
            raise BackportError("saved plan has decided candidates after unfinished candidates")

        if candidate.status in {"applied", "review"}:
            if candidate.backport_sha is None:
                raise BackportError(f"saved PR #{candidate.number} has no backport commit")
            if candidate.backport_sha in backport_shas:
                raise BackportError("saved plan assigns one backport commit to multiple PRs")
            backport_shas.add(candidate.backport_sha)
            if not git.is_ancestor(candidate.backport_sha, head, Path(state.worktree)):
                raise BackportError(
                    f"saved backport commit for PR #{candidate.number} is no longer in the branch",
                )
        elif candidate.backport_sha is not None:
            raise BackportError(
                f"saved PR #{candidate.number} unexpectedly has a backport commit",
            )
        if candidate.status == "rejected" and not candidate.reject_reason:
            raise BackportError(f"saved rejection for PR #{candidate.number} has no reason")

    unfinished_dedicated_seen = False
    dedicated_shas: set[str] = set()
    for commit in state.dedicated_commits:
        if commit.status in {"pending", "applying", "conflict"}:
            unfinished_dedicated_seen = True
        elif unfinished_dedicated_seen:
            raise BackportError("saved plan has applied dedicated commits after unfinished commits")

        if commit.status == "applied":
            if commit.backport_sha is None:
                raise BackportError(
                    f"saved dedicated commit {commit.sha[:12]} has no replayed commit",
                )
            if commit.backport_sha in dedicated_shas:
                raise BackportError("saved plan assigns one replayed commit more than once")
            dedicated_shas.add(commit.backport_sha)
            if not git.is_ancestor(commit.backport_sha, head, Path(state.worktree)):
                raise BackportError(
                    f"saved replay of dedicated commit {commit.sha[:12]} is no longer in the branch",
                )
        elif commit.backport_sha is not None:
            raise BackportError(
                f"saved dedicated commit {commit.sha[:12]} unexpectedly has a replayed commit",
            )
        if commit.status in {"applying", "conflict"} and commit.previous_head is None:
            raise BackportError(
                f"saved dedicated commit {commit.sha[:12]} has no recorded starting point",
            )

    if any(commit.status != "pending" for commit in state.dedicated_commits) and any(
        candidate.status not in {"applied", "rejected"} for candidate in state.candidates
    ):
        raise BackportError("saved plan started dedicated commits before deciding every PR")


def _cherry_pick_origin(message: str) -> str | None:
    matches = CHERRY_PICK_ORIGIN_RE.findall(message)
    return matches[-1] if matches else None


def _checkpoint(checkpoint: Checkpoint | None, state: PlanState) -> None:
    if checkpoint is not None:
        checkpoint(state)


def cleanup_plan(git: GitRepo, state: PlanState) -> list[str]:
    worktree = Path(state.worktree)
    if not worktree.exists():
        return []
    git.abort_cherry_pick(worktree)
    if state.detached_worktree:
        return git.remove_worktree(worktree)
    return git.remove_worktree_and_branch(worktree, state.branch)


def ensure_publishable(git: GitRepo, state: PlanState) -> None:
    unfinished = [candidate for candidate in state.candidates if candidate.status not in {"applied", "rejected"}]
    if unfinished:
        rendered = ", ".join(f"#{candidate.number}" for candidate in unfinished)
        raise BackportError(f"plan still has unresolved candidates: {rendered}")
    unfinished_commits = [commit for commit in state.dedicated_commits if commit.status != "applied"]
    if unfinished_commits:
        rendered = ", ".join(commit.sha[:12] for commit in unfinished_commits)
        raise BackportError(f"plan still has unresolved dedicated commits: {rendered}")
    if not state.accepted:
        raise BackportError("there are no accepted PRs to publish")
    if not git.is_clean(Path(state.worktree)):
        raise BackportError("backport worktree has uncommitted changes")

    branch_commits = set(git.commits_since(Path(state.worktree), state.base_sha))
    missing = [candidate.number for candidate in state.accepted if candidate.backport_sha not in branch_commits]
    if missing:
        raise BackportError(
            "recorded backport commits are no longer in branch history: " + ", ".join(f"#{number}" for number in missing),
        )
    missing_commits = [commit.sha[:12] for commit in state.dedicated_commits if commit.backport_sha not in branch_commits]
    if missing_commits:
        raise BackportError(
            "replayed dedicated commits are no longer in branch history: " + ", ".join(missing_commits),
        )
