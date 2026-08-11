# Standard library imports
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Bokeh imports
from tools.backport import (
    BackportError,
    candidates as candidate_ops,
    checks,
    github,
    merging,
    persistence,
    planning,
    publishing,
    range_diffs,
    updating,
)
from tools.backport.git import GitRepo
from tools.backport.interactive import plan_complete_panel
from tools.backport.models import (
    BackportEntry,
    BackportSummary,
    Candidate,
    DedicatedCommit,
    IssueRef,
    PlanState,
    PublishedPlan,
)


def valid_pr(*, body: str = "") -> dict:
    return {
        "base": {"ref": "branch-3.9"},
        "body": body,
        "draft": False,
        "head": {
            "ref": "backport/3.9.2",
            "repo": {"full_name": "bokeh/bokeh"},
            "sha": "abc123",
        },
        "html_url": "https://github.com/bokeh/bokeh/pull/15264",
        "merge_commit_sha": "def456",
        "mergeable": True,
        "merged_at": None,
        "number": 15264,
        "state": "open",
        "title": "[MERGE WITH CLI] Backports for 3.9.2",
    }


def candidate(
    number: int,
    *,
    merged_at: str | None = None,
    base_branch: str = "branch-3.10",
    milestone: str | None = "3.10",
    labels: list[str] | None = None,
    issues: list[IssueRef] | None = None,
    status: str = "pending",
    backport_sha: str | None = None,
) -> Candidate:
    return Candidate(
        number=number,
        title=f"Fix #{number}",
        url=f"https://github.com/bokeh/bokeh/pull/{number}",
        merged_at=merged_at or f"2026-07-{number % 28 + 1:02d}T12:00:00Z",
        merge_sha=f"{number:040x}",
        base_branch=base_branch,
        labels=labels or [],
        milestone=milestone,
        issues=issues or [],
        status=status,
        backport_sha=backport_sha,
    )


def state_with(candidates: list[Candidate]) -> PlanState:
    return PlanState(
        repository="bokeh/bokeh",
        version="3.9.2",
        target_branch="branch-3.9",
        branch="backport/3.9.2",
        worktree="/tmp/bokeh-backport-3.9.2",
        base_sha="0" * 40,
        candidates=candidates,
    )


class FakeGraphQLAPI:
    def __init__(self, pages: list[dict]) -> None:
        self.pages = pages
        self.calls: list[tuple[str, dict]] = []

    def graphql(self, query: str, variables: dict) -> dict:
        self.calls.append((query, variables))
        return self.pages[len(self.calls) - 1]


class RecordingAPI:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, dict]] = []

    def request(self, method: str, path: str, **kwargs: object) -> dict:
        self.calls.append((method, path, kwargs))
        return {"merged": True, "sha": "f" * 40}


