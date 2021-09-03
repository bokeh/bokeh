import subprocess


def UninstallHooks() -> None:
    subprocess.run("pre-commit uninstall -t pre-push".split())


if __name__ == "__main__":
    UninstallHooks()
