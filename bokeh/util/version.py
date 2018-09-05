''' Provide a version for the Bokeh library.

This module uses `versioneer`_ to manage version strings. During development,
`versioneer`_ will compute a version string from the current git revision.
For packaged releases based off tags, the version string is hard coded in the
files packaged for distribution.

Attributes:
    __version__:
        The full version string for this installed Bokeh library

Functions:
    base_version:
        Reurn the base version string, without any "dev", "rc" or local build
        information appended.

.. _versioneer: https://github.com/warner/python-versioneer

'''
from __future__ import absolute_import

from .._version import get_versions
__version__ = get_versions()['version']
del get_versions

def base_version():
    return _base_version_helper(__version__)

def _base_version_helper(version):
    import re
    VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)((?:dev|rc).*)?")
    return VERSION_PAT.search(version).group(1)
