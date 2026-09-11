# Standard library imports
import subprocess


def InstallHooks() -> None:
    for hook_type in ("pre-commit", "pre-push"):
        subprocess.run(["pre-commit", "install", "--install-hooks", "--hook-type", hook_type])


if __name__ == "__main__":
    InstallHooks()
