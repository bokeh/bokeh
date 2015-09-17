from __future__ import absolute_import

import unittest
import sys
import platform

import bokeh.util.testing as testing

class _CaptureString():
    value = ""

    def write(self, string):
        self.value += string

    def flush(self):
        pass

def _CaptureStdOut():
    # replace stdout with something we can capture
    out = _CaptureString()
    sys.stdout = out
    return out

class TestPrintVersions(unittest.TestCase):

    def setUp(self):
        self.out = _CaptureStdOut()

    def test_print(self):
        import bokeh
        testing.print_versions()
        # check the correct info is present
        sysinfo = [platform.python_version(),
                   platform.python_implementation(),
                   platform.platform(),
                   bokeh.__version__]
        for info in sysinfo:
            self.assertIn(info, self.out.value)

if __name__ == "__main__":
    unittest.main()
