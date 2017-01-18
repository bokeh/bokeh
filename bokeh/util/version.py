""" Provide a version for the Bokeh library.

This module uses `versioneer`_ to manage version strings. During development,
`versioneer`_ will compute a version string from the current git revision.
For packaged releases based off tags, the version string is hard coded in the
files packaged for distribution.

Attributes:
    __version__:
        The full version string for this installed Bokeh library

    __base_version__:
        The base version string , without any "dev", "rc" or local build
        information appended.

.. _versioneer: https://github.com/warner/python-versioneer

"""
from __future__ import absolute_import

from .._version import get_versions
__version__ = get_versions()['version']
del get_versions

def base_version():
    import re
    VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)((?:dev|rc).*)?")
    return VERSION_PAT.search(__version__).group(1)

__base_version__ = base_version()
del base_version
