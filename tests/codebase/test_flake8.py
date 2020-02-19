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
from os import chdir
from subprocess import PIPE, Popen

# Bokeh imports
from . import TOP_PATH

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_flake8() -> None:
    ''' Assures that the Python codebase passes configured Flake8 checks

    '''
    chdir(TOP_PATH)
    proc = Popen(["flake8"], stdout=PIPE, stderr=PIPE)
    out, _ = proc.communicate()
    assert proc.returncode == 0, "Flake8 issues:\n%s" % out.decode("utf-8")

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------
