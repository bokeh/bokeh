# Standard library imports
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock

# Bokeh imports
from tools.backport import (
    BackportError,
    candidates as candidate_ops,
    persistence,
)
from tools.backport.models import (
    DedicatedCommit,
    IssueRef,
)

# Bokeh test imports
from tests.tools.backport._support import (
    candidate,
    state_with,
)


class PersistenceTests(unittest.TestCase):
    def test_round_trips_the_complete_local_plan(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            git = MagicMock()
            git.remote = "origin"
            git.common_dir.return_value = Path(directory)
            item = candidate(
                15233,
                labels=[candidate_ops.BACKPORT_LABEL],
                issues=[IssueRef(number=14000, issue_type="Bug")],
                status="applied",
                backport_sha="a" * 40,
            )
            item.adapted = True
            item.replay_sha = "b" * 40
            state = state_with([item])
            state.detached_worktree = True
            state.pull_request_number = 15334
            state.pull_request_url = "https://github.com/bokeh/bokeh/pull/15334"
            state.dedicated_commits = [
                DedicatedCommit(
                    sha="c" * 40,
                    subject="Compatibility fix",
                    status="applied",
                    backport_sha="d" * 40,
                ),
            ]

            path = persistence.save_plan(git, state)
            restored = persistence.load_plan(git)

        self.assertEqual(path.name, "backport-plan.json")
        self.assertEqual(restored, state)

    def test_rejects_an_unknown_saved_state_schema(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            git = MagicMock()
            git.remote = "origin"
            git.common_dir.return_value = Path(directory)
            persistence.state_path(git).write_text('{"schema": 99, "plan": {}}\n')

            with self.assertRaisesRegex(BackportError, "unsupported format"):
                persistence.load_plan(git)
