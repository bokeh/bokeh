"""

"""
from __future__ import absolute_import

try:
    from ..__conda_version__ import conda_version
    __version__ = conda_version.replace("'","")
    del conda_version
except ImportError:
    from .._version import get_versions
    __version__ = get_versions()['version']
    del get_versions