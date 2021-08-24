import subprocess


def InstallHooks() -> None:
    subprocess.run(
        ["pre-commit", "install", "--install-hooks", "--hook-type", "pre-push"]
    )


if __name__ == "__main__":
    InstallHooks()
