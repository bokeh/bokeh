"""Rich interaction for an active backport plan."""

# Standard library imports
from typing import Literal

# External imports
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich.text import Text

# Bokeh imports
from . import BackportError
from .git import GitRepo
from .models import Candidate, PlanState
from .planning import (
    Checkpoint,
    accept_candidate,
    continue_dedicated_commit,
    continue_plan,
    reject_candidate,
)
from .ui import busy, console, show_state

type SessionOutcome = Literal["complete", "discarded", "saved"]


def conflict_actions_panel(candidate: Candidate) -> Panel:
    actions = Table.grid(padding=(0, 1))
    actions.add_column(no_wrap=True)
    actions.add_column()
    actions.add_row(Text("[c]", style="bold green"), "continue after resolving the files")
    actions.add_row(Text("[r]", style="bold yellow"), "reject this PR")
    actions.add_row(Text("[s]", style="bold cyan"), "save progress and exit")
    actions.add_row(Text("[q]", style="bold"), "discard the saved plan")
    return Panel(
        actions,
        title=f"[bold]Next action for PR #{candidate.number}[/]",
        border_style="cyan",
    )


def prompt_conflict_action(candidate: Candidate) -> str:
    console.print(conflict_actions_panel(candidate))
    return Prompt.ask("Action", choices=["c", "r", "s", "q"], default="c", console=console)


def review_actions_panel(candidate: Candidate) -> Panel:
    actions = Table.grid(padding=(0, 1))
    actions.add_column(no_wrap=True)
    actions.add_column()
    actions.add_row(Text("[a]", style="bold green"), "accept this clean cherry-pick")
    actions.add_row(Text("[r]", style="bold yellow"), "reject this PR")
    actions.add_row(Text("[s]", style="bold cyan"), "save progress and exit")
    actions.add_row(Text("[q]", style="bold"), "discard the saved plan")
    return Panel(
        actions,
        title=f"[bold]Review clean PR #{candidate.number}[/]",
        border_style="cyan",
    )


def prompt_review_action(candidate: Candidate) -> str:
    console.print(review_actions_panel(candidate))
    return Prompt.ask("Action", choices=["a", "r", "s", "q"], default="a", console=console)


def dedicated_actions_panel(state: PlanState) -> Panel:
    commit = state.dedicated_conflict
    assert commit is not None
    actions = Table.grid(padding=(0, 1))
    actions.add_column(no_wrap=True)
    actions.add_column()
    actions.add_row(Text("[c]", style="bold green"), "continue after resolving the files")
    actions.add_row(Text("[s]", style="bold cyan"), "save progress and exit")
    actions.add_row(Text("[q]", style="bold"), "discard the saved plan")
    return Panel(
        actions,
        title=f"[bold]Next action for dedicated commit {commit.sha[:12]}[/]",
        border_style="cyan",
    )


def prompt_dedicated_action(state: PlanState) -> str:
    console.print(dedicated_actions_panel(state))
    return Prompt.ask("Action", choices=["c", "s", "q"], default="c", console=console)


def plan_complete_panel(state: PlanState) -> Panel:
    if state.dedicated_commits:
        count = len(state.dedicated_commits)
        noun = "commit" if count == 1 else "commits"
        detail = f" {count} existing standalone {noun} were preserved and replayed."
    else:
        detail = ""
    return Panel(
        f"Every candidate is applied or rejected.{detail} Add and commit an additional dedicated fix only if needed, then publish the aggregate changes.",
        title="[bold]Plan complete[/]",
        border_style="green",
    )


def run_plan_session(
    git: GitRepo,
    state: PlanState,
    checkpoint: Checkpoint | None = None,
) -> SessionOutcome:
    while True:
        show_state(state)
        candidate = state.conflict or state.review
        dedicated = state.dedicated_conflict
        if candidate is None and dedicated is None:
            console.print(plan_complete_panel(state))
            return "complete"

        number = candidate.number if candidate is not None else 0
        if dedicated is not None:
            action = prompt_dedicated_action(state)
        else:
            assert candidate is not None
            action = prompt_review_action(candidate) if candidate.status == "review" else prompt_conflict_action(candidate)
        try:
            match action:
                case "a":
                    busy(
                        f"Accepting clean cherry-pick for PR #{number}",
                        lambda: accept_candidate(git, state, number, checkpoint),
                    )
                case "c":
                    if dedicated is not None:
                        busy(
                            f"Finishing dedicated commit {dedicated.sha[:12]}",
                            lambda: continue_dedicated_commit(git, state, checkpoint),
                        )
                    else:
                        busy(
                            f"Finishing adaptation for PR #{number}",
                            lambda: continue_plan(git, state, checkpoint),
                        )
                case "r":
                    reason = Prompt.ask(
                        f"Reason for rejecting PR #{number}",
                        console=console,
                    )
                    busy(
                        f"Rejecting PR #{number} and resuming",
                        lambda: reject_candidate(
                            git,
                            state,
                            number,
                            reason,
                            checkpoint,
                        ),
                    )
                case "s":
                    if checkpoint is not None:
                        checkpoint(state)
                    console.print(
                        Panel(
                            "Progress is saved locally. Resume it with:\n\n  [bold cyan]python -m tools.backport plan --resume[/]",
                            title="[bold cyan]Plan saved[/]",
                            border_style="cyan",
                        ),
                    )
                    return "saved"
                case "q":
                    console.print(
                        Panel(
                            "The temporary worktree and branch will be removed. Run 'python -m tools.backport plan' to create a new plan.",
                            title="[bold]Plan discarded[/]",
                            border_style="blue",
                        ),
                    )
                    return "discarded"
        except BackportError as error:
            console.print(
                Panel(
                    str(error),
                    title="[bold]Action not complete[/]",
                    border_style="red",
                ),
            )
