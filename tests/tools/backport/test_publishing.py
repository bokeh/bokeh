# Standard library imports
import unittest
from unittest.mock import MagicMock, patch

# Bokeh imports
from tools.backport import (
    aggregate,
    BackportError,
    publishing,
)

# Bokeh test imports
from tests.tools.backport._support import (
    candidate,
    state_with,
)


class PublicationTests(unittest.TestCase):
    def test_marks_pr_for_cli_merge(self) -> None:
        state = state_with([candidate(15233, status="applied", backport_sha="a" * 40)])
        api = MagicMock()
        api.request.return_value = {
            "number": 15264,
            "html_url": "https://github.com/bokeh/bokeh/pull/15264",
        }
        git = MagicMock()

        with (
            patch.object(publishing, "publish_range_diffs", return_value={}),
            patch.object(publishing, "ensure_milestone", return_value=7),
            patch.object(publishing, "set_milestone"),
        ):
            publishing.publish_plan(api, git, state)

        payload = api.request.call_args.kwargs["json"]
        self.assertEqual(payload["title"], "[MERGE WITH CLI] Backports for 3.9.2")
        self.assertIn("`python -m tools.backport merge`", payload["body"])

    def test_publishes_dot_zero_pr_to_the_minor_milestone(self) -> None:
        state = state_with([candidate(15233, status="applied", backport_sha="a" * 40)])
        state.version = "3.10.0"
        api = MagicMock()
        api.request.return_value = {
            "number": 15300,
            "html_url": "https://github.com/bokeh/bokeh/pull/15300",
        }

        with (
            patch.object(publishing, "publish_range_diffs", return_value={}),
            patch.object(publishing, "ensure_milestone", return_value=7) as ensure_milestone,
            patch.object(publishing, "set_milestone"),
        ):
            publishing.publish_plan(api, MagicMock(), state)

        ensure_milestone.assert_called_once_with(api, "bokeh/bokeh", "3.10")

    def test_resumes_metadata_after_new_pr_creation(self) -> None:
        state = state_with([candidate(15233, status="applied", backport_sha="a" * 40)])
        api = MagicMock()
        api.request.return_value = {
            "number": 15264,
            "html_url": "https://github.com/bokeh/bokeh/pull/15264",
        }
        checkpoint = MagicMock()

        with (
            patch.object(publishing, "publish_range_diffs", return_value={}),
            patch.object(publishing, "ensure_milestone", return_value=7),
            patch.object(
                publishing,
                "set_milestone",
                side_effect=[BackportError("network failure"), None],
            ),
            self.assertRaisesRegex(BackportError, "network failure"),
        ):
            publishing.publish_plan(api, MagicMock(), state, checkpoint)

        self.assertEqual(state.pull_request_number, 15264)
        self.assertEqual(
            state.pull_request_url,
            "https://github.com/bokeh/bokeh/pull/15264",
        )
        checkpoint.assert_called_once_with(state)

        with (
            patch.object(publishing, "publish_range_diffs", return_value={}),
            patch.object(publishing, "ensure_milestone", return_value=7),
            patch.object(publishing, "set_milestone"),
            patch.object(publishing, "clear_rejection"),
        ):
            publishing.publish_plan(api, MagicMock(), state, checkpoint)

        self.assertEqual(api.request.call_args_list[0].args[:2], ("POST", "/repos/bokeh/bokeh/pulls"))
        self.assertEqual(
            api.request.call_args_list[1].args[:2],
            ("PATCH", "/repos/bokeh/bokeh/pulls/15264"),
        )

    def test_updates_the_same_pr_and_clears_a_retried_rejection(self) -> None:
        existing = candidate(15233, status="applied", backport_sha="a" * 40)
        existing.replay_sha = "b" * 40
        retried = candidate(15139, status="applied", backport_sha="c" * 40)
        state = state_with([existing, retried])
        state.pull_request_number = 15334
        state.pull_request_url = "https://github.com/bokeh/bokeh/pull/15334"
        api = MagicMock()
        api.request.return_value = {
            "number": 15334,
            "html_url": state.pull_request_url,
        }

        with (
            patch.object(publishing, "publish_range_diffs", return_value={}),
            patch.object(publishing, "ensure_milestone", return_value=7),
            patch.object(publishing, "set_milestone"),
            patch.object(publishing, "clear_rejection") as clear_rejection,
        ):
            pull = publishing.publish_plan(api, MagicMock(), state)

        self.assertEqual(pull["number"], 15334)
        api.request.assert_called_once_with(
            "PATCH",
            "/repos/bokeh/bokeh/pulls/15334",
            json={
                "body": aggregate.render_pr_body(state),
                "title": "[MERGE WITH CLI] Backports for 3.9.2",
            },
        )
        clear_rejection.assert_called_once_with(api, state, retried)

    def test_deletes_every_matching_rejection_comment(self) -> None:
        state = state_with([])
        item = candidate(15139)
        api = MagicMock()
        api.get_all.return_value = [
            {"id": 1, "body": "unrelated"},
            {"id": 2, "body": "<!-- backport-rejection:3.9.2 -->\nold"},
        ]

        publishing.clear_rejection(api, state, item)

        api.request.assert_called_once_with(
            "DELETE",
            "/repos/bokeh/bokeh/issues/comments/2",
            expected=(204, 404),
        )
