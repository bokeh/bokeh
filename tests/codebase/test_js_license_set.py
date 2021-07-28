#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc. All rights reserved.
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
import os
import sys
from subprocess import run

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

# If this list changes, then bokehjs/LICENSE should be updated accordingly
LICENSES = [
    '0BSD',
    'Apache-2.0',
    'AFLv2.1',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'MIT',
    'Unlicense',
    'WTFPL',
]

@pytest.mark.skipif(sys.platform == "win32", reason="skip license tests on Windows")
def test_js_license_set() -> None:
    ''' If the current set of JS licenses changes, they should be noted in
    the bokehjs/LICENSE file.

    '''
    os.chdir('bokehjs')
    cmd = ["npx", "license-checker", "--production", "--summary", "--onlyAllow", ";".join(LICENSES)]
    proc = run(cmd)
    assert proc.returncode == 0, "New BokehJS licenses detected"
