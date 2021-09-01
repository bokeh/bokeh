import subprocess


def InstallHooks() -> None:
    subprocess.run("pre-commit install --install-hooks --hook-type pre-push".split())


if __name__ == "__main__":
    InstallHooks()
