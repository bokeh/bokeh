from __future__ import absolute_import, print_function

import subprocess
import sys

from bokeh.util.terminal import write

def get_version_from_git(ref):
    """Get git-version of a specific ref, e.g. HEAD, origin/master. """
    cmd = ["git", "describe", "--tags", "--always", ref]

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        code = proc.wait()
    except OSError:
        write("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    if code != 0:
        write("Failed to get version for %s" % ref)
        sys.exit(1)

    version = proc.stdout.read().decode('utf-8').strip()

    try:
        # git-version = tag-num-gSHA1
        tag, _, sha1 = version.split("-")
    except ValueError:
        return version
    else:
        return "%s-%s" % (tag, sha1[1:])
