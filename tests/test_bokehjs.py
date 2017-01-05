from __future__ import print_function

import os
import pytest
from os.path import join
import sys
import unittest
import subprocess

if sys.platform == "win32":
    GULP = "gulp.cmd"
else:
    GULP = "gulp"

@pytest.mark.js
class TestBokehJS(unittest.TestCase):

    def test_bokehjs(self):
        os.chdir('bokehjs')
        proc = subprocess.Popen([join('node_modules', '.bin', GULP), "test"],
                                stdout=subprocess.PIPE)
        out, errs = proc.communicate()
        msg = out.decode('utf-8', errors='ignore')
        os.chdir('..')
        print(msg)
        if proc.returncode != 0:
            assert False

if __name__ == "__main__":
    unittest.main()
