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

    try:
        vers, mod = version.split("-")[:2]
    except ValueError:
        vers, mod = version, ""

    return vers, mod

vers, mod = get_version_from_git()
vals = vers.split('.')

if not mod.startswith('rc'):
    #check for X.X and increment to X.X.1
    if len(vals) < 3:
        new_ver = '.'.join(vals) + '.1'
        print(new_ver)
    else:
        new_val = int(vals[-1]) + 1
        new_val = str(new_val)
        vals[-1] = new_val
        new_ver = '.'.join(vals)
        print(new_ver)
else:
    new_ver = vers + '-' + mod
    print(new_ver)
