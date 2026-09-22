# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

"""Report manual and nightly Full CI results through the authenticated gh CLI."""

from __future__ import annotations

# Standard library imports
import argparse
import json
import os
import subprocess
import sys
import time
from datetime import UTC, datetime
from typing import TypedDict


class Job(TypedDict):
    id: int
    name: str
    conclusion: str | None


def gh(*args: str, input: str | None = None) -> str:
    return subprocess.run(
        ["gh", *args], input=input, capture_output=True, text=True, encoding="utf-8", check=True,
    ).stdout


def fetch_jobs(repository: str, run_id: str) -> list[Job]:
    # Slurp all pages before inspecting results, including when a matrix exceeds 100 jobs.
    # A failed request raises before any partial results can produce a notification.
    pages = json.loads(gh("api", "--paginate", "--slurp", f"/repos/{repository}/actions/runs/{run_id}/jobs"))
    return [
        job for page in pages for job in page["jobs"]
        if job["name"] not in {"notify-pr", "notify-nightly-failure"}
    ]


def notify_pr(repository: str, run_id: str, branch: str, reason: str, server_url: str) -> None:
    number = gh(
        "pr", "list", "--repo", repository, "--head", branch, "--state", "open",
        "--json", "number", "--jq", ".[0].number // empty",
    ).strip()
    if not number:
        print("No associated open PR - skipping PR comment")
        return

    # Allow the jobs API to reflect dependencies that have just completed.
    time.sleep(10)
    jobs = fetch_jobs(repository, run_id)
    cancelled = sum(job["conclusion"] == "cancelled" for job in jobs)
    if cancelled:
        print(f"Workflow was cancelled ({cancelled} jobs cancelled) - skipping PR comment")
        return

    run_url = f"{server_url}/{repository}/actions/runs/{run_id}"
    failed = [job for job in jobs if job["conclusion"] == "failure"]
    if failed:
        summary = f"❌ **{len(failed)} job(s) failed**\n\n" + "\n".join(
            f"- ❌ **{job['name']}** ([job #{job['id']}]({run_url}/job/{job['id']}))"
            for job in failed
        )
    else:
        summary = "✅ **All jobs succeeded**"

    timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    workflow_url = f"{server_url}/{repository}/actions/workflows/bokeh-ci-full.yml"
    body = (
        f"## Full CI Results\n\n{summary}\n\n"
        f"**Triggered:** {reason} at {timestamp}\n\n"
        f"[View full workflow run →]({run_url})\n\n"
        f"---\n*Automated comment from [Bokeh-CI-Full]({workflow_url})*"
    )
    print(gh("pr", "comment", number, "--repo", repository, "--body-file", "-", input=body).strip())


def notify_nightly(repository: str, run_id: str, server_url: str) -> None:
    jobs = fetch_jobs(repository, run_id)
    failed = "\n".join(f"- `{job['name']}`" for job in jobs if job["conclusion"] == "failure")
    run_url = f"{server_url}/{repository}/actions/runs/{run_id}"
    workflow_url = f"{server_url}/{repository}/actions/workflows/bokeh-ci-full.yml"
    body = (
        "The nightly Full CI workflow has failed.\n\n"
        f"**Failed jobs:**\n{failed}\n\n"
        f"[View workflow run]({run_url})\n\n"
        f"---\n*Automated notification from [Bokeh-CI-Full]({workflow_url})*"
    )
    payload = {
        "query": """
            mutation($repositoryId: ID!, $categoryId: ID!, $body: String!, $title: String!) {
              createDiscussion(input: {
                repositoryId: $repositoryId,
                categoryId: $categoryId,
                body: $body,
                title: $title
              }) {
                discussion {
                  url
                }
              }
            }
        """,
        "variables": {
            "repositoryId": "MDEwOlJlcG9zaXRvcnkzODM0MzMy",
            "categoryId": "DIC_kwDOADqB3M4C5RF1",
            "title": f"❌ Full CI Failed - {datetime.now(UTC):%Y-%m-%d}",
            "body": body,
        },
    }
    print(gh("api", "graphql", "--input", "-", input=json.dumps(payload)).strip())


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("pr", "nightly"))
    args = parser.parse_args(argv)

    repository = os.environ["GITHUB_REPOSITORY"]
    run_id = os.environ["GITHUB_RUN_ID"]
    server_url = os.environ["GITHUB_SERVER_URL"]
    try:
        if args.mode == "pr":
            notify_pr(repository, run_id, os.environ["GITHUB_REF_NAME"], os.environ.get("RUN_REASON") or "Manual run", server_url)
        else:
            notify_nightly(repository, run_id, server_url)
    except subprocess.CalledProcessError as error:
        print(f"Error: {error.stderr.strip() or str(error)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
