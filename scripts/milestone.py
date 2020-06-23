#!/usr/bin/env python3

import datetime
import logging
import os
import sys
from itertools import groupby

import click
import requests

VALID_TYPES = [
    "type: bug",
    "type: feature",
    "type: task",
]


def query_github(query, token):
    """Hits the GitHub GraphQL API with the given query and returns the response."""
    API_HEADERS = {"Authorization": f"Bearer {token}"}
    BASE_URL = "https://api.github.com/graphql"
    if logging.getLogger().getEffectiveLevel() == logging.DEBUG:
        query_string = " ".join(line.strip() for line in query.split("\n"))
        logging.debug("POST https://api.github.com/graphql; query:%s", query_string)
    return requests.post(BASE_URL, json={"query": query}, headers=API_HEADERS)


def get_labels(data):
    """Returns the list of labels for the given issue or PR data."""
    return [edge["node"]["name"] for edge in data["node"]["labels"]["edges"]]


def get_label_for(data, kind):
    labels = get_labels(data)
    for label in labels:
        if label.startswith(kind):
            return label.replace(kind, "")
    return None


def get_label_type(data):
    """Returns the type label of the given issue or PR data, otherwise None."""
    return get_label_for(data, "type: ")


def get_label_component(data):
    """Returns the component label of the given issue or PR data, otherwise None."""
    return get_label_for(data, "tag: component: ")


def description(data):
    """Returns a humanized description of the given issue or PR data."""
    component = get_label_component(data)
    component_str = "" if not component else f"[component: {component}] "
    return f'#{data["node"]["number"]} {component_str}{data["node"]["title"]}'


def get_milestone_number(title, token):
    """Iterates over all open milestones looking for one with the given title."""

    def helper(cursor=None):
        cursor_or_null = f'"{cursor}"' if cursor else "null"
        query = f"""
        {{
            repository(owner: "bokeh", states: OPEN, name: "bokeh") {{
                milestones(first: 10, after: {cursor_or_null}) {{
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
        request = query_github(query, token)
        milestones = request.json()["data"]["repository"]["milestones"]
        end_cursor = milestones["pageInfo"]["endCursor"]
        for edge in milestones["edges"]:
            if edge["node"]["title"] == title:
                return edge["node"]["number"]
        if not end_cursor:
            return None
        return helper(end_cursor)

    return helper()


def check_issue(data, problems):
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

    # no issues with a type: label
    num_types = sum(1 for label in labels if label.startswith("type:"))
    if num_types == 0:
        problems.append(f"issue does not have a type: {description(data)}")

    # no issues with multiple type: labels
    if num_types > 1:
        problems.append(f"issue has multiple types: {description(data)}")

    # no issues without a type: label
    if sum(1 for label in labels if label.startswith("type:")) <= 0:
        problems.append(f"issue has no type: {description(data)}")

    # no issues with invalid type: labels
    if any(label not in VALID_TYPES for label in labels if label.startswith("type:")):
        problems.append(f"issue has an invalid type: {description(data)}")

    # no issues with TRIAGE label
    if any(label == "TRIAGE" for label in labels):
        problems.append(f"issue is in triage: {description(data)}")


def check_pr(data, problems):
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

    # no prs with more than one type: label
    if sum(1 for label in labels if label.startswith("type:")) > 1:
        problems.append(f"PR has multiple types: {description(data)}")

    # no prs without a type: label
    if sum(1 for label in labels if label.startswith("type:")) <= 0:
        problems.append(f"PR has no type: {description(data)}")

    # no prs with invalid type: labels
    if any(label not in VALID_TYPES for label in labels if label.startswith("type:")):
        problems.append(f"PR has an invalid type: {description(data)}")

    # no prs with TRIAGE label
    if any(label == "TRIAGE" for label in labels):
        problems.append(f"PR is in triage: {description(data)}")


def get_milestone_items(title, token):
    """
    Returns the issues and PRs in the milestone with the given title,
    otherwise None if the milestone doesn't exist.
    """
    milestone_number = get_milestone_number(title, token)
    if not milestone_number:
        return None

    results = []

    def helper(kind, cursor=None):
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
        request = query_github(query, token)
        items = request.json()["data"]["repository"]["milestone"][kind]
        end_cursor = items["pageInfo"]["endCursor"]
        for edge in items["edges"]:
            edge["kind"] = kind
            results.append(edge)
        if end_cursor:
            helper(kind, end_cursor)

    helper("issues")
    helper("pullRequests")
    return results


def check_milestone_items(items):
    problems = []
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
    help="Only verify the milestone for compliance, do not write to changelog",
)
def main(milestone, log_level, verbose, check_only):
    """
    Generates a bokeh changelog entry using the GitHub API.

    Requires that you set GITHUB_API_TOKEN to your GitHub API Token. Exit code 2
    indicates there was a verification problem whereas exit code 1 indicates a general
    error in the script. Otherwise you can expect an exit code of 0 for success.
    """
    log_level = "DEBUG" if verbose else log_level
    logging.basicConfig(level=log_level)

    token = os.environ.get("GITHUB_API_TOKEN", None)
    if not token:
        print("error: GITHUB_API_TOKEN is not set", file=sys.stderr)
        sys.exit(1)

    items = get_milestone_items(milestone, token)
    if not items:
        print(f"error: no such milestone: {milestone}", file=sys.stderr)
        sys.exit(1)

    problems = check_milestone_items(items)
    for problem in problems:
        print(problem, file=sys.stderr)

    if check_only:
        if len(problems) > 0:
            sys.exit(2)
        else:
            sys.exit(0)

    print(f"{datetime.date.today()} {milestone:>8}:")
    print("--------------------")
    grouping = lambda item: get_label_type(item)
    items = sorted(items, key=grouping)
    for group_type, group in groupby(items, grouping):
        if group_type == "bug":
            print("  * bugfixes:")
        elif group_type == "feature":
            print("  * features:")
        elif group_type == "task":
            print("  * tasks:")
        for item in group:
            print(f"    - {description(item)}")


if __name__ == "__main__":
    main()
