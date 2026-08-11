"""Rich entry point for ``python -m tools.backport``."""

# Standard library imports
import sys

# External imports
import rich_click as click
from rich.panel import Panel

# Bokeh imports
from . import BackportError
from .commands.plan import plan
from .commands.release import merge
from .ui import error_console

click.rich_click.USE_RICH_MARKUP = True
click.rich_click.SHOW_ARGUMENTS = True
click.rich_click.GROUP_ARGUMENTS_OPTIONS = True
click.rich_click.COMMAND_GROUPS = {
    "python -m tools.backport": [
        {
            "name": "Backport workflow",
            "commands": ["plan", "merge"],
        },
    ],
}


@click.group(context_settings={"help_option_names": ["-h", "--help"]})
def cli() -> None:
    """Build release backports from a queue or explicit PR list."""


cli.add_command(plan)
cli.add_command(merge)


def _require_supported_python() -> None:
    if sys.version_info < (3, 13):
        raise SystemExit("tools.backport requires Python 3.13 or newer")


def main() -> None:
    _require_supported_python()

    try:
        cli(prog_name="python -m tools.backport")
    except (BackportError, OSError) as error:
        error_console.print(
            Panel(
                str(error),
                title="[bold red]Backport stopped safely[/]",
                border_style="red",
            ),
        )
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
