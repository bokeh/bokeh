from __future__ import print_function

import subprocess
import sys

def get_version_from_git():
    cmd = ["git", "describe", "--tags", "--always"]

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    code = proc.wait()

    if code != 0:
        print("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    version = proc.stdout.read().decode('utf-8').strip()

    vers = version.split("-")[0]

    return vers

vers = get_version_from_git()
print(vers)
