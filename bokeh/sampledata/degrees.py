#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a table of data regarding bachelors degrees earned by women,
broken down by field for any given year. It exposes an attribute ``data`` which
is a pandas DataFrame with the following fields:

    Year
    Agriculture
    Architecture
    Art and Performance
    Biology
    Business
    Communications and Journalism
    Computer Science,Education
    Engineering
    English
    Foreign Languages
    Health Professions
    Math and Statistics
    Physical Sciences
    Psychology
    Public Administration
    Social Sciences and History

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

# External imports

# Bokeh imports
from ..util.sampledata import package_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'data',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = package_csv('degrees', 'percent-bachelors-degrees-women-usa.csv')
