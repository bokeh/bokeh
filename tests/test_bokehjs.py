from __future__ import print_function

import os
from os.path import join
import unittest
import subprocess

class TestBokehJS(unittest.TestCase):

    def test_bokehjs(self):
        os.chdir('bokehjs')
        proc = subprocess.Popen([join('node_modules', '.bin', 'gulp'), "test"],
                                stdout=subprocess.PIPE)
        result = proc.wait()
        msg = proc.stdout.read().decode('utf-8', errors='ignore')
        print(msg)
        if result != 0:
            assert False

if __name__ == "__main__":
    unittest.main()
