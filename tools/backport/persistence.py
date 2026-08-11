"""Local checkpoint storage for an interrupted backport plan."""

# Standard library imports
import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

# Bokeh imports
from . import BackportError
from .git import GitRepo
from .models import (
    Candidate,
    DedicatedCommit,
    IssueRef,
    PlanState,
)

STATE_SCHEMA = 5
STATE_FILENAME = "backport-plan.json"
VALID_CANDIDATE_STATES = {"pending", "applying", "conflict", "review", "applied", "rejected"}


def state_path(git: GitRepo) -> Path:
    return git.common_dir() / STATE_FILENAME


def saved_plan_exists(git: GitRepo) -> bool:
    return state_path(git).is_file()


def save_plan(git: GitRepo, state: PlanState) -> Path:
    if state.remote != git.remote:
        raise BackportError(
            f"plan uses Git remote {state.remote!r}, but this run uses {git.remote!r}",
        )
    path = state_path(git)
    temporary = path.with_suffix(".tmp")
    payload = {
        "schema": STATE_SCHEMA,
        "plan": asdict(state),
    }
    temporary.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    temporary.replace(path)
    return path


def load_plan(git: GitRepo) -> PlanState:
    path = state_path(git)
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise BackportError("there is no saved plan to resume") from None
    except (OSError, json.JSONDecodeError) as error:
        raise BackportError(f"could not read saved plan {path}: {error}") from error

    if not isinstance(payload, dict) or payload.get("schema") != STATE_SCHEMA:
        raise BackportError(f"saved plan {path} uses an unsupported format")
    raw = payload.get("plan")
    if not isinstance(raw, dict):
        raise BackportError(f"saved plan {path} has no plan data")

    try:
        state = _decode_plan(raw)
    except (KeyError, TypeError, ValueError) as error:
        raise BackportError(f"saved plan {path} is invalid: {error}") from error
    if state.remote != git.remote:
        raise BackportError(
            f"saved plan uses Git remote {state.remote!r}; rerun with --remote {state.remote}",
        )
    return state


def clear_plan(git: GitRepo) -> None:
    state_path(git).unlink(missing_ok=True)


def _decode_plan(raw: dict[str, Any]) -> PlanState:
    candidates = [_decode_candidate(item) for item in _list(raw, "candidates")]
    return PlanState(
        repository=_string(raw, "repository"),
        version=_string(raw, "version"),
        target_branch=_string(raw, "target_branch"),
        branch=_string(raw, "branch"),
        worktree=_string(raw, "worktree"),
        base_sha=_sha(raw, "base_sha"),
        candidates=candidates,
        review_each=_boolean(raw, "review_each"),
        remote=_string(raw, "remote"),
        detached_worktree=_boolean(raw, "detached_worktree"),
        pull_request_number=_optional_integer(raw, "pull_request_number"),
        pull_request_url=_optional_string(raw, "pull_request_url"),
        dedicated_commits=[_decode_dedicated_commit(item) for item in _list(raw, "dedicated_commits")],
    )


def _decode_candidate(raw: Any) -> Candidate:
    if not isinstance(raw, dict):
        raise TypeError("candidate must be an object")
    status = _string(raw, "status")
    if status not in VALID_CANDIDATE_STATES:
        raise ValueError(f"unknown candidate state {status!r}")
    raw_issues = _list(raw, "issues")
    if not all(isinstance(issue, dict) for issue in raw_issues):
        raise TypeError("issues must contain only objects")
    issues = [
        IssueRef(
            number=_integer(issue, "number"),
            issue_type=_optional_string(issue, "issue_type"),
        )
        for issue in raw_issues
    ]
    return Candidate(
        number=_integer(raw, "number"),
        title=_string(raw, "title"),
        url=_string(raw, "url"),
        merged_at=_string(raw, "merged_at"),
        merge_sha=_sha(raw, "merge_sha"),
        base_branch=_string(raw, "base_branch"),
        labels=_strings(raw, "labels"),
        milestone=_optional_string(raw, "milestone"),
        issues=issues,
        status=status,
        backport_sha=_optional_sha(raw, "backport_sha"),
        replay_sha=_optional_sha(raw, "replay_sha"),
        adapted=_boolean(raw, "adapted"),
        conflict_files=_strings(raw, "conflict_files"),
        reject_reason=_optional_string(raw, "reject_reason"),
    )


def _decode_dedicated_commit(raw: Any) -> DedicatedCommit:
    if not isinstance(raw, dict):
        raise TypeError("dedicated commit must be an object")
    status = _string(raw, "status")
    if status not in {"pending", "applying", "conflict", "applied"}:
        raise ValueError(f"unknown dedicated commit state {status!r}")
    return DedicatedCommit(
        sha=_sha(raw, "sha"),
        subject=_string(raw, "subject"),
        status=status,
        backport_sha=_optional_sha(raw, "backport_sha"),
        previous_head=_optional_sha(raw, "previous_head"),
        conflict_files=_strings(raw, "conflict_files"),
    )


def _value(raw: dict[str, Any], key: str, expected: type) -> Any:
    value = raw[key]
    if not isinstance(value, expected):
        raise TypeError(f"{key} must be {expected.__name__}")
    return value


def _string(raw: dict[str, Any], key: str) -> str:
    return _value(raw, key, str)


def _integer(raw: dict[str, Any], key: str) -> int:
    value = _value(raw, key, int)
    if isinstance(value, bool):
        raise TypeError(f"{key} must be int")
    return value


def _optional_integer(raw: dict[str, Any], key: str) -> int | None:
    value = raw[key]
    if value is None:
        return None
    if not isinstance(value, int) or isinstance(value, bool):
        raise TypeError(f"{key} must be int or null")
    return value


def _boolean(raw: dict[str, Any], key: str) -> bool:
    return _value(raw, key, bool)


def _list(raw: dict[str, Any], key: str) -> list[Any]:
    return _value(raw, key, list)


def _strings(raw: dict[str, Any], key: str) -> list[str]:
    values = _list(raw, key)
    if not all(isinstance(value, str) for value in values):
        raise TypeError(f"{key} must contain only strings")
    return values


def _optional_string(raw: dict[str, Any], key: str) -> str | None:
    value = raw[key]
    if value is not None and not isinstance(value, str):
        raise TypeError(f"{key} must be str or null")
    return value


def _sha(raw: dict[str, Any], key: str) -> str:
    value = _string(raw, key)
    if len(value) != 40 or any(character not in "0123456789abcdef" for character in value):
        raise ValueError(f"{key} must be a full lowercase commit SHA")
    return value


def _optional_sha(raw: dict[str, Any], key: str) -> str | None:
    return None if raw[key] is None else _sha(raw, key)
