#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
from subprocess import PIPE, Popen

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

def test_js_license_set() -> None:
    ''' If the current set of JS licenses changes, they should be noted in
    the bokehjs/LICENSE file.

    '''
    os.chdir('bokehjs')
    proc = Popen([
        "npx", "license-checker", "--production", "--summary", "--onlyAllow", "%s" % ";".join(LICENSES)
    ],stdout=PIPE)
    proc.communicate()
    proc.wait()
    os.chdir('..')
    if proc.returncode != 0:
        assert False
