#!/usr/bin/env python3

from __future__ import annotations

# Standard library imports
import datetime
import logging
import os
import sys
from itertools import groupby
from pathlib import Path
from typing import (
    Any,
    Literal,
    TypedDict,
    cast,
)

# External imports
import click
import requests

VALID_TYPES = (
    "type: bug",
    "type: feature",
    "type: task",
)

MilestoneKind = Literal["issues", "pullRequests"]


class LabelNode(TypedDict):
    name: str


class LabelEdge(TypedDict):
    node: LabelNode


class Labels(TypedDict):
    edges: list[LabelEdge]


class ItemNode(TypedDict):
    labels: Labels
    number: int
    state: str
    title: str


class MilestoneItem(TypedDict):
    kind: MilestoneKind
    node: ItemNode


class PageInfo(TypedDict):
    endCursor: str | None


class MilestoneSummary(TypedDict):
    number: int
    title: str


class MilestoneEdge(TypedDict):
    node: MilestoneSummary


class MilestoneConnection(TypedDict):
    edges: list[MilestoneEdge]
    pageInfo: PageInfo


class ItemConnection(TypedDict):
    edges: list[dict[str, Any]]
    pageInfo: PageInfo

SCRIPT_ROOT = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_ROOT.parent


def query_github(query: str, token: str) -> dict[str, Any] | None:
    """ Hits the GitHub GraphQL API with the given query and returns the data or None.

    """
    API_HEADERS = {"Authorization": f"Bearer {token}"}
    BASE_URL = "https://api.github.com/graphql"
    if logging.getLogger().getEffectiveLevel() == logging.DEBUG:
        query_string = " ".join(line.strip() for line in query.split("\n"))
        logging.debug("POST https://api.github.com/graphql; query:%s", query_string)
    response = requests.post(BASE_URL, json={"query": query}, headers=API_HEADERS)
    response_data = cast(dict[str, Any], response.json())
    errors = cast(list[dict[str, Any]], response_data.get("errors", []))
    for error in errors:
        path = "/".join(cast(list[str], error["path"]))
        msg = cast(str, error["message"])
        print(f"error: {path}: {msg}", file=sys.stderr)
    if logging.getLogger().getEffectiveLevel() == logging.DEBUG:
        logging.debug(f"Response {response.status_code}: {response.text}")
    return cast(dict[str, Any], response_data["data"]) if not errors else None


def get_labels(data: MilestoneItem) -> list[str]:
    """ Returns the list of labels for the given issue or PR data.

    """
    return [edge["node"]["name"] for edge in data["node"]["labels"]["edges"]]


def get_label_for(data: MilestoneItem, kind: str) -> str | None:
    labels = get_labels(data)
    for label in labels:
        if label.startswith(kind):
            return label.replace(kind, "")
    return None


def get_label_type(data: MilestoneItem) -> str | None:
    """ Returns the type label of the given issue or PR data, otherwise None.

    """
    return get_label_for(data, "type: ")


def get_label_component(data: MilestoneItem) -> str | None:
    """ Returns the component label of the given issue or PR data, otherwise None.

    """
    return get_label_for(data, "tag: component: ")


def description(data: MilestoneItem) -> str:
    """ Returns a humanized description of the given issue or PR data.

    """
    component = get_label_component(data)
    component_str = "" if not component else f"[component: {component}] "
    return f'#{data["node"]["number"]} {component_str}{data["node"]["title"]}'


