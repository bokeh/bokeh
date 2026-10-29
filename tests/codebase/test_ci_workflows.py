# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import pytest
import yaml

from tests.support.util.project import TOP_PATH

WORKFLOWS = {
    "bokeh-ci.yml": "Bokeh-CI / result",
    "bokehjs-ci.yml": "BokehJS-CI / result",
}

ROUTED_JOBS = {
    "bokeh-ci.yml": {
        "build": "build",
        "codebase": "codebase",
        "tools": "tools",
        "typing": "typing",
        "examples": "examples",
        "unit-test": "unit_test",
        "minimal-deps": "minimal_deps",
        "core-deps": "core_deps",
        "documentation": "documentation",
    },
    "bokehjs-ci.yml": {
        "test": "bokehjs",
    },
}


def _load_workflow(filename: str) -> dict[str, Any]:
    with open(TOP_PATH / ".github" / "workflows" / filename, encoding="utf-8") as f:
        return yaml.load(f, Loader=yaml.BaseLoader)


@pytest.mark.parametrize("filename", WORKFLOWS)
def test_standard_ci_uses_unambiguous_pr_and_merge_group_events(filename: str) -> None:
    workflow = _load_workflow(filename)
    events = workflow["on"]

    assert events["pull_request"]["types"] == ["opened", "synchronize", "reopened"]
    assert events["merge_group"]["types"] == ["checks_requested"]

    concurrency = workflow["concurrency"]
    assert concurrency["group"] == "${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}"
    assert concurrency["cancel-in-progress"] == "${{ github.event_name == 'pull_request' }}"


@pytest.mark.parametrize(("filename", "result_name"), WORKFLOWS.items())
def test_standard_ci_routes_paths_without_label_overrides(filename: str, result_name: str) -> None:
    workflow = _load_workflow(filename)
    jobs = workflow["jobs"]
    changes = jobs["changes"]
    result = jobs["result"]

    classifier = next(step for step in changes["steps"] if step.get("name") == "Classify changed paths")
    assert classifier["with"]["filters"] == ".github/ci-path-filters.yml"

    select_full = next(step for step in changes["steps"] if step.get("name") == "Select full CI")
    assert "label" not in select_full["if"]
    assert "github.event_name != 'pull_request'" in select_full["if"]
    assert "steps.filter.outputs.full == 'true'" in select_full["if"]
    assert "steps.filter.outputs.ci == 'true'" in select_full["if"]

    for job_name, output in ROUTED_JOBS[filename].items():
        assert f"needs.changes.outputs.{output} == 'true'" in jobs[job_name]["if"]

    assert result["name"] == result_name
    assert set(result["needs"]) == set(jobs) - {"result"}

    aggregate = next(step for step in result["steps"] if step["name"] == "Require every selected job to pass")
    assert 'changes.result == "success"' in aggregate["run"]
    assert 'result == "skipped"' in aggregate["run"]


def test_codeql_runs_for_merge_groups() -> None:
    workflow = _load_workflow("codeql-analysis.yml")

    assert workflow["on"]["merge_group"]["types"] == ["checks_requested"]


@pytest.mark.parametrize("path", sorted((TOP_PATH / ".github").rglob("*.yml")) + sorted((TOP_PATH / ".github").rglob("*.yaml")))
def test_external_actions_are_pinned_to_commit_shas(path: Path) -> None:
    def check(value: Any) -> None:
        if isinstance(value, dict):
            if "uses" in value:
                action = value["uses"]
                if not action.startswith("./"):
                    assert re.fullmatch(r"[^@\s]+@[0-9a-f]{40}", action), f"{path}: {action} must use a full commit SHA"
            for item in value.values():
                check(item)
        elif isinstance(value, list):
            for item in value:
                check(item)

    check(yaml.load(path.read_text(encoding="utf-8"), Loader=yaml.BaseLoader))
