# Standard library imports
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Bokeh imports
from tools.backport import (
    aggregate,
    BackportError,
    candidates as candidate_ops,
    updating,
)
from tools.backport.models import (
    DedicatedCommit,
    IssueRef,
)

# Bokeh test imports
from tests.tools.backport._support import (
    candidate,
    state_with,
    valid_pr,
)


class UpdatePlanningTests(unittest.TestCase):
    @staticmethod
    def commit(sha: str, message: str) -> dict:
        return {"sha": sha, "commit": {"message": message}}

    @staticmethod
    def git(head_sha: str) -> MagicMock:
        git = MagicMock()
        git.remote = "origin"
        git.remote_branch_exists.return_value = True
        git.default_worktree.return_value = Path("/tmp/bokeh-backport-3.9.2")
        git.rev_parse.side_effect = lambda ref: head_sha if ref == "origin/backport/3.9.2" else "0" * 40
        return git

    def test_adds_new_labeled_prs_in_merge_order_and_preserves_dedicated_tail(self) -> None:
        existing = candidate(15233, merged_at="2026-07-02T00:00:00Z")
        existing_backport = "a" * 40
        existing_state = state_with(
            [candidate(15233, status="applied", backport_sha=existing_backport)],
        )
        pr = valid_pr(body=aggregate.render_pr_body(existing_state))
        pr["number"] = 15334
        pr["html_url"] = "https://github.com/bokeh/bokeh/pull/15334"
        pr["head"]["sha"] = "f" * 40
        new = candidate(
            15139,
            merged_at="2026-07-01T00:00:00Z",
            issues=[IssueRef(number=11854, issue_type="Bug")],
        )
        duplicate = candidate(15233, merged_at=existing.merged_at)
        tail_sha = "b" * 40
        commits = [
            self.commit(
                existing_backport,
                f"Existing\n\n(cherry picked from commit {existing.merge_sha})",
            ),
            self.commit(tail_sha, "Compatibility fix"),
        ]
        api = MagicMock()
        api.get_all.return_value = commits
        api.request.return_value = {"default_branch": "branch-3.10"}
        git = self.git(pr["head"]["sha"])

        with (
            patch.object(updating, "get_pr", return_value=pr),
            patch.object(
                updating,
                "discover_candidates",
                side_effect=[[existing], [duplicate, new]],
            ) as discover,
            patch.object(updating, "candidate_target_problems", return_value=[]),
        ):
            state = updating.prepare_update_plan(
                api,
                git,
                "bokeh/bokeh",
                15334,
            )

        self.assertEqual([item.number for item in state.candidates], [15139, 15233])
        self.assertEqual(state.candidate(15233).replay_sha, existing_backport)
        self.assertEqual(state.pull_request_number, 15334)
        self.assertEqual(state.pull_request_url, pr["html_url"])
        self.assertEqual(state.worktree, str(Path("/tmp/bokeh-backport-3.9.2").resolve()))
        self.assertTrue(state.detached_worktree)
        self.assertEqual(
            state.dedicated_commits,
            [DedicatedCommit(sha=tail_sha, subject="Compatibility fix")],
        )
        self.assertEqual(discover.call_args_list[0].args[2], [15233])
        self.assertIsNone(discover.call_args_list[1].args[2])

    def test_explicit_file_adds_an_unlabeled_pr_without_source_policy(self) -> None:
        existing = candidate(15233)
        existing_backport = "a" * 40
        existing_state = state_with(
            [candidate(15233, status="applied", backport_sha=existing_backport)],
        )
        pr = valid_pr(body=aggregate.render_pr_body(existing_state))
        pr["head"]["sha"] = "f" * 40
        new = candidate(
            15139,
            base_branch="branch-4.0",
            milestone="4.0",
            issues=[IssueRef(number=11854, issue_type="Bug")],
        )
        api = MagicMock()
        api.get_all.return_value = [
            self.commit(
                existing_backport,
                f"Existing\n\n(cherry picked from commit {existing.merge_sha})",
            ),
        ]
        api.request.return_value = {"default_branch": "branch-3.10"}
        git = self.git(pr["head"]["sha"])

        with (
            patch.object(updating, "get_pr", return_value=pr),
            patch.object(
                updating,
                "discover_candidates",
                side_effect=[[existing], [new]],
            ) as discover,
            patch.object(candidate_ops, "candidate_source_problems") as source_problems,
            patch.object(updating, "candidate_target_problems", return_value=[]),
        ):
            state = updating.prepare_update_plan(
                api,
                git,
                "bokeh/bokeh",
                15264,
                candidate_numbers=[15139],
            )

        self.assertEqual({item.number for item in state.candidates}, {15139, 15233})
        discover.assert_any_call(api, "bokeh/bokeh", [15139])
        source_problems.assert_not_called()

    def test_revert_removes_a_manually_reverted_pr_and_its_revert_commit(self) -> None:
        kept = candidate(15233, merged_at="2026-07-01T00:00:00Z")
        removed = candidate(15327, merged_at="2026-07-02T00:00:00Z")
        kept_backport = "a" * 40
        removed_backport = "b" * 40
        revert_sha = "c" * 40
        tail_sha = "d" * 40
        body_state = state_with([candidate(15233, status="applied", backport_sha=kept_backport)])
        pr = valid_pr(body=aggregate.render_pr_body(body_state))
        pr["head"]["sha"] = "f" * 40
        api = MagicMock()
        api.get_all.return_value = [
            self.commit(
                kept_backport,
                f"Kept\n\n(cherry picked from commit {kept.merge_sha})",
            ),
            self.commit(
                removed_backport,
                f"Removed\n\n(cherry picked from commit {removed.merge_sha})",
            ),
            self.commit(
                revert_sha,
                f'Revert "Removed"\n\nThis reverts commit {removed_backport}.',
            ),
            self.commit(tail_sha, "Release notes"),
        ]
        api.request.return_value = {"default_branch": "branch-3.10"}
        git = self.git(pr["head"]["sha"])

        with (
            patch.object(updating, "get_pr", return_value=pr),
            patch.object(
                updating,
                "discover_candidates",
                side_effect=[[kept], [removed], [kept, removed]],
            ),
            patch.object(updating, "candidate_target_problems", return_value=[]),
        ):
            state = updating.prepare_update_plan(
                api,
                git,
                "bokeh/bokeh",
                15334,
                revert_selectors=("15327",),
            )

        rejected = state.candidate(15327)
        self.assertEqual(rejected.status, "rejected")
        self.assertIn("--revert", rejected.reject_reason or "")
        self.assertEqual(
            state.dedicated_commits,
            [DedicatedCommit(sha=tail_sha, subject="Release notes")],
        )

    def test_revert_accepts_a_backport_commit_prefix(self) -> None:
        item = candidate(15327)
        backport_sha = "a" * 40
        commits = [
            self.commit(
                backport_sha,
                f"Backport\n\n(cherry picked from commit {item.merge_sha})",
            ),
        ]

        with patch.object(updating, "discover_candidates", return_value=[item]):
            reverted, dropped = updating._resolve_reverts(
                MagicMock(),
                "bokeh/bokeh",
                commits,
                {item.number: item},
                (backport_sha[:12],),
            )

        self.assertEqual(reverted, {15327: item})
        self.assertEqual(dropped, set())

    def test_revert_accepts_a_standalone_commit_prefix(self) -> None:
        sha = "d" * 40

        reverted, dropped = updating._resolve_reverts(
            MagicMock(),
            "bokeh/bokeh",
            [self.commit(sha, "Release notes")],
            {},
            (sha[:12],),
        )

        self.assertEqual(reverted, {})
        self.assertEqual(dropped, {sha})

    def test_requires_at_least_one_new_or_reverted_change(self) -> None:
        existing = candidate(15233)
        existing_backport = "a" * 40
        body_state = state_with(
            [candidate(15233, status="applied", backport_sha=existing_backport)],
        )
        pr = valid_pr(body=aggregate.render_pr_body(body_state))
        api = MagicMock()
        api.get_all.return_value = [
            self.commit(
                existing_backport,
                f"Existing\n\n(cherry picked from commit {existing.merge_sha})",
            ),
        ]

        with (
            patch.object(updating, "get_pr", return_value=pr),
            patch.object(
                updating,
                "discover_candidates",
                side_effect=[[existing], [candidate(15233)]],
            ),
            self.assertRaisesRegex(BackportError, "contains no PRs that are new"),
        ):
            updating.prepare_update_plan(
                api,
                self.git(pr["head"]["sha"]),
                "bokeh/bokeh",
                15264,
            )
