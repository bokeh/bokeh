import re
import sys
import subprocess

from PIL import Image

from .utils import fail

import logging
logging.getLogger('PIL.PngImagePlugin').setLevel(logging.INFO)

regex = re.compile(r"(\d+) pixels are different")

def process_image_diff(diff_path, before_path, after_path):
    """ Returns the percentage of differing pixels or -1 if dimensions differ. """
    cmd = ["perceptualdiff", "-output", diff_path, before_path, after_path]

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        code = proc.wait()
    except OSError:
        fail("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    if code != 0:
        for line in proc.stdout.read().decode("utf-8").split('\n'):
            result = regex.match(line)
            if result is not None:
                pixels = int(result.group(1))
                with Image.open(after_path) as img:
                    w, h = img.size
                return float(pixels)/(w*h)
        else:
            return -1
    else:
        return 0
