#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

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
