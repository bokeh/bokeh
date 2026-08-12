# Standard library imports
import unittest
from pathlib import Path
from typing import Any, cast
from unittest.mock import MagicMock, patch

# External imports
import click

# Bokeh imports
import tools.backport.__main__ as entrypoint
import tools.backport.commands.plan as plan_command
import tools.backport.commands.release as release_command
from tools.backport import BackportError
from tools.backport.models import BackportEntry, PublishedPlan

# Bokeh test imports
from tests.tools.backport._support import candidate, state_with


def invoke_plan(**overrides: Any) -> None:
    arguments = {
        "remote": "origin",
        "version": None,
        "target_branch": None,
        "pr_file": None,
        "worktree": None,
        "review_each": False,
        "resume": False,
        "update": None,
        "revert_selectors": (),
        **overrides,
    }
    callback = cast(Any, plan_command.plan.callback)
    callback(**arguments)


class PlanCommandTests(unittest.TestCase):
    def test_creates_publishes_and_cleans_up_a_new_plan(self) -> None:
        accepted = candidate(15233, status="applied", backport_sha="a" * 40)
        rejected = candidate(15261, status="rejected")
        rejected.reject_reason = "Not suitable"
        state = state_with([accepted, rejected])
        git = MagicMock()
        pull = {
            "number": 15337,
            "html_url": "https://github.com/bokeh/bokeh/pull/15337",
        }

        with (
            patch.object(plan_command.GitRepo, "discover", return_value=git),
            patch.object(plan_command, "GitHubAPI"),
            patch.object(plan_command, "saved_plan_exists", return_value=False),
            patch.object(plan_command, "prepare_plan", return_value=state) as prepare,
            patch.object(plan_command, "advance_plan", return_value=state),
            patch.object(plan_command, "run_plan_session", return_value="complete"),
            patch.object(plan_command.Prompt, "ask", return_value="p"),
            patch.object(plan_command, "ensure_publishable"),
            patch.object(plan_command, "publish_plan", return_value=pull) as publish,
            patch.object(plan_command, "cleanup_plan", return_value=[]) as cleanup,
            patch.object(plan_command, "save_plan") as save,
            patch.object(plan_command, "clear_plan") as clear,
            patch.object(plan_command, "confirm"),
            patch.object(plan_command.console, "print"),
            patch.object(plan_command, "busy", side_effect=lambda _message, function: function()),
        ):
            invoke_plan()

        prepare.assert_called_once()
        git.add_worktree.assert_called_once()
        self.assertGreaterEqual(save.call_count, 1)
        publish.assert_called_once()
        cleanup.assert_called_once_with(git, state)
        clear.assert_called_once_with(git)

    def test_updates_an_existing_plan_from_an_explicit_file(self) -> None:
        accepted = candidate(15233, status="applied", backport_sha="a" * 40)
        state = state_with([accepted])
        state.pull_request_number = 15337
        state.pull_request_url = "https://github.com/bokeh/bokeh/pull/15337"
        state.detached_worktree = True
        git = MagicMock()
        pr_file = Path("prs.txt")
        pull = {
            "number": 15337,
            "html_url": state.pull_request_url,
        }

        with (
            patch.object(plan_command.GitRepo, "discover", return_value=git),
            patch.object(plan_command, "GitHubAPI"),
            patch.object(plan_command, "saved_plan_exists", return_value=False),
            patch.object(plan_command, "read_pr_numbers", return_value=[15233]),
            patch.object(plan_command, "prepare_update_plan", return_value=state) as prepare,
            patch.object(plan_command, "advance_plan", return_value=state),
            patch.object(plan_command, "run_plan_session", return_value="complete"),
            patch.object(plan_command.Prompt, "ask", return_value="p"),
            patch.object(plan_command, "ensure_publishable"),
            patch.object(plan_command, "publish_plan", return_value=pull),
            patch.object(plan_command, "cleanup_plan", return_value=[]),
            patch.object(plan_command, "save_plan"),
            patch.object(plan_command, "clear_plan"),
            patch.object(plan_command, "confirm"),
            patch.object(plan_command.console, "print"),
            patch.object(plan_command, "busy", side_effect=lambda _message, function: function()),
        ):
            invoke_plan(
                pr_file=pr_file,
                update=15337,
                revert_selectors=("15217",),
            )

        prepare.assert_called_once()
        self.assertEqual(prepare.call_args.kwargs["candidate_numbers"], [15233])
        self.assertEqual(prepare.call_args.kwargs["revert_selectors"], ("15217",))
        self.assertFalse(prepare.call_args.kwargs["review_each"])
        git.add_worktree.assert_called_once_with(
            Path(state.worktree),
            state.branch,
            state.target_branch,
            detached=True,
        )

    def test_resumes_and_saves_a_completed_plan(self) -> None:
        state = state_with([candidate(15233, status="applied", backport_sha="a" * 40)])
        git = MagicMock()

        with (
            patch.object(plan_command.GitRepo, "discover", return_value=git),
            patch.object(plan_command, "GitHubAPI"),
            patch.object(plan_command, "load_plan", return_value=state),
            patch.object(plan_command, "resume_plan", return_value=state),
            patch.object(plan_command, "run_plan_session", return_value="complete"),
            patch.object(plan_command.Prompt, "ask", return_value="s"),
            patch.object(plan_command, "save_plan") as save,
            patch.object(plan_command.console, "print"),
            patch.object(plan_command, "busy", side_effect=lambda _message, function: function()),
        ):
            invoke_plan(resume=True)

        save.assert_called_with(git, state)
        git.add_worktree.assert_not_called()

    def test_discards_a_completed_plan_and_reports_cleanup_warnings(self) -> None:
        state = state_with([candidate(15233, status="applied", backport_sha="a" * 40)])
        git = MagicMock()

        with (
            patch.object(plan_command.GitRepo, "discover", return_value=git),
            patch.object(plan_command, "GitHubAPI"),
            patch.object(plan_command, "saved_plan_exists", return_value=False),
            patch.object(plan_command, "prepare_plan", return_value=state),
            patch.object(plan_command, "advance_plan", return_value=state),
            patch.object(plan_command, "run_plan_session", return_value="complete"),
            patch.object(plan_command.Prompt, "ask", return_value="q"),
            patch.object(plan_command, "cleanup_plan", return_value=["branch remained"]),
            patch.object(plan_command, "save_plan"),
            patch.object(plan_command, "clear_plan") as clear,
            patch.object(plan_command, "confirm"),
            patch.object(plan_command.console, "print") as output,
            patch.object(plan_command, "busy", side_effect=lambda _message, function: function()),
        ):
            invoke_plan()

        clear.assert_not_called()
        self.assertTrue(any("Cleanup warning" in str(call) for call in output.call_args_list))

    def test_preserves_state_when_publication_fails(self) -> None:
        state = state_with([candidate(15233, status="applied", backport_sha="a" * 40)])
        git = MagicMock()

        with (
            patch.object(plan_command.GitRepo, "discover", return_value=git),
            patch.object(plan_command, "GitHubAPI"),
            patch.object(plan_command, "saved_plan_exists", return_value=False),
            patch.object(plan_command, "prepare_plan", return_value=state),
            patch.object(plan_command, "advance_plan", return_value=state),
            patch.object(plan_command, "run_plan_session", return_value="complete"),
            patch.object(plan_command.Prompt, "ask", return_value="p"),
            patch.object(plan_command, "ensure_publishable"),
            patch.object(plan_command, "publish_plan", side_effect=BackportError("failed")),
            patch.object(plan_command, "cleanup_plan") as cleanup,
            patch.object(plan_command, "save_plan"),
            patch.object(plan_command, "clear_plan") as clear,
            patch.object(plan_command, "confirm"),
            patch.object(plan_command.console, "print"),
            patch.object(plan_command, "busy", side_effect=lambda _message, function: function()),
        ):
            with self.assertRaisesRegex(BackportError, "failed"):
                invoke_plan()

        cleanup.assert_not_called()
        clear.assert_not_called()

    def test_rejects_incompatible_options_and_existing_state(self) -> None:
        git = MagicMock()
        existing = state_with([])
        cases = [
            {"resume": True, "version": "3.9.2"},
            {"update": 15337, "target_branch": "branch-3.9"},
            {"revert_selectors": ("15233",)},
        ]

        with (
            patch.object(plan_command.GitRepo, "discover", return_value=git),
            patch.object(plan_command, "GitHubAPI"),
            patch.object(plan_command, "saved_plan_exists", return_value=False),
        ):
            for arguments in cases:
                with self.subTest(arguments=arguments), self.assertRaises(click.UsageError):
                    invoke_plan(**arguments)

        with (
            patch.object(plan_command.GitRepo, "discover", return_value=git),
            patch.object(plan_command, "GitHubAPI"),
            patch.object(plan_command, "saved_plan_exists", return_value=True),
            patch.object(plan_command, "load_plan", return_value=existing),
        ):
            with self.assertRaisesRegex(BackportError, "saved plan"):
                invoke_plan()


