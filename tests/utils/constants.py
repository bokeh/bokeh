import os
from os.path import dirname, join, abspath, pardir

from .utils import get_version_from_git

default_timeout = int(os.environ.get("BOKEH_DEFAULT_TIMEOUT", 10))
default_diff = os.environ.get("BOKEH_DEFAULT_DIFF", None)
default_upload = default_diff is not None

s3_bucket = "bokeh-travis"
s3 = "https://s3.amazonaws.com/%s" % s3_bucket

build_id = os.environ.get("TRAVIS_BUILD_ID", "local")
job_id = os.environ.get("TRAVIS_JOB_ID", "local")

__version__ = get_version_from_git()
