from __future__ import print_function

import os
from os.path import join, splitext

import pytest

# list taken from https://msdn.microsoft.com/en-us/library/aa578688.aspx
reserved = (
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

@pytest.mark.quality
def test_windows_reserved_filenames():

    # Certain seemingly innocuous filenames like "aux.js" will cause
    # windows packages to fail spectacularly

    bad = []
    for path, dirs, files in os.walk("."):

        for file in files:
            if splitext(file)[0].upper() in reserved:
                bad.append(join(path, file))

    assert len(bad) == 0, "Windows reserved filenames detected:\n%s" % "\n".join(bad)