class ReleaseCommandTests(unittest.TestCase):
    def test_finds_merges_and_reports_cleanup_warnings(self) -> None:
        pr = {"merged_at": None}
        plan = PublishedPlan(
            repository="bokeh/bokeh",
            version="3.9.2",
            target_branch="branch-3.9",
            branch="backport/3.9.2",
            pull_request_number=15337,
            pull_request_url="https://github.com/bokeh/bokeh/pull/15337",
            head_sha="a" * 40,
            entries=[BackportEntry(15233, "b" * 40, "c" * 40, False)],
        )

        with (
            patch.object(release_command, "GitHubAPI") as api_type,
            patch.object(release_command, "find_backport_pr", return_value=pr),
            patch.object(release_command, "published_plan_from_pr", return_value=plan) as reconstruct,
            patch.object(release_command, "merge_plan", return_value=("d" * 40, ["branch remained"])),
            patch.object(release_command, "confirm") as confirm,
            patch.object(release_command.console, "print") as output,
            patch.object(release_command, "busy", side_effect=lambda _message, function: function()),
        ):
            callback = cast(Any, release_command.merge.callback)
            callback(None)

        reconstruct.assert_called_once_with(
            api_type.return_value,
            pr,
            "bokeh/bokeh",
            require_open=True,
        )
        confirm.assert_called_once()
        self.assertTrue(any("Cleanup warning" in str(call) for call in output.call_args_list))