def get_milestone_number(title: str, token: str, allow_closed: bool) -> int | None:
    """ Iterates over all open milestones looking for one with the given title.

    """
    open_str = "" if allow_closed else "states: OPEN,"

    def helper(cursor: str | None = None) -> int | None:
        cursor_or_null = f'"{cursor}"' if cursor else "null"
        query = f"""
        {{
            repository(owner: "bokeh", name: "bokeh") {{
                milestones(first: 10, {open_str} after: {cursor_or_null}) {{
                    edges {{
                        node {{
                            number
                            title
                        }}
                    }}
                    pageInfo {{
                        endCursor
                    }}
                }}
            }}
        }}
        """
        data = query_github(query, token)
        if not data:
            print("error: graphql query failure", file=sys.stderr)
            sys.exit(1)
        repository = cast(dict[str, Any], data["repository"])
        milestones = cast(MilestoneConnection, repository["milestones"])
        end_cursor = milestones["pageInfo"]["endCursor"]
        for edge in milestones["edges"]:
            if edge["node"]["title"] == title:
                return edge["node"]["number"]
        return helper(end_cursor) if end_cursor else None

    return helper()


def check_issue(data: MilestoneItem, problems: list[str]) -> None:
    # all issues are closed
    if data["node"]["state"] != "CLOSED":
        problems.append(f"issue not closed: {description(data)}")

    # all issues have a reso: completed label
    labels = get_labels(data)
    if "reso: completed" not in labels:
        problems.append(f"issue missing resolution: {description(data)}")

    # no issues have more than one reso: label
    if sum(1 for label in labels if label.startswith("reso:")) > 1:
        problems.append(f"issue has too many resolutions: {description(data)}")

    # no issues have a status: label
    if any(label.startswith("status:") for label in labels):
        problems.append(f"issue has a status: {description(data)}")

    # no issues without a type: label
    num_types = sum(1 for label in labels if label.startswith("type:"))
    if num_types == 0:
        problems.append(f"issue does not have a type: {description(data)}")

    # no issues with multiple type: labels
    if num_types > 1:
        problems.append(f"issue has multiple types: {description(data)}")

    # no issues with invalid type: labels
    if any(label not in VALID_TYPES for label in labels if label.startswith("type:")):
        problems.append(f"issue has an invalid type: {description(data)}")

    # no issues with TRIAGE label
    if any(label == "TRIAGE" for label in labels):
        problems.append(f"issue is in triage: {description(data)}")


def check_pr(data: MilestoneItem, problems: list[str]) -> None:
    # no unmerged prs
    if data["node"]["state"] != "MERGED":
        problems.append(f"PR not merged: {description(data)}")

    # no prs without a status: accepted label
    labels = get_labels(data)
    if "status: accepted" not in labels:
        problems.append(f"PR missing status: {description(data)}")

    # special considerations for "issue prs"
    if any(label.startswith("type:") for label in labels):
        # must have a reso: completed label
        if "reso: completed" not in labels:
            problems.append(f"issue PR missing resolution: {description(data)}")

        # must not have more than one reso: label
        if sum(1 for label in labels if label.startswith("reso:")) > 1:
            problems.append(f"issue PR has too many resolutions: {description(data)}")

    # no prs with more than one status: label
    if sum(1 for label in labels if label.startswith("status:")) > 1:
        problems.append(f"PR has too many statuses: {description(data)}")

    # no prs with multiple type: labels
    if sum(1 for label in labels if label.startswith("type:")) > 1:
        problems.append(f"PR has multiple types: {description(data)}")

    # no prs with invalid type: labels
    if any(label not in VALID_TYPES for label in labels if label.startswith("type:")):
        problems.append(f"PR has an invalid type: {description(data)}")

    # no prs with TRIAGE label
    if any(label == "TRIAGE" for label in labels):
        problems.append(f"PR is in triage: {description(data)}")


