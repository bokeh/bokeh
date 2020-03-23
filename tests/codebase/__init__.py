#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import abspath, join, pardir, split
from subprocess import run
from typing import List

TOP_PATH = abspath(join(split(__file__)[0], pardir, pardir))

def ls_files(*patterns: str) -> List[str]:
    proc = run(["git", "ls-files", "--", *patterns], capture_output=True)
    return proc.stdout.decode("utf-8").split("\n")
