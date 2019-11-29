#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
import os
import subprocess

# External imports
import pytest


@pytest.mark.js
class TestBokehJS(object):

    def test_bokehjs(self):
        os.chdir('bokehjs')
        proc = subprocess.Popen(["node", "make", "test"], stdout=subprocess.PIPE)
        out, errs = proc.communicate()
        msg = out.decode('utf-8', errors='ignore')
        os.chdir('..')
        print(msg)
        if proc.returncode != 0:
            assert False
