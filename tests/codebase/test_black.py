# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import pytest  # noqa isort:skip

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from os import chdir
from subprocess import PIPE, Popen

# Bokeh imports
from . import TOP_PATH

# -----------------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------------


@pytest.mark.codebase
def test_flake8():
    """ Assures that the Python codebase passes configured Flake8 checks

    """
    chdir(TOP_PATH)
    proc = Popen(["black", "-l", "120", "-t", "py36", "--check", "bokeh", "tests"], stdout=PIPE, stderr=PIPE)
    _, err = proc.communicate()
    assert proc.returncode == 0, "isort issues:\n%s" % err.decode("utf-8")


# -----------------------------------------------------------------------------
# Support
# -----------------------------------------------------------------------------
