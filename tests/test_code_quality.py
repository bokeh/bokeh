# This is based on sympy's sympy/utilities/tests/test_code_quality.py

import io
import subprocess
from os import pardir
from os.path import split, join, abspath, relpath, basename, splitext

import pytest

TOP_PATH = abspath(join(split(__file__)[0], pardir))

MAX_LINE_LENGTH = 160

message_space     = "File contains trailing whitespace: %s, line %s."
message_tabs      = "File contains tabs instead of spaces: %s, line %s."
message_carriage  = "File contains carriage returns at end of line: %s, line %s"
message_eof       = "File does not end with a newline: %s, line %s"
message_multi_bof = "File starts with more than 1 empty line: %s, line %s"
message_multi_eof = "File ends with more than 1 empty line: %s, line %s"
message_too_long  = "File contains a line with over %(n)s characters: %%s, line %%s" % dict(n=MAX_LINE_LENGTH)

def tab_in_leading(s):
    """ Returns True if there are tabs in the leading whitespace of a line,
        including the whitespace of docstring code samples.
    """
    n = len(s) - len(s.lstrip())
    if not s[n:n + 3] in ['...', '>>>']:
        check = s[:n]
    else:
        smore = s[n + 3:]
        check = s[:n] + smore[:len(smore) - len(smore.lstrip())]
    return check.expandtabs() != check

def use_tab_rule(fname):
    return not (basename(fname) == 'Makefile' or splitext(fname)[1] == '.bat')

exclude_paths = ("CHANGELOG",)

exclude_exts = (".png", ".jpg", ".pxm", ".ico", ".ics", ".gz", ".gif", ".enc", ".svg", ".xml")

exclude_dirs = ("bokehjs/src/vendor", "sphinx/draw.io")

def collect_errors():
    errors = []

    def test_this_file(fname, test_file):
        line = None

        for idx, line in enumerate(test_file):
            line_no = idx + 1

            if idx == 0 and len(line.strip()) == 0:
                errors.append((message_multi_bof, fname, line_no))
            if line.endswith(" \n") or line.endswith("\t\n"):
                errors.append((message_space, fname, line_no))
            if line.endswith("\r\n") or line.endswith("\r"):
                errors.append((message_carriage, fname, line_no))
            if use_tab_rule(fname) and tab_in_leading(line):
                errors.append((message_tabs, fname, line_no))
            #if len(line) > MAX_LINE_LENGTH:
            #    errors.append((message_too_long, fname, line_no))

        if line is not None:
            if idx > 0 and len(line.strip()) == 0:
                errors.append((message_multi_eof, fname, line_no))
            if not line.endswith('\n'):
                errors.append((message_eof, fname, line_no))

    paths = subprocess.check_output(["git", "ls-files"]).decode('utf-8').split("\n")

    for path in paths:
        if not path:
            continue

        if path in exclude_paths:
            continue

        if path.endswith(exclude_exts):
            continue

        if path.startswith(exclude_dirs):
            continue

        with io.open(path, 'r', encoding='utf-8') as file:
            test_this_file(path, file)

    return [ msg % (relpath(fname, TOP_PATH), line_no) for (msg, fname, line_no) in errors ]

def bad_files():
    return " ".join(sorted(set([ file for (_, file, _) in collect_errors() ])))

@pytest.mark.quality
def test_files():
    errors = collect_errors()
    assert len(errors) == 0, "Code quality issues:\n%s" % "\n".join(errors)

if __name__ == "__main__":
    test_files()
