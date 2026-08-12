# Standard library imports
import unittest

# Bokeh imports
from tools.backport.interactive import plan_complete_panel
from tools.backport.models import DedicatedCommit

# Bokeh test imports
from tests.tools.backport._support import state_with


class InteractiveCopyTests(unittest.TestCase):
    def test_completion_panel_reports_preserved_standalone_commits(self) -> None:
        state = state_with([])
        state.dedicated_commits = [
            DedicatedCommit("a" * 40, "Compatibility fix"),
            DedicatedCommit("b" * 40, "Release notes"),
        ]

        message = plan_complete_panel(state).renderable

        self.assertIsInstance(message, str)
        self.assertIn("2 existing standalone commits were preserved and replayed", message)
        self.assertIn("additional dedicated fix only if needed", message)
