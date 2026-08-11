"""Rich terminal rendering and confirmations."""

# Standard library imports
from collections.abc import Callable

# External imports
import click
from rich import box
from rich.console import Console, Group
from rich.panel import Panel
from rich.prompt import Confirm
from rich.table import Table
from rich.text import Text

# Bokeh imports
from .models import Candidate, PlanState, PublishedPlan

console = Console(highlight=False)
error_console = Console(stderr=True, highlight=False)

STATUS_STYLE = {
    "pending": "dim",
    "applying": "cyan",
    "conflict": "bold red",
    "review": "bold cyan",
    "applied": "green",
    "rejected": "yellow",
}


def busy[T](message: str, function: Callable[[], T]) -> T:
    with console.status(f"[bold cyan]{message}[/]", spinner="dots"):
        return function()


def heading(state: PlanState) -> Panel:
    accepted = len(state.accepted)
    rejected = len(state.rejected)
    pending = len(state.candidates) - accepted - rejected
    summary = Table.grid(padding=(0, 2))
    summary.add_column(style="bold")
    summary.add_column()
    summary.add_row("Release", state.version)
    summary.add_row("Target", state.target_branch)
    summary.add_row("Branch", state.branch)
    summary.add_row("Worktree", state.worktree)
    summary.add_row(
        "Clean picks",
        "[cyan]review each[/]" if state.review_each else "auto-accept",
    )
    summary.add_row(
        "Progress",
        f"[green]{accepted} applied[/] · [yellow]{rejected} rejected[/] · [cyan]{pending} remaining[/]",
    )
    if state.pull_request_number is not None:
        summary.add_row("Updating", f"PR #{state.pull_request_number}")
    if state.dedicated_commits:
        applied = sum(commit.status == "applied" for commit in state.dedicated_commits)
        summary.add_row("Dedicated commits", f"{applied}/{len(state.dedicated_commits)} replayed")
    return Panel(
        summary,
        title=f"[bold]Backports for {state.version}[/]",
        border_style="blue",
    )


def candidates_table(state: PlanState) -> Table:
    table = Table(
        box=box.SIMPLE_HEAVY,
        header_style="bold blue",
        expand=True,
        show_lines=False,
    )
    table.add_column("PR", justify="right", no_wrap=True)
    table.add_column("Merged", no_wrap=True)
    table.add_column("Status", no_wrap=True)
    table.add_column("Commit", no_wrap=True)
    table.add_column("Title", ratio=1)
    table.add_column("Issues", justify="right", no_wrap=True)

    for candidate in state.candidates:
        status = candidate.status
        if candidate.adapted and status == "applied":
            status = "adapted"
            style = "bold magenta"
        else:
            style = STATUS_STYLE.get(status, "white")
        sha = candidate.backport_sha or candidate.merge_sha
        issue_text = ", ".join(f"#{issue.number}" for issue in candidate.issues) or "—"
        table.add_row(
            f"[link={candidate.url}]#{candidate.number}[/]",
            candidate.merged_at[:10],
            Text(status, style=style),
            sha[:10],
            candidate.title,
            issue_text,
        )
    return table


def show_state(state: PlanState) -> None:
    console.print(heading(state))
    console.print(candidates_table(state))
    if state.conflict:
        show_conflict(state.conflict, state)
    if state.review:
        console.print(
            Panel(
                f"[bold]PR #{state.review.number} applied cleanly.[/]\n"
                f"Commit {state.review.backport_sha}\n\n"
                "Accept it, reject it, save progress, or discard the plan.",
                title="[bold cyan]Clean cherry-pick ready for review[/]",
                border_style="cyan",
            ),
        )
    if state.dedicated_conflict:
        show_dedicated_conflict(state)


def show_conflict(candidate: Candidate, state: PlanState) -> None:
    files = "\n".join(f"  • {path}" for path in candidate.conflict_files)
    if not files:
        files = "  Git reported a non-clean cherry-pick; inspect `git status`."
    console.print(
        Panel(
            Group(
                Text.from_markup(
                    f"[bold]PR #{candidate.number} needs adaptation.[/]\n{files}",
                ),
                Text.from_markup(
                    f"\nResolve it in:\n  [cyan]{state.worktree}[/]\n\nEdit the files there, then use the action menu to continue or reject this PR.",
                ),
            ),
            title="[bold red]Cherry-pick stopped[/]",
            border_style="red",
        ),
    )


def show_dedicated_conflict(state: PlanState) -> None:
    commit = state.dedicated_conflict
    assert commit is not None
    files = "\n".join(f"  • {path}" for path in commit.conflict_files)
    if not files:
        files = "  Git reported a non-clean cherry-pick; inspect `git status`."
    summary = Text()
    summary.append(f"Dedicated commit {commit.sha[:12]} needs adaptation.\n", style="bold")
    summary.append(f"{commit.subject}\n{files}")
    console.print(
        Panel(
            Group(
                summary,
                Text.from_markup(
                    f"\nResolve it in:\n  [cyan]{state.worktree}[/]\n\nEdit the files there, then use the action menu to continue.",
                ),
            ),
            title="[bold red]Dedicated commit stopped[/]",
            border_style="red",
        ),
    )


def merge_summary(state: PublishedPlan) -> Panel:
    details = Table.grid(padding=(0, 2))
    details.add_column(style="bold")
    details.add_column()
    details.add_row(
        "Pull request",
        f"#{state.pull_request_number} Backports for {state.version}",
    )
    details.add_row("Method", Text("rebase", style="bold magenta"))
    details.add_row("Target", Text(state.target_branch, style="cyan"))
    commits = Text()
    commits.append(f"{len(state.entries)} backported PRs", style="green")
    details.add_row("Commits", commits)
    return Panel(
        details,
        title="[bold red]Final merge[/]",
        border_style="red",
    )


def confirm(message: str) -> None:
    if not Confirm.ask(message, default=False, console=console):
        raise click.Abort()
