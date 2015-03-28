import os
from os.path import join
import unittest
import subprocess

class TestBokehJS(unittest.TestCase):

    def test_bokehjs(self):
        os.chdir('bokehjs')
        proc = subprocess.Popen([join('node_modules', '.bin', 'gulp'), "test"])
        self.assertEqual(proc.wait(), 0)

if __name__ == "__main__":
    unittest.main()