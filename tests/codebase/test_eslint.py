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
from subprocess import run

# Bokeh imports
from tests.support.util.project import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

@pytest.mark.timeout(240)
def test_eslint() -> None:
    ''' Assures that the BokehJS codebase passes configured eslint checks

    '''
    proc = run(
        ["node", "make", "lint"],
        cwd=TOP_PATH/"bokehjs",
        capture_output=True,
    )
    assert proc.returncode == 0, f"eslint issues:\n{proc.stdout.decode('utf-8')}\n{proc.stderr.decode('utf-8')}"

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
