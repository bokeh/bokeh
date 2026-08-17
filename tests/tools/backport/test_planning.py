# Standard library imports
import unittest
from unittest.mock import MagicMock, patch

# Bokeh imports
from tests.tools.backport._support import candidate
from tools.backport import BackportError, planning
from tools.backport.models import IssueRef


class PlanningOptionTests(unittest.TestCase):
    def test_target_override_requires_an_explicit_version(self) -> None:
        api = MagicMock()
        git = MagicMock()

        with self.assertRaisesRegex(BackportError, "--target-branch requires.*--version"):
            planning.prepare_plan(
                api,
                git,
                "bokeh/bokeh",
                target_branch="staging-branch-3.10",
            )

        api.request.assert_not_called()
        git.fetch_tags.assert_not_called()

    def test_explicit_version_derives_the_standard_target(self) -> None:
        api = MagicMock()
        api.request.return_value = {"default_branch": "branch-4.0"}
        git = MagicMock()
        git.remote = "origin"
        git.remote_branch_exists.side_effect = [True, False]
        git.rev_parse.return_value = "0" * 40
        git.commit_messages.return_value = ""
        git.is_ancestor.return_value = False
        item = candidate(
            15233,
            issues=[IssueRef(number=100, issue_type="Task")],
        )
        with patch.object(planning, "discover_candidates", return_value=[item]):
            state = planning.prepare_plan(
                api,
                git,
                "bokeh/bokeh",
                version="3.10.0",
                candidate_numbers=[15233],
            )

        self.assertEqual(state.target_branch, "branch-3.10")
        git.fetch_tags.assert_not_called()

    def test_development_branch_is_rejected_even_when_supplied_explicitly(self) -> None:
        api = MagicMock()
        api.request.return_value = {"default_branch": "branch-4.0"}
        git = MagicMock()

        with self.assertRaisesRegex(BackportError, "current development branch"):
            planning.prepare_plan(
                api,
                git,
                "bokeh/bokeh",
                version="4.0.0",
                target_branch="branch-4.0",
                candidate_numbers=[15233],
            )

        git.remote_branch_exists.assert_not_called()
