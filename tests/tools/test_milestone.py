from __future__ import annotations

# Standard library imports
from importlib import import_module
from pathlib import Path
from typing import Any

# External imports
import pytest
from click.testing import CliRunner

milestone = import_module("tools.milestone")


def item(
    kind: str,
    *,
    issue_type: str | None = None,
    labels: tuple[str, ...] = (),
    number: int = 123,
    state: str = "CLOSED",
    title: str = "Issue title",
) -> dict[str, Any]:
    node: dict[str, Any] = {
        "labels": {"edges": [{"node": {"name": label}} for label in labels]},
        "number": number,
        "state": state,
        "title": title,
    }
    if kind == "issues":
        node["issueType"] = None if issue_type is None else {"name": issue_type}
    return {
        "kind": kind,
        "node": node,
    }


class Response:
    status_code = 200
    text = "response body"

    def __init__(self, payload: dict[str, Any]) -> None:
        self.payload = payload

    def json(self) -> dict[str, Any]:
        return self.payload


def test_query_github_returns_data(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, dict[str, Any]]] = []
    payload = {"data": {"repository": {"name": "bokeh"}}}

    def post(url: str, **kwargs: Any) -> Response:
        calls.append((url, kwargs))
        return Response(payload)

    monkeypatch.setattr(milestone.requests, "post", post)

    result = milestone.query_github("query", "token")

    assert result == payload["data"]
    assert calls == [(
        "https://api.github.com/graphql",
        {"json": {"query": "query"}, "headers": {"Authorization": "Bearer token"}},
    )]


