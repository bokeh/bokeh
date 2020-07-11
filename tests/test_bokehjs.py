#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
import os
import subprocess


class TestBokehJS:
    def test_bokehjs(self) -> None:
        os.chdir('bokehjs')
        proc = subprocess.Popen(["node", "make", "test"], stdout=subprocess.PIPE)
        out, errs = proc.communicate()
        msg = out.decode('utf-8', errors='ignore')
        os.chdir('..')
        print(msg)
        if proc.returncode != 0:
            assert False
