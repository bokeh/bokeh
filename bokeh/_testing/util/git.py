#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide tools for interacting with git.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import subprocess
import sys

# External imports

# Bokeh imports
from bokeh.util.terminal import write

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'version_from_git',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def version_from_git(ref):
    ''' Get the git-version of a specific ref, e.g. HEAD, origin/master.

    '''
    cmd = ["git", "describe", "--tags", "--always", ref]

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        code = proc.wait()
    except OSError:
        write("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    if code != 0:
        write("Failed to get version for %s" % ref)
        sys.exit(1)

    version = proc.stdout.read().decode('utf-8').strip()

    try:
        # git-version = tag-num-gSHA1
        tag, _, sha1 = version.split("-")
    except ValueError:
        return version
    else:
        return "%s-%s" % (tag, sha1[1:])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

__version__ = version_from_git('HEAD')
