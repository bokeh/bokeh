from __future__ import absolute_import

from ._version import get_versions
__version__ = get_versions()['version']
del get_versions

from .utils import Settings
settings = Settings()
del Settings

from . import sampledata
from .serverconfig import Cloud, Server
from .utils import load_notebook, print_versions, Settings, test


