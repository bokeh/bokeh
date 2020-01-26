#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
from os.path import basename, join
from subprocess import PIPE, Popen
from typing import Dict, Optional

# Bokeh imports
from .. import __version__
from .util.paths import ROOT_DIR, bokehjsdir
from .util.version import is_full_release

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "get_all_sri_hashes",
    "get_sri_hashes_for_version",
    "verify_sri_hashes",
)

_SRI_HASHES: Optional[Dict[str, Dict[str, str]]] = None

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

def get_all_sri_hashes() -> Dict[str, Dict[str, str]]:
    """ Report SRI script hashes for all versions of BokehJS.

    Bokeh provides `Subresource Integrity`_ hashes for all JavaScript files that
    are published to CDN for full releases. This function returns a dictionary
    that maps version strings to sub-dictionaries that JavaScipt filenames to
    their hashes.

    Returns:
        dict

    Example:

        The returned dict will map version strings to sub-dictionaries for each
        version:

        .. code-block:: python

            {
                '1.4.0': {
                    'bokeh-1.4.0.js': 'vn/jmieHiN+ST+GOXzRU9AFfxsBp8gaJ/wvrzTQGpIKMsdIcyn6U1TYtvzjYztkN',
                    'bokeh-1.4.0.min.js': 'mdMpUZqu5U0cV1pLU9Ap/3jthtPth7yWSJTu1ayRgk95qqjLewIkjntQDQDQA5cZ',
                    ...
                }
                '1.3.4': {
                    ...
                }
                ...
            }

    .. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

    """
    global _SRI_HASHES

    if not _SRI_HASHES:
        _SRI_HASHES = json.load(open(join(ROOT_DIR, "_sri.json")))

    assert _SRI_HASHES
    return dict(_SRI_HASHES)


def get_sri_hashes_for_version(version: str) -> Dict[str, str]:
    """ Report SRI script hashes for a specific version of BokehJS.

    Bokeh provides `Subresource Integrity`_ hashes for all JavaScript files that
    are published to CDN for full releases. This function returns a dictionary
    that maps JavaScript filenames to their hashes, for a single version of
    Bokeh.

    Args:
        version (str) :
            The Bokeh version to return SRI hashes for. Hashes are only provided
            for full releases, e.g "1.4.0", and not for "dev" builds or release
            candidates.

    Returns:
        dict

    Example:

        The returned dict for a single version will map filenames for that
        version to their SRI hashes:

        .. code-block:: python

            {
                'bokeh-1.4.0.js': 'vn/jmieHiN+ST+GOXzRU9AFfxsBp8gaJ/wvrzTQGpIKMsdIcyn6U1TYtvzjYztkN',
                'bokeh-1.4.0.min.js': 'mdMpUZqu5U0cV1pLU9Ap/3jthtPth7yWSJTu1ayRgk95qqjLewIkjntQDQDQA5cZ',
                'bokeh-api-1.4.0.js': 'Y3kNQHt7YjwAfKNIzkiQukIOeEGKzUU3mbSrraUl1KVfrlwQ3ZAMI1Xrw5o3Yg5V',
                'bokeh-api-1.4.0.min.js': '4oAJrx+zOFjxu9XLFp84gefY8oIEr75nyVh2/SLnyzzg9wR+mXXEi+xyy/HzfBLM',
                'bokeh-gl-1.4.0.js': '/+5P6xEUbH87YpzmmpvP7veStj9hr1IBz+r/5oBPr9WwMIft5H4rEJCnyRJsgdRz',
                'bokeh-gl-1.4.0.min.js': 'nGZaob7Ort3hHvecwVIYtti+WDUaCkU+19+OuqX4ZWzw4ZsDQC2XRbsLEJ1OhDal',
                'bokeh-tables-1.4.0.js': 'I2iTMWMyfU/rzKXWJ2RHNGYfsXnyKQ3YjqQV2RvoJUJCyaGBrp0rZcWiTAwTc9t6',
                'bokeh-tables-1.4.0.min.js': 'pj14Cq5ZSxsyqBh+pnL2wlBS3UX25Yz1gVxqWkFMCExcnkN3fl4mbOF8ZUKyh7yl',
                'bokeh-widgets-1.4.0.js': 'scpWAebHEUz99AtveN4uJmVTHOKDmKWnzyYKdIhpXjrlvOwhIwEWUrvbIHqA0ke5',
                'bokeh-widgets-1.4.0.min.js': 'xR3dSxvH5hoa9txuPVrD63jB1LpXhzFoo0ho62qWRSYZVdyZHGOchrJX57RwZz8l'
            }

    .. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

    """
    hashes = get_all_sri_hashes()
    return hashes[version]


def verify_sri_hashes() -> None:
    """ Verify the SRI hashes in a full release package.

    This function compares the computed SRI hashes for the BokehJS files in a
    full release package to the values in the SRI manifest file. Returns None
    if all hashes match, otherwise an exception will be raised.

    .. note::
        This function can only be called on full release (e.g "1.2.3") packages.

    Returns:
        None

    Raises:
        ValueError
            If called outside a full release package
        RuntimeError
            If there are missing, extra, or mismatched files

    """
    if not is_full_release():
        raise ValueError("verify_sri_hashes() can only be used with full releases")

    from glob import glob
    paths = glob(join(bokehjsdir(), "js/bokeh*.js"))

    hashes = get_sri_hashes_for_version(__version__)

    if len(hashes) < len(paths):
        raise RuntimeError("There are unexpected 'bokeh*.js' files in the package")

    if len(hashes) > len(paths):
        raise RuntimeError("There are 'bokeh*.js' files missing in the package")

    bad = []
    for path in paths:
        name, suffix = basename(path).split(".", 1)
        filename = f"{name}-{__version__}.{suffix}"
        sri_hash = _compute_single_hash(path)
        if hashes[filename] != sri_hash:
            bad.append(path)

    if bad:
        raise RuntimeError(f"SRI Hash mismatches in the package: {bad!r}")

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def _compute_single_hash(path: str) -> str:
    assert path.endswith(".js")

    digest = f"openssl dgst -sha384 -binary {path}".split()
    p1 = Popen(digest, stdout=PIPE)

    b64 = "openssl base64 -A".split()
    p2 = Popen(b64, stdin=p1.stdout, stdout=PIPE)

    out, _ = p2.communicate()
    return out.decode("utf-8").strip()
