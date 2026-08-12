"""Resumable planning and publication command."""

# Standard library imports
from pathlib import Path

# External imports
import rich_click as click
from rich import box
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

# Bokeh imports
from .. import BackportError
from ..aggregate import render_pr_body
from ..candidates import BACKPORT_LABEL, read_pr_numbers
from ..git import GitRepo
from ..github import BOKEH_REPOSITORY, GitHubAPI
from ..interactive import run_plan_session
from ..models import PlanState
from ..persistence import (
    clear_plan,
    load_plan,
    save_plan,
    saved_plan_exists,
    state_path,
)
from ..planning import (
    advance_plan,
    cleanup_plan,
    ensure_publishable,
    prepare_plan,
    resume_plan,
)
from ..publishing import publish_plan
from ..ui import (
    busy,
    candidates_table,
    confirm,
    console,
    heading,
)
from ..updating import prepare_update_plan


@click.command()
@click.option(
    "--remote",
    default="origin",
    envvar="BACKPORT_REMOTE",
    show_default=True,
    help="Git remote used for fetching and pushing.",
)
@click.option(
    "--version",
    help="Release used for naming, milestones, and eligibility. Defaults to the next patch.",
)
@click.option(
    "--target-branch",
    help="Override the aggregate PR base branch. Requires --version.",
)
@click.option(
    "--file",
    "pr_file",
    type=click.Path(path_type=Path, dir_okay=False, exists=True, readable=True),
    help="Read the PRs to backport from a text file instead of the label queue.",
)
@click.option(
    "--worktree",
    type=click.Path(path_type=Path, file_okay=False),
    help="Override the temporary worktree path.",
)
@click.option(
    "--review-each",
    is_flag=True,
    help="Prompt to accept or reject every clean cherry-pick.",
)
@click.option(
    "--resume",
    is_flag=True,
    help="Resume the locally saved plan instead of creating a new one.",
)
@click.option(
    "--update",
    type=int,
    metavar="PR",
    help="Rebuild and update an existing aggregate backport PR.",
)
@click.option(
    "--revert",
    "revert_selectors",
    multiple=True,
    metavar="PR_OR_COMMIT",
    help="Remove an included PR or commit while updating. May be repeated.",
)
def plan(
    remote: str,
    version: str | None,
    target_branch: str | None,
    pr_file: Path | None,
    worktree: Path | None,
    review_each: bool,
    resume: bool,
    update: int | None,
    revert_selectors: tuple[str, ...],
) -> None:
    """Build or update a backport PR, with local save and resume."""
    git = GitRepo.discover(remote=remote)
    api = GitHubAPI()

    def checkpoint(current: PlanState) -> None:
        save_plan(git, current)

    created = False
    cleanup_requested = False
    published = False
    pull = None

    if resume:
        if any([version, target_branch, pr_file, worktree, review_each, update, revert_selectors]):
            raise click.UsageError(
                "--resume cannot be combined with --version, --target-branch, --file, --worktree, --review-each, --update, or --revert",
            )
        state = busy(
            "Restoring the saved backport plan",
            lambda: resume_plan(git, load_plan(git), checkpoint),
        )
        created = True
        console.print(
            Panel(
                f"Resumed local state from [cyan]{state_path(git)}[/]",
                title="[bold cyan]Plan restored[/]",
                border_style="cyan",
            ),
        )
    else:
        if update is not None and any([version, target_branch]):
            raise click.UsageError("--update cannot be combined with --version or --target-branch")
        if revert_selectors and update is None:
            raise click.UsageError("--revert requires --update")
        if saved_plan_exists(git):
            saved = load_plan(git)
            raise BackportError(
                f"a saved plan for {saved.version} already exists at {state_path(git)}\n"
                "Resume it with 'python -m tools.backport plan --resume', then save, publish, or discard it.",
            )
        candidate_numbers = read_pr_numbers(pr_file, BOKEH_REPOSITORY) if pr_file else None
        source = f"Reading {len(candidate_numbers)} PRs from {pr_file}" if candidate_numbers is not None else f"Finding PRs labeled {BACKPORT_LABEL!r}"
        if update is None:
            state = busy(
                source,
                lambda: prepare_plan(
                    api,
                    git,
                    BOKEH_REPOSITORY,
                    version=version,
                    target_branch=target_branch,
                    worktree=worktree,
                    review_each=review_each,
                    candidate_numbers=candidate_numbers,
                ),
            )
        else:
            state = busy(
                f"Reconstructing PR #{update} and {source.lower()}",
                lambda: prepare_update_plan(
                    api,
                    git,
                    BOKEH_REPOSITORY,
                    update,
                    worktree=worktree,
                    review_each=review_each,
                    candidate_numbers=candidate_numbers,
                    revert_selectors=revert_selectors,
                ),
            )
        console.print(heading(state))
        console.print(candidates_table(state))
        if update is None:
            confirm(f"Create {state.branch} and cherry-pick {len(state.candidates)} PRs?")
        else:
            confirm(
                f"Rebuild {state.branch} and update PR #{update} with "
                f"{len(state.accepted) + sum(candidate.status == 'pending' for candidate in state.candidates)} PRs?",
            )

    try:
        if not resume:
            busy(
                "Creating the temporary backport worktree",
                lambda: git.add_worktree(
                    Path(state.worktree),
                    state.branch,
                    state.target_branch,
                    detached=state.detached_worktree,
                ),
            )
            created = True
            checkpoint(state)
            state = busy(
                "Replaying existing commits and applying new cherry-picks" if state.pull_request_number is not None else "Applying clean cherry-picks",
                lambda: advance_plan(git, state, checkpoint),
            )

        outcome = run_plan_session(git, state, checkpoint)
        if outcome == "discarded":
            cleanup_requested = True
            return
        if outcome == "saved":
            return

        action = Prompt.ask(
            "Add and commit an additional dedicated fix only if needed, then choose p to publish, s to save and exit, or q to discard",
            choices=["p", "s", "q"],
            default="p",
            console=console,
        )
        if action == "s":
            checkpoint(state)
            console.print(
                Panel(
                    "Progress is saved locally. Resume it with:\n\n  [bold cyan]python -m tools.backport plan --resume[/]",
                    title="[bold cyan]Plan saved[/]",
                    border_style="cyan",
                ),
            )
            return
        if action == "q":
            cleanup_requested = True
            console.print(
                "[blue]Plan discarded. Run 'python -m tools.backport plan' to create another.[/]",
            )
            return

        ensure_publishable(git, state)
        _show_publish_preview(state)
        updating = state.pull_request_number is not None
        try:
            pull = busy(
                "Pushing the branch and updating GitHub metadata" if updating else "Pushing the branch and publishing GitHub metadata",
                lambda: publish_plan(api, git, state, checkpoint),
            )
        except BaseException:
            console.print(
                Panel(
                    "[bold yellow]Publication failed; local state was preserved.[/]\n"
                    f"Branch: [cyan]{state.branch}[/]\n"
                    f"Worktree: [cyan]{state.worktree}[/]\n"
                    f"State: [cyan]{state_path(git)}[/]",
                    border_style="yellow",
                ),
            )
            raise
        published = True
        cleanup_requested = True
    finally:
        if cleanup_requested and created:
            warnings = _cleanup(git, state)
            if published or not warnings:
                clear_plan(git)

    assert pull is not None
    console.print(
        Panel(
            f"[bold green]{'Updated' if updating else 'Published draft'} PR #{pull['number']}[/]\n"
            f"[link={pull['html_url']}]{pull['html_url']}[/]\n\n"
            "The visible aggregate PR summary is now the record for 'python -m tools.backport merge'.",
            border_style="green",
        ),
    )


def _show_publish_preview(state: PlanState) -> None:
    console.print(heading(state))
    console.print(
        Panel(
            Markdown(render_pr_body(state)),
            title="[bold]Updated PR body[/]" if state.pull_request_number is not None else "[bold]Draft PR body[/]",
            border_style="blue",
        ),
    )
    if state.rejected:
        table = Table(box=box.SIMPLE, header_style="bold yellow")
        table.add_column("Rejected PR")
        table.add_column("Reason")
        for candidate in state.rejected:
            table.add_row(f"#{candidate.number}", candidate.reject_reason or "")
        console.print(table)


def _cleanup(git: GitRepo, state: PlanState) -> list[str]:
    warnings = busy(
        "Removing the temporary backport worktree" if state.detached_worktree else "Removing the temporary worktree and branch",
        lambda: cleanup_plan(git, state),
    )
    for warning in warnings:
        console.print(f"[yellow]Cleanup warning:[/] {warning}")
    return warnings
