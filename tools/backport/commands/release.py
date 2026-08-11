"""Aggregate PR merge command."""

# External imports
import rich_click as click
from rich.panel import Panel

# Bokeh imports
from ..candidates import milestone_for_version
from ..github import BOKEH_REPOSITORY, GitHubAPI
from ..merging import find_backport_pr, merge_plan, published_plan_from_pr
from ..ui import (
    busy,
    confirm,
    console,
    merge_summary,
)


@click.command()
@click.argument("number", type=int, required=False)
def merge(number: int | None) -> None:
    """Rebase-merge an aggregate backport PR and finalize its metadata."""
    api = GitHubAPI()
    pr = busy(
        "Finding the aggregate backport PR",
        lambda: find_backport_pr(api, BOKEH_REPOSITORY, number),
    )
    already_merged = bool(pr.get("merged_at"))
    plan = published_plan_from_pr(
        api,
        pr,
        BOKEH_REPOSITORY,
        require_open=not already_merged,
    )

    console.print(merge_summary(plan))
    confirm(
        f"Rebase-merge and move included PRs/issues to {milestone_for_version(plan.version)}, remove labels, and delete the branch?",
    )
    merge_sha, warnings = busy(
        "Checking CI, merging, and finalizing release metadata",
        lambda: merge_plan(api, plan),
    )
    console.print(
        Panel(
            f"[bold green]Merged and finalized.[/]\nMerge result: {merge_sha}\nAggregate PR: {plan.pull_request_url}",
            border_style="green",
        ),
    )
    for warning in warnings:
        console.print(f"[yellow]Cleanup warning:[/] {warning}")
