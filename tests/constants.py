import os
import subprocess
import sys
from os.path import dirname, join, abspath, pardir

from .utils import write

default_timeout = int(os.environ.get("BOKEH_DEFAULT_TIMEOUT", 10))
default_diff = os.environ.get("BOKEH_DEFAULT_DIFF", None)
default_upload = default_diff is not None

base_dir = dirname(__file__)
example_dir = abspath(join(base_dir, pardir, 'examples'))

s3_bucket = "bokeh-travis"
s3 = "https://s3.amazonaws.com/%s" % s3_bucket


#
# Handle types of example
#

class Flags(object):
    file = 1 << 1
    server = 1 << 2
    notebook = 1 << 3
    animated = 1 << 4
    skip = 1 << 5


def example_type(flags):
    if flags & Flags.file:
        return "file"
    elif flags & Flags.server:
        return "server"
    elif flags & Flags.notebook:
        return "notebook"


#
#  Get Version
#

def get_version_from_git(ref=None):
    cmd = ["git", "describe", "--tags", "--always"]

    if ref is not None:
        cmd.append(ref)

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
        tag, _, sha1 = version.split("-")
    except ValueError:
        return version
    else:
        return "%s-%s" % (tag, sha1[1:])

__version__ = get_version_from_git()
