#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys

if sys.version_info >= (3, 13):
    from ntpath import isreserved as _is_reserved
else:
    from pathlib import PureWindowsPath

    def _is_reserved(path: str) -> bool:
        # PureWindowsPath.is_reserved() covers device names on Python 3.12,
        # while ntpath.isreserved() adds these rules in Python 3.13.
        for part in path.replace("\\", "/").split("/"):
            if PureWindowsPath(part).is_reserved():
                return True
            if part[-1:] in (".", " ") and part not in (".", ".."):
                return True
            if any(ord(char) < 32 or char in ':*?"<>|' for char in part):
                return True
        return False

# Bokeh imports
from bokeh.util.strings import nice_join
from tests.support.util.project import ls_files

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_windows_reserved_filenames() -> None:
    ''' Certain seemingly innocuous filenames like "aux.js" will cause
    Windows packages to fail spectacularly. This test ensures those reserved
    names are not present in the codebase.

    '''
    bad = [path for path in ls_files() if path and _is_reserved(path)]

    assert len(bad) == 0, f"Windows reserved filenames detected:\n{nice_join(bad)}"
