#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import subprocess
from os import pardir
from os.path import (
    abspath,
    basename,
    join,
    split,
    splitext,
)
from typing import IO

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_code_quality() -> None:
    ''' Applies a collection of general codebase style and quality rules to
    every file in the repository. Unless specifically excepted:

    * Files should not contain tabs
    * Files should not start with newlines
    * Files should end with one empty line
    * Lines should not contain trailing whitespace
    * Lines should not exceed 160 characters

    '''
    errors = collect_errors()
    assert len(errors) == 0, "Code quality issues:\n" + "\n".join(errors)

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

# This is based on sympy's sympy/utilities/tests/test_code_quality.py

TOP_PATH = abspath(join(split(__file__)[0], pardir, pardir))

MAX_LINE_LENGTH = 160

message_space     = "File contains trailing whitespace: {path}, line {line_no}."
message_tabs      = "File contains tabs instead of spaces: {path}, line {line_no}."
message_carriage  = "File contains carriage returns at end of line: {path}, line {line_no}"
message_eof       = "File does not end with a newline: {path}, line {line_no}"
message_multi_bof = "File starts with more than 1 empty line: {path}, line {line_no}"
message_multi_eof = "File ends with more than 1 empty line: {path}, line {line_no}"
message_bokeh_ref = "File contains static reference to bokeh.org: {path}, line {line_no}"
message_too_long  = f"File contains a line with over {MAX_LINE_LENGTH} characters: {{path}}, line {{line_no}}"

def tab_in_leading(s: str) -> bool:
    """ Returns True if there are tabs in the leading whitespace of a line,
        including the whitespace of docstring code samples.
    """
    n = len(s) - len(s.lstrip())
    if s[n:n + 3] not in ['...', '>>>']:
        check = s[:n]
    else:
        smore = s[n + 3:]
        check = s[:n] + smore[:len(smore) - len(smore.lstrip())]
    return check.expandtabs() != check

def use_tab_rule(fname: str) -> bool:
    return not (basename(fname) == 'Makefile' or splitext(fname)[1] == '.bat')

exclude_paths = ("docs/CHANGELOG",)

exclude_exts = (
    ".patch", ".png", ".jpg", ".pxm", ".ico", ".ics", ".gz", ".gif", ".enc",
    ".xml", ".shp", ".dbf", ".shx", "otf", ".eot", ".ttf", ".woff", ".woff2",
    ".json", ".yaml",
)

exclude_dirs = ()

def collect_errors() -> list[str]:
    errors: list[tuple[str, str, int]] = []

    def test_this_file(fname: str, test_file: IO[str]) -> None:
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
            if line.strip().startswith('..') and 'https://docs.bokeh.org' in line:
                errors.append((message_bokeh_ref, fname, line_no))
            #if len(line) > MAX_LINE_LENGTH:
            #    errors.append((message_too_long, fname, line_no))

        if line is not None:
            if idx > 0 and len(line.strip()) == 0:
                errors.append((message_multi_eof, fname, line_no))
            if not line.endswith('\n'):
                errors.append((message_eof, fname, line_no))

    paths = subprocess.check_output(["git", "ls-files"]).decode("utf-8").split("\n")

    for path in paths:
        if not path:
            continue

        if path in exclude_paths:
            continue

        if path.endswith(exclude_exts):
            continue

        if path.startswith(exclude_dirs):
            continue

        with open(path, encoding="utf-8", newline="") as file:
            test_this_file(path, file)

    return [ msg.format(path=fname, line_no=line_no) for (msg, fname, line_no) in errors ]
