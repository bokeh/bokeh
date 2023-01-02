#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc. All rights reserved.
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
from subprocess import check_output
from typing import IO

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_no_request_host() -> None:
    ''' It is not safe for the Bokeh codebase to use request.host in any way.
    This test ensures "request.host" does not appear in any file.

    '''
    errors = collect_errors()
    assert len(errors) == 0, "request.host usage issues:\n" + "\n".join(errors)

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

message = "File contains refers to 'request.host': {path}, line {line_no}."

def collect_errors() -> list[str]:
    errors: list[tuple[str, str, int]] = []

    def test_this_file(fname: str, test_file: IO[str]) -> None:
        for line_no, line in enumerate(test_file, 1):
            if "request.host" in line.split("#")[0]:
                errors.append((message, fname, line_no))

    paths = check_output(["git", "ls-files"]).decode('utf-8').split("\n")

    for path in paths:
        if not path:
            continue

        if not path.endswith(".py"):
            continue

        if not path.startswith("bokeh/server"):
            continue

        with open(path, encoding="utf-8") as file:
            test_this_file(path, file)

    return [ msg.format(path=fname, line_no=line_no) for (msg, fname, line_no) in errors ]
