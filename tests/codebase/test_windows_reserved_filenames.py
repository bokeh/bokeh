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
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from ntpath import isreserved

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
    bad = [path for path in ls_files() if path and isreserved(path)]

    assert len(bad) == 0, f"Windows reserved filenames detected:\n{nice_join(bad)}"