class GitCommandTests(unittest.TestCase):
    def test_reports_stdout_and_stderr_from_failed_commands(self) -> None:
        completed = subprocess.CompletedProcess(
            args=[],
            returncode=1,
            stdout="pre-push hook failed\n",
            stderr="error: failed to push\n",
        )

        with (
            patch("tools.backport.git.subprocess.run", return_value=completed),
            self.assertRaisesRegex(
                BackportError,
                "pre-push hook failed\\nerror: failed to push",
            ),
        ):
            GitRepo(Path("/tmp/repo")).run("push")

    def test_default_worktree_uses_the_primary_checkout_name(self) -> None:
        git = GitRepo(Path("/work/bokeh-feature"))

        with patch.object(git, "common_dir", return_value=Path("/work/bokeh/.git")):
            path = git.default_worktree("3.10.0")

        self.assertEqual(path, Path("/work/bokeh-backport-3.10.0"))

    def test_push_uses_standard_hooks_for_new_and_existing_branches(self) -> None:
        worktree = Path("/tmp/worktree")
        branch = "backport/3.10.0"
        cases = [
            (False, "--set-upstream"),
            (True, "--force-with-lease"),
        ]

        for remote_exists, mode in cases:
            with self.subTest(remote_exists=remote_exists):
                git = GitRepo(Path("/tmp/repo"))
                with (
                    patch.object(git, "remote_branch_exists", return_value=remote_exists),
                    patch.object(git, "run") as run,
                ):
                    git.push(worktree, branch)

                run.assert_called_once_with(
                    "push",
                    mode,
                    "origin",
                    f"HEAD:{branch}",
                    cwd=worktree,
                )

    def test_creates_a_detached_worktree_for_an_update(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "worktree"
            git = GitRepo(root)
            with patch.object(git, "run") as run:
                git.add_worktree(
                    path,
                    "backport/3.10.0",
                    "branch-3.10",
                    detached=True,
                )

        run.assert_called_once_with(
            "worktree",
            "add",
            "--detach",
            str(path),
            "origin/branch-3.10",
        )


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

        problems = planning.candidate_target_problems(git, [item], "origin/branch-3.10")

        self.assertEqual(
            problems,
            ["PR #15233's merge commit is already present in origin/branch-3.10"],
        )
        git.ensure_commit.assert_called_once_with(item.merge_sha)

    def test_rejects_candidate_already_cherry_picked_into_the_target(self) -> None:
        git = MagicMock()
        git.root = Path("/repo")
        item = candidate(15233)
        git.commit_messages.return_value = (
            f"Backport\n\n(cherry picked from commit {item.merge_sha})\n\x00"
        )
        git.is_ancestor.return_value = False

        problems = planning.candidate_target_problems(git, [item], "origin/branch-3.10")

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
        git.rev_parse.side_effect = lambda ref: (
            head_sha if ref == "origin/backport/3.9.2" else "0" * 40
        )
        return git

    def test_adds_new_labeled_prs_in_merge_order_and_preserves_dedicated_tail(self) -> None:
        existing = candidate(15233, merged_at="2026-07-02T00:00:00Z")
        existing_backport = "a" * 40
        existing_state = state_with(
            [candidate(15233, status="applied", backport_sha=existing_backport)],
        )
        pr = valid_pr(body=planning.render_pr_body(existing_state))
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
        pr = valid_pr(body=planning.render_pr_body(existing_state))
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
            patch.object(updating, "candidate_source_problems") as source_problems,
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
        pr = valid_pr(body=planning.render_pr_body(body_state))
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
        pr = valid_pr(body=planning.render_pr_body(body_state))
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


class PRBodyTests(unittest.TestCase):
    def test_summarizes_only_accepted_prs_sorted_by_number(self) -> None:
        state = state_with(
            [
                candidate(
                    15261,
                    status="applied",
                    backport_sha="b" * 40,
                ),
                candidate(
                    15217,
                    status="rejected",
                    backport_sha=None,
                ),
                candidate(
                    15233,
                    status="applied",
                    backport_sha="a" * 40,
                ),
            ],
        )

        body = planning.render_pr_body(state)

        self.assertLess(body.index("#15233"), body.index("#15261"))
        self.assertNotIn("#15217", body)
        self.assertNotIn("~~", body)
        self.assertIn(
            "| PR | Result | Details |",
            body,
        )
        self.assertIn(
            "> Merge this PR with `python -m tools.backport merge`. Do not use GitHub's web UI.",
            body,
        )
        self.assertIn(
            "[#15233 Fix #15233](https://github.com/bokeh/bokeh/pull/15233) | clean |  |",
            body,
        )
        self.assertNotIn("Original commit", body)
        self.assertNotIn("Backport commit", body)
        self.assertNotIn("[ ]", body)
        self.assertNotIn("checklist", body.lower())
        self.assertNotIn("<!--", body)

    def test_marks_adapted_pick_in_summary(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        item.adapted = True
        body = planning.render_pr_body(
            state_with([item]),
            {15233: "https://htmlpreview.github.io/?https://gist.example/raw/diff.html"},
        )
        self.assertIn(
            "| adapted | [diff](https://htmlpreview.github.io/?https://gist.example/raw/diff.html) |",
            body,
        )

    def test_escapes_title_for_markdown_table(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        item.title = r"Fix [A]\B | C"
        body = planning.render_pr_body(state_with([item]))

        self.assertIn(r"[#15233 Fix \[A\]\\B \| C]", body)
        self.assertEqual(
            planning.parse_pr_body(body, "bokeh/bokeh"),
            [BackportSummary(15233, False)],
        )

    def test_generated_summary_round_trips_into_merge_entries(self) -> None:
        clean = candidate(15233, status="applied", backport_sha="a" * 40)
        adapted = candidate(15261, status="applied", backport_sha="b" * 40)
        adapted.adapted = True

        summaries = planning.parse_pr_body(
            planning.render_pr_body(
                state_with([adapted, clean]),
                {
                    15261: "https://htmlpreview.github.io/?https://gist.example/raw/diff.html",
                },
            ),
            "bokeh/bokeh",
        )

        self.assertEqual(
            summaries,
            [
                BackportSummary(15233, False),
                BackportSummary(15261, True),
            ],
        )

    def test_rejects_hand_edited_summary_rows(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = planning.render_pr_body(state_with([item])).replace("| clean |", "| maybe |")

        with self.assertRaisesRegex(BackportError, "invalid aggregate PR summary row"):
            planning.parse_pr_body(body, "bokeh/bokeh")

    def test_rejects_adapted_row_without_range_diff(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        item.adapted = True
        body = planning.render_pr_body(state_with([item]))

        with self.assertRaisesRegex(BackportError, "invalid aggregate PR summary row"):
            planning.parse_pr_body(body, "bokeh/bokeh")

    def test_rejects_unrecognized_extra_body_content(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = planning.render_pr_body(state_with([item])) + "\n<!-- hidden state -->\n"

        with self.assertRaisesRegex(BackportError, "invalid aggregate PR summary row"):
            planning.parse_pr_body(body, "bokeh/bokeh")

    def test_rejects_hidden_state(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = (
            planning.render_pr_body(state_with([item]))
            + "\n<!-- backport-state\n"
            + f"15233 {item.merge_sha} {'a' * 40}\n"
            + "-->\n"
        )

        with self.assertRaisesRegex(BackportError, "invalid aggregate PR summary row"):
            planning.parse_pr_body(body, "bokeh/bokeh")

    def test_rejects_changed_merge_instruction(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = planning.render_pr_body(state_with([item])).replace(
            "python -m tools.backport merge",
            "gh pr merge",
        )

        with self.assertRaisesRegex(BackportError, "not the generated backport summary"):
            planning.parse_pr_body(body, "bokeh/bokeh")


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
                "body": planning.render_pr_body(state),
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


class RangeDiffTests(unittest.TestCase):
    def test_generate_range_diff_renders_git_output_verbatim(self) -> None:
        git = MagicMock()
        git.run.return_value.stdout = "complete range diff\n"
        with (
            patch.object(
                range_diffs,
                "adapted_binary_files",
                return_value=["baseline.png"],
            ),
            patch.object(range_diffs, "render_html", return_value="<html>diff</html>") as render,
        ):
            result = range_diffs.generate_range_diff(
                git,
                Path("/tmp/worktree"),
                15249,
                "1" * 40,
                "a" * 40,
            )

        self.assertEqual(result, "<html>diff</html>")
        git.run.assert_called_once_with(
            "range-diff",
            "--dual-color",
            "--color=always",
            f"{'1' * 40}^!",
            f"{'a' * 40}^!",
            cwd=Path("/tmp/worktree"),
        )
        render.assert_called_once_with(
            15249,
            "1" * 40,
            "a" * 40,
            "complete range diff\n",
            ["baseline.png"],
        )

    def test_identifies_only_binary_files_with_different_patch_blobs(self) -> None:
        unchanged = "unchanged.png"
        adapted = "adapted.png"
        with patch.object(
            range_diffs,
            "_patch_files",
            side_effect=[
                ({unchanged, adapted}, {unchanged: ("1", "2"), adapted: ("3", "4")}),
                ({unchanged, adapted}, {unchanged: ("1", "2"), adapted: ("5", "6")}),
            ],
        ):
            result = range_diffs.adapted_binary_files(
                MagicMock(),
                Path("/tmp/worktree"),
                "1" * 40,
                "a" * 40,
            )

        self.assertEqual(result, [adapted])

    def test_renders_complete_dual_color_html(self) -> None:
        html = range_diffs.render_html(
            15249,
            "1" * 40,
            "a" * 40,
            "@@ Metadata\n    cherry picked from commit 3c\n\x1b[31;7m-\x1b[m\x1b[31mold\x1b[m\n\x1b[32;7m+\x1b[m\x1b[32mnew\x1b[m\n",
        )

        self.assertIn("Bokeh PR #15249", html)
        self.assertIn("original", html)
        self.assertIn("backport", html)
        self.assertIn("@@ Metadata", html)
        self.assertIn("cherry picked from commit 3c", html)
        self.assertIn("old", html)
        self.assertIn("new", html)
        self.assertIn("color-scheme: light", html)
        self.assertIn("background-color: #ffebe9; color: #cf222e", html)
        self.assertIn("background-color: #dafbe1; color: #1a7f37", html)
        self.assertIn('<span class="diff-removed">', html)
        self.assertIn('<span class="diff-added">', html)
        self.assertIn(".diff-added { background: rgb(26 127 55 / 10%); }", html)
        self.assertIn(".diff-removed { background: rgb(207 34 46 / 10%); }", html)
        self.assertNotIn("color-scheme: dark", html)

    def test_lists_binary_adaptations_that_git_cannot_render(self) -> None:
        html = range_diffs.render_html(
            15183,
            "1" * 40,
            "a" * 40,
            "range diff\n",
            ["bokehjs/test/baselines/linux/example<&>.png"],
        )

        self.assertIn("Binary adaptation not shown", html)
        self.assertIn("following binary file:", html)
        self.assertIn("bokehjs/test/baselines/linux/example&lt;&amp;&gt;.png", html)

    def test_publishes_one_revision_pinned_page_per_adapted_pick(self) -> None:
        clean = candidate(15233, status="applied", backport_sha="a" * 40)
        adapted = candidate(15249, status="applied", backport_sha="b" * 40)
        adapted.adapted = True
        state = state_with([clean, adapted])
        api = MagicMock()
        api.request.return_value = {
            "files": {
                "bokeh-15249-range-diff.html": {
                    "raw_url": "https://gist.example/revision/bokeh-15249-range-diff.html",
                },
            },
        }

        with patch.object(range_diffs, "generate_range_diff", return_value="<html>diff</html>"):
            urls = range_diffs.publish_range_diffs(api, MagicMock(), state)

        self.assertEqual(
            urls,
            {
                15249: "https://htmlpreview.github.io/?https://gist.example/revision/bokeh-15249-range-diff.html",
            },
        )
        payload = api.request.call_args.kwargs["json"]
        self.assertEqual(
            list(payload["files"]),
            ["bokeh-15249-range-diff.html"],
        )
        self.assertTrue(payload["public"])


class GitWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / "repo"
        self.root.mkdir()
        self.git("init")
        self.git("config", "user.name", "Backport Test")
        self.git("config", "user.email", "backport@example.invalid")
        self.git("config", "commit.gpgsign", "false")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def git(self, *arguments: str) -> str:
        result = subprocess.run(
            ["git", *arguments],
            cwd=self.root,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()

    def commit_file(self, name: str, content: str, message: str) -> str:
        (self.root / name).write_text(content)
        self.git("add", name)
        self.git("commit", "-m", message)
        return self.git("rev-parse", "HEAD")

    def test_diff_check_accepts_crlf_but_rejects_trailing_spaces(self) -> None:
        self.commit_file("value.txt", "base\n", "base")
        (self.root / "value.txt").write_bytes(b"changed\r\n")

        result = GitRepo(self.root).diff_check(self.root)

        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

        (self.root / "value.txt").write_bytes(b"changed \r\n")
        result = GitRepo(self.root).diff_check(self.root)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("trailing whitespace", result.stdout)

    def test_cleanup_removes_a_detached_update_worktree_without_deleting_the_branch(self) -> None:
        state = state_with([])
        state.worktree = str(self.root)
        state.branch = "backport/3.10.0"
        state.detached_worktree = True
        git = MagicMock()
        git.remove_worktree.return_value = []

        warnings = planning.cleanup_plan(git, state)

        self.assertEqual(warnings, [])
        git.abort_cherry_pick.assert_called_once_with(self.root)
        git.remove_worktree.assert_called_once_with(self.root)
        git.remove_worktree_and_branch.assert_not_called()

    def test_clean_candidates_are_one_commit_each_in_plan_order(self) -> None:
        self.commit_file("base.txt", "base\n", "base")
        base_sha = self.git("rev-parse", "HEAD")
        first_sha = self.commit_file("one.txt", "one\n", "first")
        second_sha = self.commit_file("two.txt", "two\n", "second")
        self.git("reset", "--hard", base_sha)

        first = candidate(15261)
        first.merge_sha = first_sha
        second = candidate(15217)
        second.merge_sha = second_sha
        state = state_with([first, second])
        state.worktree = str(self.root)
        state.base_sha = base_sha
        git = GitRepo(self.root)

        result = planning.advance_plan(git, state)

        self.assertEqual([item.status for item in result.candidates], ["applied"] * 2)
        self.assertEqual(len(git.commits_since(self.root, base_sha)), 2)
        self.assertEqual(
            self.git("log", "--reverse", "--format=%s", f"{base_sha}..HEAD").splitlines(),
            ["first", "second"],
        )

    def test_replays_an_existing_backport_without_adding_another_origin(self) -> None:
        self.commit_file("base.txt", "base\n", "base")
        base_sha = self.git("rev-parse", "HEAD")
        original_sha = self.commit_file("change.txt", "change\n", "original")
        self.git("switch", "-c", "aggregate", base_sha)
        self.git("cherry-pick", "-x", original_sha)
        existing_backport = self.git("rev-parse", "HEAD")
        self.git("switch", "-c", "rebuilt", base_sha)

        item = candidate(15233)
        item.merge_sha = original_sha
        item.replay_sha = existing_backport
        state = state_with([item])
        state.worktree = str(self.root)
        state.base_sha = base_sha
        state.review_each = True

        planning.advance_plan(GitRepo(self.root), state)

        self.assertEqual(item.status, "applied")
        self.assertEqual(
            planning.CHERRY_PICK_ORIGIN_RE.findall(self.git("show", "-s", "--format=%B", "HEAD")),
            [original_sha],
        )

    def test_replays_and_resolves_a_conflicted_dedicated_tail_commit(self) -> None:
        base_sha = self.commit_file("value.txt", "base\n", "base")
        self.git("switch", "-c", "new-source", base_sha)
        new_sha = self.commit_file("value.txt", "new\n", "new candidate")
        self.git("switch", "-c", "existing-source", base_sha)
        original_sha = self.commit_file("existing.txt", "existing\n", "existing candidate")
        self.git("switch", "-c", "aggregate", base_sha)
        self.git("cherry-pick", "-x", original_sha)
        existing_backport = self.git("rev-parse", "HEAD")
        tail_sha = self.commit_file("value.txt", "tail\n", "dedicated compatibility fix")
        self.git("switch", "-c", "rebuilt", base_sha)

        new = candidate(15139)
        new.merge_sha = new_sha
        existing = candidate(15233)
        existing.merge_sha = original_sha
        existing.replay_sha = existing_backport
        dedicated = DedicatedCommit(tail_sha, "dedicated compatibility fix")
        state = state_with([new, existing])
        state.worktree = str(self.root)
        state.base_sha = base_sha
        state.dedicated_commits = [dedicated]
        git = GitRepo(self.root)

        planning.advance_plan(git, state)

        self.assertEqual(dedicated.status, "conflict")
        self.assertEqual(dedicated.conflict_files, ["value.txt"])
        (self.root / "value.txt").write_text("combined\n")

        planning.continue_dedicated_commit(git, state)

        self.assertEqual(dedicated.status, "applied")
        self.assertIsNotNone(dedicated.backport_sha)
        self.assertEqual((self.root / "value.txt").read_text(), "combined\n")

    def test_continue_stages_and_commits_a_manually_resolved_conflict(self) -> None:
        base_sha = self.commit_file("value.txt", "base\n", "base")
        self.git("switch", "-c", "candidate")
        candidate_sha = self.commit_file("value.txt", "candidate\n", "candidate")
        self.git("switch", "-c", "target", base_sha)
        target_sha = self.commit_file("value.txt", "target\n", "target")

        item = candidate(15233)
        item.merge_sha = candidate_sha
        state = state_with([item])
        state.worktree = str(self.root)
        state.base_sha = target_sha
        git = GitRepo(self.root)

        conflicted = planning.advance_plan(git, state)
        self.assertEqual(conflicted.conflict, item)
        self.assertEqual(item.conflict_files, ["value.txt"])

        (self.root / "value.txt").write_text("adapted\n")
        resolved = planning.continue_plan(git, conflicted)

        self.assertIsNone(resolved.conflict)
        self.assertEqual(item.status, "applied")
        self.assertTrue(item.adapted)
        self.assertEqual((self.root / "value.txt").read_text(), "adapted\n")
        self.assertEqual(len(git.commits_since(self.root, target_sha)), 1)

    def test_review_each_accepts_or_rejects_clean_picks_one_at_a_time(self) -> None:
        self.commit_file("base.txt", "base\n", "base")
        base_sha = self.git("rev-parse", "HEAD")
        first_sha = self.commit_file("one.txt", "one\n", "first")
        second_sha = self.commit_file("two.txt", "two\n", "second")
        self.git("reset", "--hard", base_sha)

        first = candidate(15217)
        first.merge_sha = first_sha
        second = candidate(15233)
        second.merge_sha = second_sha
        state = state_with([first, second])
        state.worktree = str(self.root)
        state.base_sha = base_sha
        state.review_each = True
        git = GitRepo(self.root)

        reviewing_first = planning.advance_plan(git, state)
        self.assertEqual(reviewing_first.review, first)

        reviewing_second = planning.accept_candidate(
            git,
            reviewing_first,
            first.number,
        )
        self.assertEqual(reviewing_second.review, second)

        complete = planning.reject_candidate(
            git,
            reviewing_second,
            second.number,
            "Not suitable for this target",
        )
        self.assertIsNone(complete.review)
        self.assertEqual(first.status, "applied")
        self.assertEqual(second.status, "rejected")
        self.assertEqual(len(git.commits_since(self.root, base_sha)), 1)
        self.assertEqual(self.git("log", "-1", "--format=%s"), "first")

    def test_resume_recovers_a_pick_committed_after_the_last_checkpoint(self) -> None:
        self.commit_file("base.txt", "base\n", "base")
        base_sha = self.git("rev-parse", "HEAD")
        candidate_sha = self.commit_file("change.txt", "change\n", "candidate")
        self.git("switch", "-c", "backport/3.9.2", base_sha)

        item = candidate(15233, status="applying")
        item.merge_sha = candidate_sha
        state = state_with([item])
        state.worktree = str(self.root)
        state.base_sha = base_sha
        git = GitRepo(self.root)
        result = git.cherry_pick(self.root, candidate_sha)
        self.assertEqual(result.returncode, 0)

        restored = planning.resume_plan(git, state)

        self.assertEqual(restored.candidates[0].status, "applied")
        self.assertEqual(restored.candidates[0].backport_sha, self.git("rev-parse", "HEAD"))

    def test_resume_restores_an_active_conflict_from_local_json(self) -> None:
        base_sha = self.commit_file("value.txt", "base\n", "base")
        self.git("switch", "-c", "candidate")
        candidate_sha = self.commit_file("value.txt", "candidate\n", "candidate")
        self.git("switch", "-c", "backport/3.9.2", base_sha)
        target_sha = self.commit_file("value.txt", "target\n", "target")

        item = candidate(15233)
        item.merge_sha = candidate_sha
        state = state_with([item])
        state.worktree = str(self.root)
        state.base_sha = target_sha
        git = GitRepo(self.root)
        conflicted = planning.advance_plan(git, state)
        persistence.save_plan(git, conflicted)

        restored = planning.resume_plan(git, persistence.load_plan(git))

        self.assertEqual(restored.conflict, restored.candidates[0])
        self.assertEqual(restored.conflict.conflict_files, ["value.txt"])

    def test_resume_preserves_an_uncommitted_compatibility_fix_after_all_picks(self) -> None:
        base_sha = self.commit_file("base.txt", "base\n", "base")
        self.git("switch", "-c", "backport/3.9.2")
        backport_sha = self.commit_file("change.txt", "change\n", "backport")

        item = candidate(15233, status="applied", backport_sha=backport_sha)
        state = state_with([item])
        state.worktree = str(self.root)
        state.base_sha = base_sha
        (self.root / "compatibility.txt").write_text("work in progress\n")

        restored = planning.resume_plan(GitRepo(self.root), state)

        self.assertEqual(restored, state)
        self.assertTrue((self.root / "compatibility.txt").exists())


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


class MergeWorkflowTests(unittest.TestCase):
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
            merge_sha, warnings = merging.merge_plan(api, plan)

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
        finalize.assert_called_once_with(api, plan)

    def test_finalization_removes_the_label_whether_or_not_it_is_present(self) -> None:
        plan = self.plan()
        api = RecordingAPI()
        with (
            patch.object(merging, "ensure_milestone", return_value=7),
            patch.object(merging, "set_milestone"),
            patch.object(merging, "closing_issue_numbers", return_value=set()),
            patch.object(merging, "remove_label") as remove_label,
        ):
            warnings = merging.finalize_merged_plan(api, plan)

        self.assertEqual(warnings, [])
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
                "body": planning.render_pr_body(state_with([item])),
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
        pr = valid_pr(body=planning.render_pr_body(state_with([item])))
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
        body = planning.render_pr_body(state_with([item])).replace("\n", "\r\n")
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
        pr = valid_pr(body=planning.render_pr_body(state_with([item])))
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
        pr = valid_pr(body=planning.render_pr_body(state_with([item])))
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


class GitHubCLITests(unittest.TestCase):
    def test_sends_json_requests_through_gh_api(self) -> None:
        completed = subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout='{"merged": true}',
            stderr="",
        )
        with patch("tools.backport.github.subprocess.run", return_value=completed) as run:
            result = github.GitHubAPI().request(
                "PUT",
                "/repos/bokeh/bokeh/pulls/15264/merge",
                json={"merge_method": "rebase"},
            )

        self.assertEqual(result, {"merged": True})
        run.assert_called_once_with(
            [
                "gh",
                "api",
                "--method",
                "PUT",
                "repos/bokeh/bokeh/pulls/15264/merge",
                "--input",
                "-",
            ],
            input='{"merge_method": "rebase"}',
            text=True,
            capture_output=True,
            check=False,
        )

    def test_allows_an_expected_http_error(self) -> None:
        completed = subprocess.CompletedProcess(
            args=[],
            returncode=1,
            stdout='{"message": "Not Found"}',
            stderr="gh: Not Found (HTTP 404)\n",
        )
        with patch("tools.backport.github.subprocess.run", return_value=completed):
            result = github.GitHubAPI().request(
                "DELETE",
                "/repos/bokeh/bokeh/git/refs/heads/backport/3.9.2",
                expected=(204, 404),
            )

        self.assertEqual(result, {"message": "Not Found"})


if __name__ == "__main__":
    unittest.main()
