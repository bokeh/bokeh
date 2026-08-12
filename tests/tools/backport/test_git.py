# Standard library imports
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Bokeh imports
from tests.tools.backport._support import candidate, state_with
from tools.backport import (
    BackportError,
    aggregate,
    persistence,
    planning,
)
from tools.backport.git import GitRepo
from tools.backport.models import DedicatedCommit


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

    def test_diff_check_accepts_crlf_but_rejects_staged_or_unstaged_trailing_spaces(
        self,
    ) -> None:
        self.commit_file("value.txt", "base\n", "base")
        (self.root / "value.txt").write_bytes(b"changed\r\n")

        result = GitRepo(self.root).diff_check(self.root)

        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

        (self.root / "value.txt").write_bytes(b"changed \r\n")
        result = GitRepo(self.root).diff_check(self.root)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("trailing whitespace", result.stdout)

        self.git("add", "value.txt")
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
            aggregate.CHERRY_PICK_ORIGIN_RE.findall(self.git("show", "-s", "--format=%B", "HEAD")),
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

        (self.root / "value.txt").write_text("adapted \n")
        with self.assertRaisesRegex(BackportError, "patch errors"):
            planning.continue_plan(git, conflicted)
        self.assertEqual(item.status, "conflict")

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
