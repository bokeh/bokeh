# Standard library imports
import unittest
from unittest.mock import patch

# External imports
import click
from rich.panel import Panel
from rich.table import Table

# Bokeh imports
from tools.backport import ui
from tools.backport.models import (
    BackportEntry,
    DedicatedCommit,
    IssueRef,
    PublishedPlan,
)

# Bokeh test imports
from tests.tools.backport._support import candidate, state_with


class RenderingTests(unittest.TestCase):
    def test_busy_returns_the_wrapped_result(self) -> None:
        self.assertEqual(ui.busy("Working", lambda: 42), 42)

    def test_renders_plan_heading_and_candidate_table(self) -> None:
        applied = candidate(15233, status="applied", backport_sha="a" * 40)
        applied.adapted = True
        applied.issues = [IssueRef(14000, "Bug")]
        rejected = candidate(15261, status="rejected")
        state = state_with([applied, rejected, candidate(15271)])
        state.review_each = True
        state.pull_request_number = 15337
        state.dedicated_commits = [
            DedicatedCommit("b" * 40, "Compatibility fix", status="applied"),
        ]

        heading = ui.heading(state)
        table = ui.candidates_table(state)

        self.assertIsInstance(heading, Panel)
        self.assertIsInstance(table, Table)
        self.assertEqual(table.row_count, 3)

    def test_show_state_renders_conflicts_reviews_and_dedicated_commits(self) -> None:
        conflict = candidate(15233, status="conflict")
        conflict.conflict_files = ["src/bokeh/example.py"]
        review = candidate(15261, status="review", backport_sha="a" * 40)
        state = state_with([conflict, review])
        state.dedicated_commits = [
            DedicatedCommit(
                "b" * 40,
                "Compatibility fix",
                status="conflict",
            ),
        ]

        with patch.object(ui.console, "print") as output:
            ui.show_state(state)

        self.assertGreaterEqual(output.call_count, 5)

    def test_conflict_renderers_handle_an_empty_file_list(self) -> None:
        conflict = candidate(15233, status="conflict")
        state = state_with([conflict])
        state.dedicated_commits = [
            DedicatedCommit(
                "b" * 40,
                "Compatibility fix",
                status="conflict",
            ),
        ]

        with patch.object(ui.console, "print") as output:
            ui.show_conflict(conflict, state)
            ui.show_dedicated_conflict(state)

        self.assertEqual(output.call_count, 2)

    def test_renders_merge_summary(self) -> None:
        state = PublishedPlan(
            repository="bokeh/bokeh",
            version="3.9.2",
            target_branch="branch-3.9",
            branch="backport/3.9.2",
            pull_request_number=15337,
            pull_request_url="https://github.com/bokeh/bokeh/pull/15337",
            head_sha="a" * 40,
            entries=[BackportEntry(15233, "b" * 40, "c" * 40, False)],
        )

        self.assertIsInstance(ui.merge_summary(state), Panel)

    def test_confirmation_accepts_yes_and_aborts_on_no(self) -> None:
        with patch.object(ui.Confirm, "ask", return_value=True):
            ui.confirm("Continue?")

        with patch.object(ui.Confirm, "ask", return_value=False):
            with self.assertRaises(click.Abort):
                ui.confirm("Continue?")
