# This is based on sympy's sympy/utilities/tests/test_code_quality.py

import io
import subprocess
from os import pardir
from os.path import split, join, abspath, relpath

import pytest

TOP_PATH = abspath(join(split(__file__)[0], pardir))

message = "File contains refers to 'request.host': %s, line %s."

def collect_errors():
    errors = []

    def test_this_file(fname, test_file):
        for line_no, line in enumerate(test_file, 1):
            if "request.host" in line.split("#")[0]:
                errors.append((message, fname, line_no))

    paths = subprocess.check_output(["git", "ls-files"]).decode('utf-8').split("\n")

    for path in paths:
        if not path:
            continue

        if not path.endswith(".py"):
            continue

        if not path.startswith("bokeh/server"):
            continue

        with io.open(path, 'r', encoding='utf-8') as file:
            test_this_file(path, file)

    return [ msg % (relpath(fname, TOP_PATH), line_no) for (msg, fname, line_no) in errors ]

@pytest.mark.quality
def test_files():
    errors = collect_errors()
    assert len(errors) == 0, "request.host usage issues:\n%s" % "\n".join(errors)

if __name__ == "__main__":
    test_files()
