"""Small JSON interface to GitHub through the authenticated ``gh`` CLI."""

# Standard library imports
import json
import re
import subprocess
from collections.abc import Iterable
from typing import Any

# Bokeh imports
from . import BackportError

BOKEH_REPOSITORY = "bokeh/bokeh"


class GitHubAPI:
    def request(
        self,
        method: str,
        path: str,
        *,
        expected: Iterable[int] = (200,),
        **kwargs: Any,
    ) -> Any:
        payload = kwargs.pop("json", None)
        if kwargs:
            raise TypeError(f"unsupported GitHub request options: {', '.join(kwargs)}")

        endpoint = "graphql" if path == "/graphql" else path.removeprefix("/")
        command = ["gh", "api", "--method", method, endpoint]
        input_text = None
        if payload is not None:
            command.extend(["--input", "-"])
            input_text = json.dumps(payload)
        result = subprocess.run(
            command,
            input=input_text,
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            status_match = re.search(r"HTTP (?P<status>\d{3})", result.stderr)
            status = int(status_match.group("status")) if status_match else None
            if status not in set(expected):
                detail = result.stderr.strip() or result.stdout.strip()
                raise BackportError(f"{' '.join(command[:4])} failed: {detail}")
        return _decode_json(result.stdout)

    def get_all(self, path: str, *, list_key: str | None = None) -> list[dict[str, Any]]:
        """Read a REST collection using page-number pagination."""
        result: list[dict[str, Any]] = []
        separator = "&" if "?" in path else "?"
        for page in range(1, 101):
            data = self.request("GET", f"{path}{separator}per_page=100&page={page}")
            items = data[list_key] if list_key else data
            result.extend(items)
            if len(items) < 100:
                return result
        raise BackportError(f"pagination limit exceeded while reading {path}")

    def graphql(self, query: str, variables: dict[str, Any]) -> dict[str, Any]:
        data = self.request("POST", "/graphql", json={"query": query, "variables": variables})
        if data.get("errors"):
            messages = "; ".join(error["message"] for error in data["errors"])
            raise BackportError(f"GitHub GraphQL error: {messages}")
        return data["data"]


def _decode_json(value: str) -> Any:
    if not value.strip():
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError as error:
        raise BackportError(f"gh returned invalid JSON: {error}") from error


def split_repository(repository: str) -> tuple[str, str]:
    parts = repository.split("/")
    if len(parts) != 2 or not all(parts):
        raise BackportError(f"invalid repository {repository!r}; expected OWNER/NAME")
    return parts[0], parts[1]


def repository_path(repository: str) -> str:
    owner, name = split_repository(repository)
    return f"/repos/{owner}/{name}"


def get_pr(api: GitHubAPI, repository: str, number: int) -> dict[str, Any]:
    return api.request("GET", f"{repository_path(repository)}/pulls/{number}")


def closing_issue_numbers(api: GitHubAPI, repository: str, number: int) -> set[int]:
    owner, name = split_repository(repository)
    data = api.graphql(
        """
        query($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
              closingIssuesReferences(first: 100) {
                nodes { number }
                pageInfo { hasNextPage }
              }
            }
          }
        }
        """,
        {"owner": owner, "name": name, "number": number},
    )
    connection = data["repository"]["pullRequest"]["closingIssuesReferences"]
    if connection["pageInfo"]["hasNextPage"]:
        raise BackportError(f"PR #{number} closes more than 100 issues")
    return {item["number"] for item in connection["nodes"]}
