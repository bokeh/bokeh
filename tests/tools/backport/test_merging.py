import unittest
from unittest.mock import MagicMock, patch

from tests.tools.backport._support import (
    RecordingAPI,
    candidate,
    state_with,
    valid_pr,
)
from tools.backport import (
    BackportError,
    aggregate,
    candidates as candidate_ops,
    merging,
)
from tools.backport.models import BackportEntry, PublishedPlan


class MergeWorkflowTests(unittest.TestCase):

    def test_accepted_status_replaces_only_other_status_labels(self) -> None:
        api = MagicMock()
        api.get_all.return_value = [
            {"name": "status: needs review"},
            {"name": "status: ready"},
            {"name": "type: task"},
            {"name": "status: accepted"},
        ]

        with patch.object(merging, "remove_label") as remove_label:
            merging.set_accepted_status(api, "bokeh/bokeh", 15264)

        api.get_all.assert_called_once_with("/repos/bokeh/bokeh/issues/15264/labels")
        api.request.assert_called_once_with(
            "POST",
            "/repos/bokeh/bokeh/issues/15264/labels",
            json={"labels": ["status: accepted"]},
        )
        self.assertEqual(
            [call.args for call in remove_label.call_args_list],
            [
                (api, "bokeh/bokeh", 15264, "status: needs review"),
                (api, "bokeh/bokeh", 15264, "status: ready"),
            ],
        )

    def test_accepted_status_is_safe_to_retry(self) -> None:
        api = MagicMock()
        for labels in ([], [{"name": "status: accepted"}]):
            with self.subTest(labels=labels):
                api.get_all.return_value = labels
                with patch.object(merging, "remove_label") as remove_label:
                    merging.set_accepted_status(api, "bokeh/bokeh", 15264)
                remove_label.assert_not_called()

    @staticmethod
    def plan() -> PublishedPlan:
        return PublishedPlan(
            repository="bokeh/bokeh",
            version="3.9.2",
            target_branch="branch-3.9",
            branch="backport/3.9.2",
            pull_request_number=15264,
            pull_request_url="https://github.com/bokeh/bokeh/pull/15264",
            head_sha="abc123",
            entries=[
                BackportEntry(
                    number=15233,
                    original_sha="1" * 40,
                    backport_sha="a" * 40,
                    adapted=False,
                ),
            ],
        )

    def test_requests_rebase_of_exact_preflight_head_then_finalizes(self) -> None:
        plan = self.plan()
        api = RecordingAPI()
        messages: list[str] = []
        progress = messages.append

        with (
            patch.object(merging, "get_pr", side_effect=[valid_pr(), valid_pr()]),
            patch.object(merging, "require_rebase_merge") as require_rebase,
            patch.object(merging, "published_plan_from_pr", return_value=plan),
            patch.object(merging, "check_pr_ci"),
            patch.object(
                api,
                "get_all",
                return_value=[{"sha": "a" * 40}],
                create=True,
            ),
            patch.object(
                merging,
                "finalize_merged_plan",
                return_value=[],
            ) as finalize,
        ):
            merge_sha, warnings = merging.merge_plan(api, plan, progress=progress)

        self.assertEqual(
            api.calls,
            [
                (
                    "PUT",
                    "/repos/bokeh/bokeh/pulls/15264/merge",
                    {
                        "json": {
                            "merge_method": "rebase",
                            "sha": "abc123",
                        },
                    },
                ),
            ],
        )
        self.assertEqual(merge_sha, "f" * 40)
        self.assertEqual(warnings, [])
        require_rebase.assert_called_once_with(api, "bokeh/bokeh")
        finalize.assert_called_once_with(api, plan, progress=progress)
        self.assertIn("Verifying the backport commits", messages)
        self.assertEqual(messages[-1], "Rebase-merging PR #15264")

    def test_finalization_removes_the_label_whether_or_not_it_is_present(self) -> None:
        plan = self.plan()
        api = RecordingAPI()
        messages: list[str] = []
        with (
            patch.object(merging, "ensure_milestone", return_value=7),
            patch.object(merging, "set_milestone"),
            patch.object(merging, "set_accepted_status") as set_status,
            patch.object(merging, "closing_issue_numbers", return_value=set()),
            patch.object(merging, "remove_label") as remove_label,
        ):
            warnings = merging.finalize_merged_plan(api, plan, progress=messages.append)

        self.assertEqual(warnings, [])
        self.assertIn("Finalizing source PR #15233 (1/1) and finding its closing issues", messages)
        self.assertEqual(messages[-1], "Deleting remote branch backport/3.9.2")
        set_status.assert_called_once_with(api, "bokeh/bokeh", plan.pull_request_number)
        remove_label.assert_called_once_with(
            api,
            "bokeh/bokeh",
            15233,
            candidate_ops.BACKPORT_LABEL,
        )

    def test_finalization_uses_the_minor_milestone_for_a_dot_zero_release(self) -> None:
        plan = self.plan()
        plan = PublishedPlan(
            repository=plan.repository,
            version="3.10.0",
            target_branch="branch-3.10",
            branch="backport/3.10.0",
            pull_request_number=plan.pull_request_number,
            pull_request_url=plan.pull_request_url,
            head_sha=plan.head_sha,
            entries=plan.entries,
        )
        api = RecordingAPI()
        with (
            patch.object(merging, "ensure_milestone", return_value=7) as ensure_milestone,
            patch.object(merging, "set_milestone"),
            patch.object(merging, "set_accepted_status"),
            patch.object(merging, "closing_issue_numbers", return_value=set()),
            patch.object(merging, "remove_label"),
        ):
            merging.finalize_merged_plan(api, plan)

        ensure_milestone.assert_called_once_with(api, "bokeh/bokeh", "3.10")

    def test_rerun_after_merge_only_retries_finalization(self) -> None:
        plan = self.plan()
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        item.merge_sha = "1" * 40
        merged_pr = valid_pr()
        merged_pr.update(
            {
                "body": aggregate.render_pr_body(state_with([item])),
                "merge_commit_sha": "f" * 40,
                "merged_at": "2026-07-23T12:00:00Z",
                "state": "closed",
            },
        )
        api = RecordingAPI()

        with (
            patch.object(merging, "get_pr", return_value=merged_pr),
            patch.object(
                merging,
                "finalize_merged_plan",
                return_value=[],
            ),
        ):
            merge_sha, warnings = merging.merge_plan(api, plan)

        self.assertEqual(api.calls, [])
        self.assertEqual(merge_sha, "f" * 40)
        self.assertEqual(warnings, [])

    def test_reconstructs_merge_plan_from_the_pr_body(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        pr = valid_pr(body=aggregate.render_pr_body(state_with([item])))
        api = MagicMock()
        api.get_all.return_value = [
            {
                "sha": "a" * 40,
                "commit": {
                    "message": (f"Fix #15233\n\n(cherry picked from commit {item.merge_sha})"),
                },
            },
        ]

        with patch.object(
            merging,
            "get_pr",
            return_value={
                "merge_commit_sha": item.merge_sha,
                "merged_at": "2026-07-01T12:00:00Z",
            },
        ):
            plan = merging.published_plan_from_pr(
                api,
                pr,
                "bokeh/bokeh",
                require_open=True,
            )

        self.assertEqual(plan.version, "3.9.2")
        self.assertEqual(plan.target_branch, "branch-3.9")
        self.assertEqual(plan.pull_request_number, 15264)
        self.assertEqual(
            plan.entries,
            [BackportEntry(15233, item.merge_sha, "a" * 40, False)],
        )

    def test_reconstructs_merge_plan_from_a_crlf_pr_body(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = aggregate.render_pr_body(state_with([item])).replace("\n", "\r\n")
        pr = valid_pr(body=body)
        entries = [BackportEntry(15233, item.merge_sha, "a" * 40, False)]

        plan = merging.published_plan_from_pr(
            MagicMock(),
            pr,
            "bokeh/bokeh",
            require_open=True,
            expected_entries=entries,
        )

        self.assertEqual(plan.entries, entries)

    def test_reconstruction_requires_a_standard_cherry_pick_trailer(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        pr = valid_pr(body=aggregate.render_pr_body(state_with([item])))
        api = MagicMock()
        api.get_all.return_value = [
            {"sha": "a" * 40, "commit": {"message": "Fix without a trailer"}},
        ]

        with (
            patch.object(
                merging,
                "get_pr",
                return_value={
                    "merge_commit_sha": item.merge_sha,
                    "merged_at": "2026-07-01T12:00:00Z",
                },
            ),
            self.assertRaisesRegex(BackportError, "no aggregate commit.*PR #15233"),
        ):
            merging.published_plan_from_pr(
                api,
                pr,
                "bokeh/bokeh",
                require_open=True,
            )

    def test_reconstruction_rejects_an_unlisted_cherry_pick(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        pr = valid_pr(body=aggregate.render_pr_body(state_with([item])))
        api = MagicMock()
        api.get_all.return_value = [
            {
                "sha": "a" * 40,
                "commit": {
                    "message": f"Listed\n\n(cherry picked from commit {item.merge_sha})",
                },
            },
            {
                "sha": "b" * 40,
                "commit": {
                    "message": f"Unlisted\n\n(cherry picked from commit {'f' * 40})",
                },
            },
        ]

        with (
            patch.object(
                merging,
                "get_pr",
                return_value={
                    "merge_commit_sha": item.merge_sha,
                    "merged_at": "2026-07-01T12:00:00Z",
                },
            ),
            self.assertRaisesRegex(BackportError, "missing from its table"),
        ):
            merging.published_plan_from_pr(
                api,
                pr,
                "bokeh/bokeh",
                require_open=True,
            )
