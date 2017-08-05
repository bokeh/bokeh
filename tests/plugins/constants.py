import os
from .utils import get_version_from_git

job_id = os.environ.get("TRAVIS_JOB_ID", "local")

__version__ = get_version_from_git('HEAD')