def get_milestone_items(title: str, token: str, allow_closed: bool) -> list[MilestoneItem] | None:
    """ Returns the issues and PRs in the milestone with the given title,
    otherwise None if the milestone doesn't exist.
    """
    milestone_number = get_milestone_number(title, token, allow_closed)
    if not milestone_number:
        return None

    results: list[MilestoneItem] = []

    def helper(kind: MilestoneKind, cursor: str | None = None) -> None:
        cursor_or_null = f'"{cursor}"' if cursor else "null"
        query = f"""
        {{
            repository(owner: "bokeh", name: "bokeh") {{
                milestone(number: {milestone_number}) {{
                    {kind}(first: 100, after: {cursor_or_null}) {{
                        edges {{
                            node {{
                                number
                                title
                                state
                                labels(first: 20) {{
                                    edges {{
                                        node {{
                                            name
                                        }}
                                    }}
                                }}
                            }}
                        }}
                        pageInfo {{
                            endCursor
                        }}
                    }}
                }}
            }}
        }}
        """
        data = query_github(query, token)
        if not data:
            print("error: graphql query failure", file=sys.stderr)
            sys.exit(1)
        repository = cast(dict[str, Any], data["repository"])
        milestone = cast(dict[str, Any], repository["milestone"])
        items = cast(ItemConnection, milestone[kind])
        end_cursor = items["pageInfo"]["endCursor"]
        for edge in items["edges"]:
            edge["kind"] = kind
            results.append(cast(MilestoneItem, edge))
        if end_cursor:
            helper(kind, end_cursor)

    helper("issues")
    helper("pullRequests")
    return results


def check_milestone_items(items: list[MilestoneItem]) -> list[str]:
    problems: list[str] = []
    for item in items:
        if item["kind"] == "issues":
            check_issue(item, problems)
        elif item["kind"] == "pullRequests":
            check_pr(item, problems)
    return problems


@click.command()
@click.argument("milestone")
@click.option(
    "-l",
    "--log-level",
    type=click.Choice(["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"]),
    default="INFO",
)
@click.option("-v", "--verbose", count=True, help="Sets log level to DEBUG.")
@click.option(
    "-c",
    "--check-only",
    default=False,
    is_flag=True,
    help="Only verify the milestone for compliance, do not output changelog section(s)",
)
@click.option(
    "-a",
    "--allow-closed",
    default=False,
    is_flag=True,
    help="Allow processing of closed milestones",
)
def main(milestone: str, log_level: str, verbose: int, check_only: bool, allow_closed: bool) -> None:
    """ Generates a bokeh changelog which includes the given milestone.

    Requires that you set GH_TOKEN to your GitHub API Token. Exit code 2
    indicates there was a verification problem whereas exit code 1 indicates a general
    error in the script. Otherwise you can expect an exit code of 0 for success.
    """
    log_level = "DEBUG" if verbose else log_level
    logging.basicConfig(level=log_level)

    token = os.environ.get("GH_TOKEN", None)
    if not token:
        print("error: GH_TOKEN is not set", file=sys.stderr)
        sys.exit(1)

    items = get_milestone_items(milestone, token, allow_closed)
    if not items:
        print(f"error: no such milestone: {milestone}", file=sys.stderr)
        sys.exit(1)

    problems = check_milestone_items(items)
    for problem in problems:
        print(problem, file=sys.stderr)

    if len(problems) > 0:
        sys.exit(2)
    elif check_only:
        sys.exit(0)

    CHANGELOG = REPO_ROOT / "docs" / "CHANGELOG"

    with open(CHANGELOG) as f:
        old_changelog = f.read()

    out = open(CHANGELOG, mode="w")

    out.write(f"{datetime.date.today()} {milestone:>8}:\n")
    out.write("--------------------\n")
    def grouping(item: MilestoneItem) -> str:
        return get_label_type(item) or "none"

    items = sorted(items, key=grouping)
    for group_type, group in groupby(items, grouping):
        if group_type == "bug":
            out.write("  * bugfixes:\n")
        elif group_type == "feature":
            out.write("  * features:\n")
        elif group_type == "task":
            out.write("  * tasks:\n")
        elif group_type == "none":
            continue
        for item in group:
            out.write(f"    - {description(item)}\n")
        out.write("\n")
    out.write(old_changelog)

if __name__ == "__main__":
    main()
