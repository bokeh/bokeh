"""Non-interactive Git operations for backport worktrees."""

# Standard library imports
import os
import subprocess
from pathlib import Path
from typing import Self

# Bokeh imports
from . import BackportError


class GitRepo:
    """Git operations scoped to a repository and dedicated worktree."""

    def __init__(self, root: Path, remote: str = "origin") -> None:
        self.root = root.resolve()
        self.remote = remote

    @classmethod
    def discover(
        cls,
        cwd: Path | None = None,
        remote: str = "origin",
    ) -> Self:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=cwd,
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            raise BackportError("run backport from inside a Git repository")
        return cls(Path(result.stdout.strip()), remote)

    def run(
        self,
        *args: str,
        cwd: Path | str | None = None,
        check: bool = True,
        env: dict[str, str] | None = None,
    ) -> subprocess.CompletedProcess[str]:
        command = ["git", *args]
        result = subprocess.run(
            command,
            cwd=cwd or self.root,
            text=True,
            capture_output=True,
            env={**os.environ, **(env or {})},
            check=False,
        )
        if check and result.returncode != 0:
            detail = "\n".join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
            raise BackportError(f"{' '.join(command)} failed: {detail}")
        return result

    def fetch_tags(self) -> None:
        self.run("fetch", "--prune", "--tags", self.remote)

    def fetch_branches(self, *branches: str) -> None:
        unique = list(dict.fromkeys(branches))
        self.run("fetch", "--prune", self.remote, *unique)

    def remote_branch_exists(self, branch: str) -> bool:
        return (
            self.run(
                "ls-remote",
                "--exit-code",
                "--heads",
                self.remote,
                f"refs/heads/{branch}",
                check=False,
            ).returncode
            == 0
        )

    def branch_exists(self, branch: str) -> bool:
        return (
            self.run(
                "show-ref",
                "--verify",
                "--quiet",
                f"refs/heads/{branch}",
                check=False,
            ).returncode
            == 0
        )

    def ensure_commit(self, sha: str) -> None:
        exists = self.run("cat-file", "-e", f"{sha}^{{commit}}", check=False)
        if exists.returncode == 0:
            return
        self.run("fetch", self.remote, sha)
        self.run("cat-file", "-e", f"{sha}^{{commit}}")

    def rev_parse(self, ref: str, *, cwd: Path | str | None = None) -> str:
        return self.run("rev-parse", ref, cwd=cwd).stdout.strip()

    def common_dir(self) -> Path:
        value = Path(self.run("rev-parse", "--git-common-dir").stdout.strip())
        return value if value.is_absolute() else (self.root / value).resolve()

    def default_worktree(self, version: str) -> Path:
        common_dir = self.common_dir()
        repository = common_dir.parent if common_dir.name == ".git" else self.root
        return repository.parent / f"{repository.name}-backport-{version}"

    def add_worktree(
        self,
        path: Path,
        branch: str,
        target_branch: str,
        *,
        detached: bool = False,
    ) -> None:
        if path.exists():
            raise BackportError(f"worktree path already exists: {path}")
        if detached:
            self.run(
                "worktree",
                "add",
                "--detach",
                str(path),
                f"{self.remote}/{target_branch}",
            )
            return
        if self.branch_exists(branch):
            raise BackportError(f"local branch already exists: {branch}")
        self.run(
            "worktree",
            "add",
            "-b",
            branch,
            str(path),
            f"{self.remote}/{target_branch}",
        )

    def head(self, worktree: Path | str) -> str:
        return self.rev_parse("HEAD", cwd=worktree)

    def current_branch(self, worktree: Path | str) -> str:
        return self.run("symbolic-ref", "--short", "HEAD", cwd=worktree).stdout.strip()

    def is_detached(self, worktree: Path | str) -> bool:
        return self.run("symbolic-ref", "--quiet", "HEAD", cwd=worktree, check=False).returncode != 0

    def commit_message(self, worktree: Path | str, ref: str = "HEAD") -> str:
        return self.run("show", "-s", "--format=%B", ref, cwd=worktree).stdout

    def commit_messages(self, ref: str) -> str:
        return self.run("log", "--format=%B%x00", ref).stdout

    def is_ancestor(self, ancestor: str, descendant: str, worktree: Path | str) -> bool:
        return (
            self.run(
                "merge-base",
                "--is-ancestor",
                ancestor,
                descendant,
                cwd=worktree,
                check=False,
            ).returncode
            == 0
        )

    def status(self, worktree: Path | str) -> str:
        return self.run("status", "--short", cwd=worktree).stdout

    def is_clean(self, worktree: Path | str) -> bool:
        return not self.status(worktree).strip()

    def cherry_pick(
        self,
        worktree: Path | str,
        sha: str,
        *,
        record_origin: bool = True,
    ) -> subprocess.CompletedProcess[str]:
        arguments = ["cherry-pick"]
        if record_origin:
            arguments.append("-x")
        arguments.append(sha)
        return self.run(
            *arguments,
            cwd=worktree,
            check=False,
            env={"GIT_EDITOR": "true"},
        )

    def cherry_pick_in_progress(self, worktree: Path | str) -> bool:
        value = self.run(
            "rev-parse",
            "--git-path",
            "CHERRY_PICK_HEAD",
            cwd=worktree,
        ).stdout.strip()
        path = Path(value)
        if not path.is_absolute():
            path = Path(worktree) / path
        return path.exists()

    def conflict_files(self, worktree: Path | str) -> list[str]:
        output = self.run(
            "diff",
            "--name-only",
            "--diff-filter=U",
            cwd=worktree,
        ).stdout
        return sorted(line for line in output.splitlines() if line)

    def diff_check(
        self,
        worktree: Path | str,
    ) -> subprocess.CompletedProcess[str]:
        return self.run(
            "-c",
            "core.whitespace=cr-at-eol",
            "diff",
            "--check",
            "HEAD",
            cwd=worktree,
            check=False,
        )

    def continue_cherry_pick(
        self,
        worktree: Path | str,
    ) -> subprocess.CompletedProcess[str]:
        self.run("add", "-A", cwd=worktree)
        return self.run(
            "cherry-pick",
            "--continue",
            cwd=worktree,
            check=False,
            env={"GIT_EDITOR": "true"},
        )

    def abort_cherry_pick(self, worktree: Path | str) -> None:
        if self.cherry_pick_in_progress(worktree):
            self.run("cherry-pick", "--abort", cwd=worktree)

    def commits_since(
        self,
        worktree: Path | str,
        base_sha: str,
    ) -> list[str]:
        output = self.run(
            "rev-list",
            "--reverse",
            f"{base_sha}..HEAD",
            cwd=worktree,
        ).stdout
        return [line for line in output.splitlines() if line]

    def reset_hard(self, worktree: Path | str, sha: str) -> None:
        self.run("reset", "--hard", sha, cwd=worktree)

    def push(self, worktree: Path | str, branch: str) -> None:
        if self.remote_branch_exists(branch):
            self.run(
                "push",
                "--force-with-lease",
                self.remote,
                f"HEAD:{branch}",
                cwd=worktree,
            )
        else:
            self.run(
                "push",
                "--set-upstream",
                self.remote,
                f"HEAD:{branch}",
                cwd=worktree,
            )

    def remove_worktree(self, path: Path | str) -> list[str]:
        result = self.run("worktree", "remove", str(path), check=False)
        if result.returncode == 0:
            return []
        return [f"could not remove worktree {path}: {result.stderr.strip() or result.stdout.strip()}"]

    def remove_worktree_and_branch(
        self,
        path: Path | str,
        branch: str,
    ) -> list[str]:
        warnings = self.remove_worktree(path)
        if warnings:
            return warnings
        result = self.run("branch", "-D", branch, check=False)
        if result.returncode != 0:
            warnings.append(
                f"could not delete local branch {branch}: {result.stderr.strip() or result.stdout.strip()}",
            )
        return warnings
