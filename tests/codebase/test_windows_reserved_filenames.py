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
from os.path import join, splitext

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

@pytest.mark.codebase
def test_windows_reserved_filenames():
    ''' Certain seemingly innocuous filenames like "aux.js" will cause
    Windows packages to fail spectacularly. This test ensures those reserved
    names are not present in the codebase.

    '''
    bad = []
    for path, _, files in os.walk("."):

        for file in files:
            if splitext(file)[0].upper() in RESERVED_NAMES:
                bad.append(join(path, file))

    assert len(bad) == 0, "Windows reserved filenames detected:\n%s" % "\n".join(bad)

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

# list taken from https://msdn.microsoft.com/en-us/library/aa578688.aspx
RESERVED_NAMES = (
    "CON",
    "PRN",
    "AUX",
    "CLOCK$",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
)
