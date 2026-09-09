# Standard library imports
import subprocess


def UninstallHooks() -> None:
    for hook_type in ("pre-commit", "pre-push"):
        subprocess.run(["pre-commit", "uninstall", "--hook-type", hook_type])


if __name__ == "__main__":
    UninstallHooks()