def test_query_github_reports_errors(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    payload = {
        "errors": [{"path": ["repository", "milestone"], "message": "not found"}],
    }
    monkeypatch.setattr(milestone.requests, "post", lambda *args, **kwargs: Response(payload))

    result = milestone.query_github("query", "token")

    assert result is None
    assert capsys.readouterr().err == "error: repository/milestone: not found\n"


def test_label_helpers_and_description() -> None:
    data = item(
        "issues",
        issue_type="Feature",
        labels=("type: feature", "tag: component: server"),
        number=321,
        title="A descriptive title",
    )

    assert milestone.get_labels(data) == ["type: feature", "tag: component: server"]
    assert milestone.get_label_type(data) == "feature"
    assert milestone.get_label_component(data) == "server"
    assert milestone.description(data) == "#321 [component: server] A descriptive title"


def test_get_type_uses_native_issue_type() -> None:
    data = item("issues", issue_type="Bug", labels=("type: feature",))

    assert milestone.get_type(data) == "bug"


def test_get_type_uses_label_for_pull_request() -> None:
    data = item("pullRequests", labels=("type: task",))

    assert milestone.get_type(data) == "task"


def test_get_type_returns_none_without_a_type() -> None:
    assert milestone.get_type(item("issues")) is None
    assert milestone.get_type(item("pullRequests")) is None


def test_check_issue_accepts_compliant_issue() -> None:
    problems: list[str] = []

    milestone.check_issue(item("issues", issue_type="Task", labels=("reso: completed",)), problems)

    assert problems == []


@pytest.mark.parametrize(
    ("issue_type", "expected"),
    [
        (None, "issue does not have a type: #123 Issue title"),
        ("Discussion", "issue has an invalid type: #123 Issue title"),
    ],
)
def test_check_issue_requires_valid_type(issue_type: str | None, expected: str) -> None:
    problems: list[str] = []

    milestone.check_issue(item("issues", issue_type=issue_type, labels=("reso: completed",)), problems)

    assert problems == [expected]


def test_check_issue_reports_all_problems() -> None:
    data = item(
        "issues",
        labels=(
            "reso: duplicate",
            "reso: invalid",
            "status: pending",
            "TRIAGE",
        ),
        state="OPEN",
    )
    problems: list[str] = []

    milestone.check_issue(data, problems)

    assert problems == [
        "issue not closed: #123 Issue title",
        "issue missing resolution: #123 Issue title",
        "issue has too many resolutions: #123 Issue title",
        "issue has a status: #123 Issue title",
        "issue does not have a type: #123 Issue title",
        "issue is in triage: #123 Issue title",
    ]


def test_check_pr_accepts_regular_pr_without_type_or_resolution() -> None:
    problems: list[str] = []

    milestone.check_pr(item("pullRequests", labels=("status: accepted",), state="MERGED"), problems)

    assert problems == []


def test_check_pr_rejects_multiple_types() -> None:
    problems: list[str] = []
    data = item(
        "pullRequests",
        labels=("status: accepted", "type: bug", "type: feature", "reso: completed"),
        state="MERGED",
    )

    milestone.check_pr(data, problems)

    assert problems == ["PR has multiple types: #123 Issue title"]


def test_check_pr_reports_all_problems() -> None:
    data = item(
        "pullRequests",
        labels=(
            "status: pending",
            "status: rejected",
            "type: discussion",
            "reso: duplicate",
            "reso: invalid",
            "TRIAGE",
        ),
        state="OPEN",
    )
    problems: list[str] = []

    milestone.check_pr(data, problems)

    assert problems == [
        "PR not merged: #123 Issue title",
        "PR missing status: #123 Issue title",
        "issue PR missing resolution: #123 Issue title",
        "issue PR has too many resolutions: #123 Issue title",
        "PR has too many statuses: #123 Issue title",
        "PR has an invalid type: #123 Issue title",
        "PR is in triage: #123 Issue title",
    ]


def test_get_milestone_number_follows_pagination(monkeypatch: pytest.MonkeyPatch) -> None:
    queries: list[str] = []
    responses = iter([
        {
            "repository": {
                "milestones": {
                    "edges": [{"node": {"number": 1, "title": "3.10"}}],
                    "pageInfo": {"endCursor": "next"},
                },
            },
        },
        {
            "repository": {
                "milestones": {
                    "edges": [{"node": {"number": 2, "title": "4.0"}}],
                    "pageInfo": {"endCursor": None},
                },
            },
        },
    ])

    def query_github(query: str, token: str) -> dict[str, Any]:
        queries.append(query)
        return next(responses)

    monkeypatch.setattr(milestone, "query_github", query_github)

    assert milestone.get_milestone_number("4.0", "token", allow_closed=False) == 2
    assert "states: OPEN" in queries[0]
    assert 'after: "next"' in queries[1]


def test_get_milestone_number_returns_none_for_missing_closed_milestone(monkeypatch: pytest.MonkeyPatch) -> None:
    queries: list[str] = []

    def query_github(query: str, token: str) -> dict[str, Any]:
        queries.append(query)
        return {
            "repository": {
                "milestones": {
                    "edges": [],
                    "pageInfo": {"endCursor": None},
                },
            },
        }

    monkeypatch.setattr(milestone, "query_github", query_github)

    assert milestone.get_milestone_number("4.0", "token", allow_closed=True) is None
    assert "states: OPEN" not in queries[0]


def test_get_milestone_number_exits_on_query_failure(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(milestone, "query_github", lambda *args: None)

    with pytest.raises(SystemExit) as error:
        milestone.get_milestone_number("4.0", "token", allow_closed=False)

    assert error.value.code == 1
    assert capsys.readouterr().err == "error: graphql query failure\n"


def test_get_milestone_items_follows_pagination(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(milestone, "get_milestone_number", lambda *args: 10)
    queries: list[str] = []

    def query_github(query: str, token: str) -> dict[str, Any]:
        queries.append(query)
        kind = "issues" if "issues(first:" in query else "pullRequests"
        if kind == "issues" and "after: null" in query:
            edges = [{"node": {"number": 1}}]
            end_cursor = "next"
        elif kind == "issues":
            edges = [{"node": {"number": 2}}]
            end_cursor = None
        else:
            edges = [{"node": {"number": 3}}]
            end_cursor = None
        return {
            "repository": {
                "milestone": {
                    kind: {
                        "edges": edges,
                        "pageInfo": {"endCursor": end_cursor},
                    },
                },
            },
        }

    monkeypatch.setattr(milestone, "query_github", query_github)

    items = milestone.get_milestone_items("4.0", "token", allow_closed=False)

    assert items is not None
    assert [data["kind"] for data in items] == ["issues", "issues", "pullRequests"]
    assert [data["node"]["number"] for data in items] == [1, 2, 3]
    assert any('after: "next"' in query for query in queries)
    assert all("issueType { name }" in query for query in queries[:2])
    assert "issueType { name }" not in queries[2]


def test_get_milestone_items_returns_none_for_missing_milestone(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(milestone, "get_milestone_number", lambda *args: None)

    assert milestone.get_milestone_items("4.0", "token", allow_closed=False) is None


def test_get_milestone_items_exits_on_query_failure(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(milestone, "get_milestone_number", lambda *args: 10)
    monkeypatch.setattr(milestone, "query_github", lambda *args: None)

    with pytest.raises(SystemExit) as error:
        milestone.get_milestone_items("4.0", "token", allow_closed=False)

    assert error.value.code == 1
    assert capsys.readouterr().err == "error: graphql query failure\n"


def test_main_requires_github_token() -> None:
    result = CliRunner().invoke(milestone.main, ["4.0"], env={"GH_TOKEN": ""})

    assert result.exit_code == 1
    assert "GH_TOKEN is not set" in result.stderr


def test_main_reports_missing_milestone(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(milestone, "get_milestone_items", lambda *args: None)

    result = CliRunner().invoke(milestone.main, ["4.0"], env={"GH_TOKEN": "token"})

    assert result.exit_code == 1
    assert "no such milestone: 4.0" in result.stderr


def test_main_reports_milestone_problems(monkeypatch: pytest.MonkeyPatch) -> None:
    data = item("issues", issue_type="Task", labels=("reso: completed",), state="OPEN")
    monkeypatch.setattr(milestone, "get_milestone_items", lambda *args: [data])

    result = CliRunner().invoke(milestone.main, ["4.0"], env={"GH_TOKEN": "token"})

    assert result.exit_code == 2
    assert "issue not closed: #123 Issue title" in result.stderr


def test_main_check_only_does_not_update_changelog(monkeypatch: pytest.MonkeyPatch) -> None:
    data = item("issues", issue_type="Task", labels=("reso: completed",))
    monkeypatch.setattr(milestone, "get_milestone_items", lambda *args: [data])

    result = CliRunner().invoke(milestone.main, ["--check-only", "4.0"], env={"GH_TOKEN": "token"})

    assert result.exit_code == 0


def test_main_updates_changelog(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    changelog_dir = tmp_path / "docs"
    changelog_dir.mkdir()
    (changelog_dir / "CHANGELOG").write_text("old changelog\n")
    items = [
        item("issues", issue_type="Bug", labels=("reso: completed",), number=1, title="Bug fix"),
        item("issues", issue_type="Feature", labels=("reso: completed",), number=2, title="Feature"),
        item("issues", issue_type="Task", labels=("reso: completed",), number=3, title="Task"),
        item("pullRequests", labels=("status: accepted",), number=4, state="MERGED", title="Untyped PR"),
    ]
    monkeypatch.setattr(milestone, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(milestone, "get_milestone_items", lambda *args: items)

    result = CliRunner().invoke(milestone.main, ["4.0"], env={"GH_TOKEN": "token"})

    assert result.exit_code == 0
    changelog = (changelog_dir / "CHANGELOG").read_text()
    assert "  * bugfixes:\n    - #1 Bug fix\n" in changelog
    assert "  * features:\n    - #2 Feature\n" in changelog
    assert "  * tasks:\n    - #3 Task\n" in changelog
    assert "Untyped PR" not in changelog
    assert changelog.endswith("old changelog\n")
