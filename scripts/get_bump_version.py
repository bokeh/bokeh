from __future__ import print_function

import subprocess

def get_version_from_git():
    cmd = ["git", "describe", "--tags", "--long", "--always"]

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    code = proc.wait()

    if code != 0:
        print("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    version = proc.stdout.read().decode('utf-8').strip()

    try:
        vers, since, gsha = version.split("-")
        status = ""
    except ValueError:
        vers, status, since, gsha = version.split("-")

    return vers, status, since, gsha

vers, status, since, gsha = get_version_from_git()

if status == "":
    print("You need to tag before building.")
else:
    print(vers + "." + status + "."+ gsha[1:])

