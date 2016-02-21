import os
from os.path import dirname, join, abspath, pardir

from .utils import get_version_from_git

default_timeout = int(os.environ.get("BOKEH_DEFAULT_TIMEOUT", 10))
default_diff = os.environ.get("BOKEH_DEFAULT_DIFF", None)
default_upload = default_diff is not None

base_dir = dirname(__file__)
example_dir = abspath(join(base_dir, pardir, 'examples'))

s3_bucket = "bokeh-travis"
s3 = "https://s3.amazonaws.com/%s" % s3_bucket

build_id = os.environ.get("TRAVIS_BUILD_ID", "local")

__version__ = get_version_from_git()


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
