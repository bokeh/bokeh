import os
from os.path import dirname, join, abspath, pardir

from .utils import get_version_from_git

default_diff = os.environ.get("BOKEH_DEFAULT_DIFF")
default_upload = default_diff is not None

job_id = os.environ.get("TRAVIS_JOB_ID", "local")

__version__ = get_version_from_git()
