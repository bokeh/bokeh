import subprocess
import sys


def ProtectMasterBranch():
    hookid = "protect-master-branch"
    protected_branch = b"master"
    current_branch = (
        subprocess.run(["git", "symbolic-ref", "HEAD"], capture_output=True)
        .stdout.split(b"/")[-1]
        .replace(b"\n", b"")
    )

    if protected_branch == current_branch:
        # Not portable to get user input, see:
        # https://stackoverflow.com/questions/65844278/any-way-to-get-user-input-from-a-hook
        print(
            f"You were about to push to {protected_branch}, if that's what you intended, "
            "you should run the following command:\n"
            f"SKIP={hookid} git push"
        )
        sys.exit(1)  # push will not execute
    else:
        sys.exit(0)  # push will execute


if __name__ == "__main__":
    ProtectMasterBranch()
