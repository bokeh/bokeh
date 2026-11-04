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
from subprocess import run

import pytest

from tests.support.util.project import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

@pytest.mark.timeout(240)
def test_oxlint() -> None:
    ''' Assures that the BokehJS codebase passes configured oxlint checks

    '''
    proc = run(
        ["node", "make", "lint"],
        cwd=TOP_PATH/"bokehjs",
        capture_output=True,
    )
    assert proc.returncode == 0, f"oxlint issues:\n{proc.stdout.decode('utf-8')}\n{proc.stderr.decode('utf-8')}"

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
