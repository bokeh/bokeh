# Standard library imports
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Bokeh imports
from tests.tools.backport._support import FakeGraphQLAPI, candidate
from tools.backport import BackportError, candidates as candidate_ops, planning
from tools.backport.models import IssueRef


class ReleaseConventionTests(unittest.TestCase):
    def test_derives_next_patch_from_latest_stable_tag(self) -> None:
        tags = ["3.9.0", "3.9.1", "3.10.0.dev1", "junk"]
        self.assertEqual(candidate_ops.next_patch_version(tags), "3.9.2")

    def test_standardizes_target_and_backport_branches(self) -> None:
        self.assertEqual(candidate_ops.target_branch_for("3.9.2"), "branch-3.9")
        self.assertEqual(candidate_ops.backport_branch_for("3.9.2"), "backport/3.9.2")

    def test_uses_minor_milestones_for_dot_zero_releases(self) -> None:
        self.assertEqual(candidate_ops.milestone_for_version("3.10.0"), "3.10")
        self.assertEqual(candidate_ops.milestone_for_version("3.10.1"), "3.10.1")

    def test_uses_exact_label_spelling(self) -> None:
        self.assertEqual(candidate_ops.BACKPORT_LABEL, "NEEDS BACK PORT")


class CandidateDiscoveryTests(unittest.TestCase):
    @staticmethod
    def node(number: int, merged_at: str) -> dict:
        return {
            "baseRefName": "branch-3.10",
            "closingIssuesReferences": {
                "nodes": [
                    {
                        "issueType": {"name": "Bug"},
                        "number": number - 1000,
                    },
                ],
            },
            "labels": {"nodes": [{"name": candidate_ops.BACKPORT_LABEL}]},
            "mergeCommit": {"oid": f"{number:040x}"},
            "merged": True,
            "mergedAt": merged_at,
            "milestone": {"title": "3.10"},
            "number": number,
            "title": f"PR {number}",
            "url": f"https://example.invalid/pr/{number}",
        }

    def test_discovers_candidates_in_original_merge_order(self) -> None:
        api = FakeGraphQLAPI(
            [
                {
                    "search": {
                        "nodes": [
                            self.node(15261, "2026-07-03T00:00:00Z"),
                            self.node(15233, "2026-07-01T00:00:00Z"),
                        ],
                        "pageInfo": {
                            "endCursor": "page-2",
                            "hasNextPage": True,
                        },
                    },
                },
                {
                    "search": {
                        "nodes": [self.node(15217, "2026-07-02T00:00:00Z")],
                        "pageInfo": {
                            "endCursor": None,
                            "hasNextPage": False,
                        },
                    },
                },
            ],
        )

        result = candidate_ops.discover_candidates(api, "bokeh/bokeh")

        self.assertEqual([item.number for item in result], [15233, 15217, 15261])
        self.assertEqual(result[0].base_branch, "branch-3.10")
        self.assertEqual(result[0].milestone, "3.10")
        self.assertEqual(result[0].issues[0].issue_type, "Bug")
        self.assertNotIn("timelineItems", api.calls[0][0])
        self.assertIn("issueType", api.calls[0][0])
        self.assertIn('label:"NEEDS BACK PORT"', api.calls[0][1]["query"])
        self.assertNotIn("is:merged", api.calls[0][1]["query"])
        self.assertIsNone(api.calls[0][1]["cursor"])
        self.assertEqual(api.calls[1][1]["cursor"], "page-2")

    def test_rejects_label_on_unmerged_pr_instead_of_hiding_it(self) -> None:
        node = self.node(15299, "2026-07-04T00:00:00Z")
        node["merged"] = False
        node["mergedAt"] = None
        node["mergeCommit"] = None
        api = FakeGraphQLAPI(
            [
                {
                    "search": {
                        "nodes": [node],
                        "pageInfo": {
                            "endCursor": None,
                            "hasNextPage": False,
                        },
                    },
                },
            ],
        )

        with self.assertRaisesRegex(
            BackportError,
            "PR #15299.*not merged",
        ):
            candidate_ops.discover_candidates(api, "bokeh/bokeh")

    def test_discovers_explicit_unlabeled_prs_in_merge_order(self) -> None:
        later = self.node(15261, "2026-07-03T00:00:00Z")
        earlier = self.node(15233, "2026-07-01T00:00:00Z")
        later["labels"] = {"nodes": []}
        earlier["labels"] = {"nodes": []}
        api = FakeGraphQLAPI(
            [
                {"repository": {"pullRequest": later}},
                {"repository": {"pullRequest": earlier}},
            ],
        )

        result = candidate_ops.discover_candidates(
            api,
            "bokeh/bokeh",
            [15261, 15233],
        )

        self.assertEqual([item.number for item in result], [15233, 15261])
        self.assertNotIn("label:", api.calls[0][0])
        self.assertEqual(
            api.calls[0][1],
            {"owner": "bokeh", "name": "bokeh", "number": 15261},
        )


