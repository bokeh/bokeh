# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import json
import subprocess
from typing import Any

# External imports
import pytest

# Bokeh imports
from tools.ci import notify_full_ci as notify


class FakeGh:
    def __init__(self) -> None:
        self.jobs: list[dict[str, Any]] = [
            {"id": index, "name": f"job-{index}", "conclusion": "success"} for index in range(1, 126)
        ]
        self.pr_number = "456"
        self.api_error = False
        self.calls: list[tuple[str, ...]] = []
        self.posts: list[tuple[tuple[str, ...], str]] = []

    def __call__(self, *args: str, input: str | None = None) -> str:
        self.calls.append(args)
        if args[:2] == ("pr", "list"):
            return self.pr_number
        if args[:2] in [("pr", "comment"), ("api", "graphql")]:
            assert input is not None
            self.posts.append((args, input))
            return ""
        assert args[0] == "api"
        assert "/repos/bokeh/bokeh/actions/runs/123/jobs" in args
        if self.api_error:
            raise subprocess.CalledProcessError(1, ["gh", *args], output='[{"jobs": []}', stderr="API failed")
        pages = [{"total_count": len(self.jobs), "jobs": self.jobs[offset:offset + 30]}
                 for offset in range(0, len(self.jobs), 30)]
        if "--paginate" not in args:
            pages = pages[:1]
        return json.dumps(pages if "--slurp" in args else pages[0])


@pytest.fixture
def cli(monkeypatch: pytest.MonkeyPatch) -> FakeGh:
    gh = FakeGh()
    monkeypatch.setattr(notify, "gh", gh)
    monkeypatch.setattr(notify.time, "sleep", lambda _: None)
    for name, value in {
        "GITHUB_REPOSITORY": "bokeh/bokeh",
        "GITHUB_RUN_ID": "123",
        "GITHUB_REF_NAME": "topic",
        "GITHUB_SERVER_URL": "https://github.com",
        "RUN_REASON": "Pagination regression test",
    }.items():
        monkeypatch.setenv(name, value)
    return gh


def test_reports_success_after_reading_all_pages(cli: FakeGh) -> None:
    cli.jobs.extend([
        {"name": "notify-pr", "conclusion": "cancelled"},
        {"name": "notify-nightly-failure", "conclusion": "failure"},
    ])

    assert notify.main(["pr"]) == 0
    assert len(cli.posts) == 1
    assert "All jobs succeeded" in cli.posts[0][1]
    reads = [args for args in cli.calls if args[0] == "api"]
    assert len(reads) == 1
    assert "--paginate" in reads[0]
    assert "--slurp" in reads[0]


@pytest.mark.parametrize("failures", [(41, 46), (1, 41, 125)])
def test_reports_failures_across_all_pages(cli: FakeGh, failures: tuple[int, ...]) -> None:
    for index in failures:
        cli.jobs[index - 1]["conclusion"] = "failure"

    assert notify.main(["pr"]) == 0
    assert len(cli.posts) == 1
    body = cli.posts[0][1]
    assert f"{len(failures)} job(s) failed" in body
    assert "All jobs succeeded" not in body
    for index in failures:
        assert f"**job-{index}**" in body
        assert f"https://github.com/bokeh/bokeh/actions/runs/123/job/{index}" in body


def test_skips_comment_for_cancellation_on_later_page(cli: FakeGh) -> None:
    cli.jobs[0]["conclusion"] = "failure"
    cli.jobs[40]["conclusion"] = "cancelled"

    assert notify.main(["pr"]) == 0
    assert cli.posts == []


@pytest.mark.parametrize("mode", ["pr", "nightly"])
def test_does_not_post_after_partial_api_failure(cli: FakeGh, mode: str) -> None:
    cli.api_error = True

    assert notify.main([mode]) == 1
    assert cli.posts == []


def test_nightly_lists_failures_on_later_pages(cli: FakeGh) -> None:
    cli.jobs[40]["conclusion"] = cli.jobs[124]["conclusion"] = "failure"

    assert notify.main(["nightly"]) == 0
    assert len(cli.posts) == 1
    args, data = cli.posts[0]
    assert args == ("api", "graphql", "--input", "-")
    payload = json.loads(data)
    body = payload["variables"]["body"]
    assert "- `job-41`" in body
    assert "- `job-125`" in body


def test_skips_comment_without_associated_pr(cli: FakeGh) -> None:
    cli.pr_number = ""
    cli.api_error = True

    assert notify.main(["pr"]) == 0
    assert len(cli.calls) == 1
    assert cli.calls[0][:2] == ("pr", "list")
    assert cli.posts == []


def test_passes_reason_literally_in_comment_body(cli: FakeGh, monkeypatch: pytest.MonkeyPatch) -> None:
    reason = 'Check "quotes", $(commands), `backticks`, and $variables\nwith another line'
    monkeypatch.setenv("RUN_REASON", reason)

    assert notify.main(["pr"]) == 0
    args, body = cli.posts[0]
    assert args == ("pr", "comment", "456", "--repo", "bokeh/bokeh", "--body-file", "-")
    assert reason in body
    assert "https://github.com/bokeh/bokeh/actions/runs/123" in body


def test_gh_preserves_stdin_and_propagates_subprocess_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    body = "Multiline body\nwith `backticks` and $(commands)"
    calls: list[tuple[list[str], dict[str, Any]]] = []

    def run(args: list[str], **kwargs: Any) -> subprocess.CompletedProcess[str]:
        calls.append((args, kwargs))
        raise subprocess.CalledProcessError(1, args, stderr="API failed")

    monkeypatch.setattr(notify.subprocess, "run", run)
    with pytest.raises(subprocess.CalledProcessError):
        notify.gh("pr", "comment", "456", "--body-file", "-", input=body)

    args, kwargs = calls[0]
    assert args == ["gh", "pr", "comment", "456", "--body-file", "-"]
    assert kwargs["input"] == body
    assert kwargs["check"] is True
    assert kwargs["encoding"] == "utf-8"
    assert not kwargs.get("shell", False)
