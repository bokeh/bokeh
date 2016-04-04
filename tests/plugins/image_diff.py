import subprocess
import sys

from .utils import fail


def process_image_diff(diff_path, before_path, after_path):

    cmd = ["perceptualdiff", "-output", diff_path, before_path, after_path]
    try:
        proc = subprocess.Popen(cmd)
        code = proc.wait()
    except OSError:
        fail("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    return code
