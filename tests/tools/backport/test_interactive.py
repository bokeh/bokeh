# Standard library imports
import unittest
from unittest.mock import MagicMock, patch

# Bokeh imports
from tools.backport import BackportError, interactive
from tools.backport.models import DedicatedCommit

# Bokeh test imports
from tests.tools.backport._support import candidate, state_with


class InteractiveCopyTests(unittest.TestCase):
    def test_completion_panel_reports_preserved_standalone_commits(self) -> None:
        state = state_with([])
        state.dedicated_commits = [
            DedicatedCommit("a" * 40, "Compatibility fix"),
            DedicatedCommit("b" * 40, "Release notes"),
        ]

        message = interactive.plan_complete_panel(state).renderable

        self.assertIsInstance(message, str)
        self.assertIn("2 existing standalone commits were preserved and replayed", message)
        self.assertIn("additional dedicated fix only if needed", message)

    def test_action_prompts_render_each_menu(self) -> None:
        item = candidate(15233, status="conflict")
        state = state_with([item])
        state.dedicated_commits = [
            DedicatedCommit("a" * 40, "Compatibility fix", status="conflict"),
        ]

        with (
            patch.object(interactive.console, "print") as output,
            patch.object(interactive.Prompt, "ask", side_effect=["c", "a", "c"]),
        ):
            self.assertEqual(interactive.prompt_conflict_action(item), "c")
            self.assertEqual(interactive.prompt_review_action(item), "a")
            self.assertEqual(interactive.prompt_dedicated_action(state), "c")

        self.assertEqual(output.call_count, 3)


class PlanSessionTests(unittest.TestCase):
    def test_accepts_a_clean_pick_and_completes(self) -> None:
        item = candidate(15233, status="review", backport_sha="a" * 40)
        state = state_with([item])

        def accept(_git: MagicMock, _state: object, _number: int, _checkpoint: object) -> None:
            item.status = "applied"

        with (
            patch.object(interactive, "show_state"),
            patch.object(interactive, "prompt_review_action", return_value="a"),
            patch.object(interactive, "accept_candidate", side_effect=accept) as operation,
            patch.object(interactive.console, "print"),
            patch.object(interactive, "busy", side_effect=lambda _message, function: function()),
        ):
            outcome = interactive.run_plan_session(MagicMock(), state)

        self.assertEqual(outcome, "complete")
        operation.assert_called_once()

    def test_continues_candidate_and_dedicated_conflicts(self) -> None:
        conflict = candidate(15233, status="conflict")
        state = state_with([conflict])
        dedicated = DedicatedCommit("a" * 40, "Compatibility fix", status="conflict")
        state.dedicated_commits = [dedicated]

        def continue_candidate(_git: MagicMock, _state: object, _checkpoint: object) -> None:
            conflict.status = "applied"

        def continue_dedicated(_git: MagicMock, _state: object, _checkpoint: object) -> None:
            dedicated.status = "applied"

        with (
            patch.object(interactive, "show_state"),
            patch.object(interactive, "prompt_conflict_action", return_value="c"),
            patch.object(interactive, "prompt_dedicated_action", return_value="c"),
            patch.object(interactive, "continue_plan", side_effect=continue_candidate),
            patch.object(interactive, "continue_dedicated_commit", side_effect=continue_dedicated),
            patch.object(interactive.console, "print"),
            patch.object(interactive, "busy", side_effect=lambda _message, function: function()),
        ):
            outcome = interactive.run_plan_session(MagicMock(), state)

        self.assertEqual(outcome, "complete")
        self.assertEqual(conflict.status, "applied")
        self.assertEqual(dedicated.status, "applied")

    def test_rejects_a_conflicted_candidate(self) -> None:
        item = candidate(15233, status="conflict")
        state = state_with([item])

        def reject(
            _git: MagicMock,
            _state: object,
            _number: int,
            reason: str,
            _checkpoint: object,
        ) -> None:
            item.status = "rejected"
            item.reject_reason = reason

        with (
            patch.object(interactive, "show_state"),
            patch.object(interactive, "prompt_conflict_action", return_value="r"),
            patch.object(interactive.Prompt, "ask", return_value="Not suitable"),
            patch.object(interactive, "reject_candidate", side_effect=reject),
            patch.object(interactive.console, "print"),
            patch.object(interactive, "busy", side_effect=lambda _message, function: function()),
        ):
            outcome = interactive.run_plan_session(MagicMock(), state)

        self.assertEqual(outcome, "complete")
        self.assertEqual(item.reject_reason, "Not suitable")

    def test_saves_or_discards_an_active_plan(self) -> None:
        checkpoint = MagicMock()
        cases = [("s", "saved"), ("q", "discarded")]

        for action, expected in cases:
            with self.subTest(action=action):
                state = state_with([candidate(15233, status="conflict")])
                with (
                    patch.object(interactive, "show_state"),
                    patch.object(interactive, "prompt_conflict_action", return_value=action),
                    patch.object(interactive.console, "print"),
                ):
                    outcome = interactive.run_plan_session(MagicMock(), state, checkpoint)

                self.assertEqual(outcome, expected)

        checkpoint.assert_called_once()

    def test_reports_an_action_error_and_keeps_prompting(self) -> None:
        item = candidate(15233, status="review", backport_sha="a" * 40)
        state = state_with([item])

        with (
            patch.object(interactive, "show_state"),
            patch.object(interactive, "prompt_review_action", side_effect=["a", "q"]),
            patch.object(interactive, "accept_candidate", side_effect=BackportError("failed")),
            patch.object(interactive.console, "print") as output,
            patch.object(interactive, "busy", side_effect=lambda _message, function: function()),
        ):
            outcome = interactive.run_plan_session(MagicMock(), state)

        self.assertEqual(outcome, "discarded")
        self.assertEqual(output.call_args_list[0].args[0].renderable, "failed")
