from __future__ import absolute_import

import unittest
import sys
import platform
import os
import mock


class CaptureString():
    value = ""

    def write(self, string):
        self.value += string

    def flush(self):
        pass


def CaptureStdOut():
    # replace stdout with something we can capture
    out = CaptureString()
    sys.stdout = out
    return out


class TestPrintVersions(unittest.TestCase):

    def setUp(self):
        self.out = CaptureStdOut()

    def test_print(self):
        import bokeh
        bokeh.print_versions()
        # check the correct info is present
        sysinfo = [platform.python_version(),
                   platform.python_implementation(),
                   platform.platform(),
                   bokeh.__version__]
        for info in sysinfo:
            self.assertIn(info, self.out.value)

    def test_version_defined(self):
        import bokeh
        self.assertTrue(bokeh.__version__ != 'unknown')


if __name__ == "__main__":
    unittest.main()
