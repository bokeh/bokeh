import re
import sys
from subprocess import run
from typing import NoReturn


def ProtectBranches() -> NoReturn:
    hookid = "protect-branches"
    protected_branches = [r"main", r"branch-\d+\.\d+"]
    current_branch = run(["git", "branch", "--show-current"], capture_output=True).stdout.decode(sys.stdout.encoding).replace("\n", "")
    for branch in protected_branches:
        regex = re.compile(branch)
        if regex.match(current_branch):
            # Not portable to get user input, see:
            # https://stackoverflow.com/questions/65844278/any-way-to-get-user-input-from-a-hook
            print(
                f"""
You were about to push to `{current_branch}`, which is disallowed by default.
If that's really what you intend, run the following command:

        SKIP={hookid} git push
""",
            )
            sys.exit(1)  # push will not execute

    sys.exit(0)  # push will execute


if __name__ == "__main__":
    ProtectBranches()
