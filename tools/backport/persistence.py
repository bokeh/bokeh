"""Local checkpoint storage for an interrupted backport plan."""

# Standard library imports
import json
from dataclasses import asdict, fields
from pathlib import Path
from types import UnionType
from typing import Any, cast, get_args, get_origin, get_type_hints

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
    state = _decode_dataclass(PlanState, raw)
    for candidate in state.candidates:
        if candidate.status not in VALID_CANDIDATE_STATES:
            raise ValueError(f"unknown candidate state {candidate.status!r}")
        _validate_sha("merge_sha", candidate.merge_sha)
        _validate_sha("backport_sha", candidate.backport_sha)
        _validate_sha("replay_sha", candidate.replay_sha)
    for commit in state.dedicated_commits:
        if commit.status not in {"pending", "applying", "conflict", "applied"}:
            raise ValueError(f"unknown dedicated commit state {commit.status!r}")
        _validate_sha("sha", commit.sha)
        _validate_sha("backport_sha", commit.backport_sha)
        _validate_sha("previous_head", commit.previous_head)
    _validate_sha("base_sha", state.base_sha)
    return state


def _decode_dataclass[T](model: type[T], raw: Any) -> T:
    if not isinstance(raw, dict):
        raise TypeError(f"{model.__name__} must be an object")
    model_fields = fields(cast(Any, model))
    expected = {field.name for field in model_fields}
    if set(raw) != expected:
        missing = sorted(expected - set(raw))
        extra = sorted(set(raw) - expected)
        raise ValueError(f"{model.__name__} fields differ; missing={missing}, extra={extra}")
    hints = get_type_hints(model)
    values = {field.name: _decode_value(hints[field.name], raw[field.name], field.name) for field in model_fields}
    return model(**values)


def _decode_value(annotation: Any, value: Any, name: str) -> Any:
    origin = get_origin(annotation)
    if origin is list:
        if not isinstance(value, list):
            raise TypeError(f"{name} must be list")
        item_type = get_args(annotation)[0]
        return [_decode_value(item_type, item, name) for item in value]
    if origin is UnionType:
        options = get_args(annotation)
        if value is None and type(None) in options:
            return None
        concrete = [option for option in options if option is not type(None)]
        if len(concrete) == 1:
            return _decode_value(concrete[0], value, name)
    if annotation in {PlanState, Candidate, DedicatedCommit, IssueRef}:
        return _decode_dataclass(annotation, value)
    if annotation is int:
        if not isinstance(value, int) or isinstance(value, bool):
            raise TypeError(f"{name} must be int")
        return value
    if annotation in {str, bool} and not isinstance(value, annotation):
        raise TypeError(f"{name} must be {annotation.__name__}")
    return value


def _validate_sha(name: str, value: str | None) -> None:
    if value is not None and (len(value) != 40 or any(character not in "0123456789abcdef" for character in value)):
        raise ValueError(f"{name} must be a full lowercase commit SHA")