class EntryPointTests(unittest.TestCase):
    def test_cli_callback(self) -> None:
        callback = cast(Any, entrypoint.cli.callback)
        callback()

    def test_accepts_supported_python(self) -> None:
        with patch.object(entrypoint.sys, "version_info", (3, 13)):
            entrypoint._require_supported_python()

    def test_rejects_unsupported_python(self) -> None:
        with patch.object(entrypoint.sys, "version_info", (3, 12)):
            with self.assertRaisesRegex(SystemExit, "Python 3.13"):
                entrypoint._require_supported_python()

    def test_main_reports_expected_workflow_errors(self) -> None:
        with (
            patch.object(entrypoint, "_require_supported_python"),
            patch.object(entrypoint, "cli", side_effect=BackportError("stopped")),
            patch.object(entrypoint.error_console, "print") as output,
        ):
            with self.assertRaises(SystemExit) as raised:
                entrypoint.main()

        self.assertEqual(raised.exception.code, 1)
        output.assert_called_once()

    def test_main_returns_after_a_successful_command(self) -> None:
        with (
            patch.object(entrypoint, "_require_supported_python"),
            patch.object(entrypoint, "cli") as cli,
        ):
            entrypoint.main()

        cli.assert_called_once_with(prog_name="python -m tools.backport")
