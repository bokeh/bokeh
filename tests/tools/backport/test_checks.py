# Standard library imports
import unittest
from unittest.mock import MagicMock, patch

# Bokeh imports
from tests.tools.backport._support import RecordingAPI, valid_pr
from tools.backport import BackportError, checks


class PRValidationTests(unittest.TestCase):
    def test_accepts_exact_managed_convention(self) -> None:
        self.assertEqual(checks.validate_pr(valid_pr(), "bokeh/bokeh"), "3.9.2")

    def test_rejects_title_without_cli_merge_marker(self) -> None:
        pr = valid_pr()
        pr["title"] = "Backports for 3.9.2"
        with self.assertRaisesRegex(
            BackportError,
            r"title must be exactly '\[MERGE WITH CLI\] Backports for X.Y.Z'",
        ):
            checks.validate_pr(pr, "bokeh/bokeh")

    def test_rejects_nonstandard_branch(self) -> None:
        pr = valid_pr()
        pr["head"]["ref"] = "backports-3.9.2"
        with self.assertRaisesRegex(
            BackportError,
            "head branch must be exactly backport/3.9.2",
        ):
            checks.validate_pr(pr, "bokeh/bokeh")

    def test_accepts_arbitrary_target_without_an_override(self) -> None:
        pr = valid_pr()
        pr["base"]["ref"] = "staging-branch-3.10"
        self.assertEqual(checks.validate_pr(pr, "bokeh/bokeh"), "3.9.2")

    def test_accepts_explicit_arbitrary_target_branch(self) -> None:
        pr = valid_pr()
        pr["base"]["ref"] = "staging-branch-3.10"
        self.assertEqual(
            checks.validate_pr(
                pr,
                "bokeh/bokeh",
                expected_version="3.9.2",
                expected_target_branch="staging-branch-3.10",
                expected_head_branch="backport/3.9.2",
            ),
            "3.9.2",
        )

    def test_update_validation_accepts_an_open_draft_before_it_is_mergeable(self) -> None:
        pr = valid_pr()
        pr["draft"] = True
        pr["mergeable"] = False

        self.assertEqual(
            checks.validate_pr(
                pr,
                "bokeh/bokeh",
                require_open=True,
                require_ready=False,
            ),
            "3.9.2",
        )


class CheckEvaluationTests(unittest.TestCase):
    def test_accepts_enabled_rebase_merging(self) -> None:
        api = RecordingAPI()
        with patch.object(
            api,
            "request",
            return_value={"allow_rebase_merge": True},
        ) as request:
            checks.require_rebase_merge(api, "bokeh/bokeh")

        request.assert_called_once_with("GET", "/repos/bokeh/bokeh")

    def test_instructs_maintainer_to_enable_rebase_merging(self) -> None:
        api = RecordingAPI()
        with (
            patch.object(
                api,
                "request",
                return_value={"allow_rebase_merge": False},
            ),
            self.assertRaisesRegex(
                BackportError,
                "Settings → General.*Allow rebase merging",
            ),
        ):
            checks.require_rebase_merge(api, "bokeh/bokeh")

    def test_accepts_successful_ci(self) -> None:
        runs = [
            {
                "id": 2,
                "name": "unit-tests",
                "status": "completed",
                "conclusion": "success",
            },
        ]
        self.assertEqual(checks.evaluate_checks(runs, {"statuses": []}), [])

    def test_reports_real_ci_failure(self) -> None:
        runs = [
            {
                "id": 2,
                "name": "unit-tests",
                "status": "completed",
                "conclusion": "failure",
            },
        ]
        self.assertEqual(
            checks.evaluate_checks(runs, {"statuses": []}),
            ["unit-tests: failure"],
        )

    def test_reports_pending_ci(self) -> None:
        runs = [
            {
                "id": 1,
                "name": "unit-tests",
                "status": "in_progress",
                "conclusion": None,
            },
        ]
        self.assertEqual(
            checks.evaluate_checks(runs, {"statuses": []}),
            ["unit-tests: in_progress"],
        )

    def test_does_not_mask_failed_merge_checks_with_a_green_head(self) -> None:
        failed = {
            "id": 1,
            "name": "merge-tests",
            "status": "completed",
            "conclusion": "failure",
        }
        passed = {
            "id": 2,
            "name": "head-tests",
            "status": "completed",
            "conclusion": "success",
        }
        api = MagicMock()
        api.get_all.side_effect = [[failed], [passed]]
        api.request.return_value = {"statuses": []}

        with self.assertRaisesRegex(BackportError, "merge-tests: failure"):
            checks.check_pr_ci(
                api,
                "bokeh/bokeh",
                {
                    "merge_commit_sha": "a" * 40,
                    "head": {"sha": "b" * 40},
                },
            )

        api.get_all.assert_called_once()

    def test_falls_back_to_head_checks_when_merge_sha_has_no_results(self) -> None:
        passed = {
            "id": 2,
            "name": "head-tests",
            "status": "completed",
            "conclusion": "success",
        }
        api = MagicMock()
        api.get_all.side_effect = [[], [passed]]
        api.request.return_value = {"statuses": []}

        checks.check_pr_ci(
            api,
            "bokeh/bokeh",
            {
                "merge_commit_sha": "a" * 40,
                "head": {"sha": "b" * 40},
            },
        )

        self.assertEqual(api.get_all.call_count, 2)