class PRFileTests(unittest.TestCase):
    def test_reads_numbers_hashes_and_bokeh_urls(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "backports.txt"
            path.write_text(
                "15261\n\n#15233\nhttps://github.com/bokeh/bokeh/pull/15217\n",
                encoding="utf-8",
            )

            numbers = candidate_ops.read_pr_numbers(path, "bokeh/bokeh")

        self.assertEqual(numbers, [15261, 15233, 15217])

    def test_reports_invalid_and_duplicate_entries_with_line_numbers(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "backports.txt"
            path.write_text("15233\nnot-a-pr\n", encoding="utf-8")
            with self.assertRaisesRegex(BackportError, r"backports\.txt:2"):
                candidate_ops.read_pr_numbers(path, "bokeh/bokeh")

            path.write_text("15233\n#15233\n", encoding="utf-8")
            with self.assertRaisesRegex(BackportError, r"backports\.txt:2.*line 1"):
                candidate_ops.read_pr_numbers(path, "bokeh/bokeh")


class CandidateEligibilityTests(unittest.TestCase):
    def test_explicit_file_may_backport_a_feature_to_a_new_minor_release(self) -> None:
        api = MagicMock()
        api.request.return_value = {"default_branch": "branch-4.1"}
        git = MagicMock()
        git.remote = "origin"
        git.remote_branch_exists.side_effect = [True, False]
        git.rev_parse.return_value = "0" * 40
        git.commit_messages.return_value = ""
        git.is_ancestor.return_value = False
        item = candidate(
            15233,
            base_branch="branch-4.0",
            milestone="4.0",
            issues=[IssueRef(number=100, issue_type="Feature")],
        )
        with patch.object(
            planning,
            "discover_candidates",
            return_value=[item],
        ) as discover:
            state = planning.prepare_plan(
                api,
                git,
                "bokeh/bokeh",
                version="3.10.0",
                target_branch="staging-branch-3.10",
                worktree=Path("/tmp/bokeh-explicit-backports"),
                candidate_numbers=[15233],
            )

        self.assertEqual(state.candidates, [item])
        discover.assert_called_once_with(api, "bokeh/bokeh", [15233])

    def test_explicit_file_rejects_a_feature_for_a_patch_release(self) -> None:
        api = MagicMock()
        api.request.return_value = {"default_branch": "branch-4.1"}
        git = MagicMock()
        git.remote = "origin"
        git.remote_branch_exists.return_value = True
        item = candidate(
            15233,
            base_branch="branch-4.0",
            milestone="4.0",
            issues=[IssueRef(number=100, issue_type="Feature")],
        )
        with (
            patch.object(planning, "discover_candidates", return_value=[item]),
            self.assertRaisesRegex(BackportError, "Feature"),
        ):
            planning.prepare_plan(
                api,
                git,
                "bokeh/bokeh",
                version="3.10.1",
                target_branch="staging-branch-3.10",
                worktree=Path("/tmp/bokeh-explicit-backports"),
                candidate_numbers=[15233],
            )

    def test_accepts_current_development_branch_and_milestone(self) -> None:
        self.assertEqual(
            candidate_ops.candidate_source_problems(
                [candidate(15233, base_branch="branch-4.0", milestone="4.0")],
                "branch-4.0",
                "branch-3.10",
            ),
            [],
        )

    def test_accepts_release_branch_reset_after_the_pr_was_merged(self) -> None:
        self.assertEqual(
            candidate_ops.candidate_source_problems(
                [candidate(15029, base_branch="branch-3.10", milestone="4.0")],
                "branch-4.0",
                "branch-3.10",
            ),
            [],
        )

    def test_rejects_label_on_pr_merged_to_wrong_branch(self) -> None:
        problems = candidate_ops.candidate_source_problems(
            [candidate(15233, base_branch="branch-3.9", milestone="4.0")],
            "branch-4.0",
            "branch-3.10",
        )
        self.assertEqual(len(problems), 1)
        self.assertIn("merged into branch-3.9", problems[0])

    def test_rejects_label_on_pr_with_wrong_or_missing_milestone(self) -> None:
        problems = candidate_ops.candidate_source_problems(
            [
                candidate(15233, milestone="3.9.2"),
                candidate(15261, milestone=None),
            ],
            "branch-4.0",
            "branch-3.10",
        )
        self.assertEqual(len(problems), 2)
        self.assertIn("'3.9.2', not '4.0'", problems[0])
        self.assertIn("'no milestone', not '4.0'", problems[1])

    def test_uses_the_current_milestone(self) -> None:
        item = candidate(15233, milestone="4.0")
        self.assertEqual(
            candidate_ops.candidate_source_problems(
                [item],
                "branch-4.0",
                "branch-3.10",
            ),
            [],
        )

    def test_rejects_default_branch_that_is_not_a_release_branch(self) -> None:
        problems = candidate_ops.candidate_source_problems(
            [candidate(1)],
            "main",
            "branch-3.10",
        )
        self.assertEqual(len(problems), 1)
        self.assertIn("not a development release branch", problems[0])

    def test_rejects_candidate_already_present_in_the_target(self) -> None:
        git = MagicMock()
        git.root = Path("/repo")
        git.commit_messages.return_value = ""
        git.is_ancestor.return_value = True
        item = candidate(15233)

        problems = candidate_ops.candidate_target_problems(git, [item], "origin/branch-3.10")

        self.assertEqual(
            problems,
            ["PR #15233's merge commit is already present in origin/branch-3.10"],
        )
        git.ensure_commit.assert_called_once_with(item.merge_sha)

    def test_rejects_candidate_already_cherry_picked_into_the_target(self) -> None:
        git = MagicMock()
        git.root = Path("/repo")
        item = candidate(15233)
        git.commit_messages.return_value = f"Backport\n\n(cherry picked from commit {item.merge_sha})\n\x00"
        git.is_ancestor.return_value = False

        problems = candidate_ops.candidate_target_problems(git, [item], "origin/branch-3.10")

        self.assertEqual(problems, ["PR #15233 was already cherry-picked into origin/branch-3.10"])

    def test_requires_every_linked_issue_to_be_bug_or_task(self) -> None:
        issues = [
            IssueRef(
                number=100,
                issue_type="Bug",
            ),
            IssueRef(
                number=101,
                issue_type="Feature",
            ),
        ]
        problems = candidate_ops.candidate_type_problems([candidate(15233, issues=issues)])
        self.assertEqual(len(problems), 1)
        self.assertIn("issue #101", problems[0])
        self.assertIn("Feature", problems[0])

    def test_allows_features_only_for_new_minor_releases(self) -> None:
        item = candidate(
            15233,
            issues=[IssueRef(number=100, issue_type="Feature")],
        )

        self.assertEqual(
            candidate_ops.candidate_type_problems([item], allow_features=True),
            [],
        )
        self.assertIn("Feature", candidate_ops.candidate_type_problems([item])[0])

    def test_discussion_is_rejected_for_new_minor_releases(self) -> None:
        item = candidate(
            15233,
            issues=[IssueRef(number=100, issue_type="Discussion")],
        )

        problems = candidate_ops.candidate_type_problems([item], allow_features=True)

        self.assertEqual(len(problems), 1)
        self.assertIn("Discussion", problems[0])

    def test_allows_task_and_bug_issues(self) -> None:
        issues = [
            IssueRef(
                number=100,
                issue_type="Bug",
            ),
            IssueRef(
                number=101,
                issue_type="Task",
            ),
        ]
        self.assertEqual(
            candidate_ops.candidate_type_problems([candidate(15233, issues=issues)]),
            [],
        )

    def test_pr_without_linked_issue_is_rejected_even_with_a_type_label(self) -> None:
        problems = candidate_ops.candidate_type_problems(
            [candidate(15233, labels=["type: task"])],
        )
        self.assertEqual(len(problems), 1)
        self.assertIn("no associated issue", problems[0])
