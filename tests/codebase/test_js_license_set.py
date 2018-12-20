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
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
from subprocess import PIPE, Popen

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

# If this list changes, then bokehjs/LICENSE should be updated accordingly
LICENSES = [
    'Apache-2.0',
    'AFLv2.1',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'MIT',
    'Unlicense',
    'WTFPL',
]

@pytest.mark.codebase
def test_js_license_set():
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
