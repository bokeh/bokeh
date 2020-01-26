#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

https://www.mozilla.org/en-US/projects/calendar/holidays/

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
from ..util.dependencies import import_required
from ..util.sampledata import package_path

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'us_holidays',
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

def _read_data():
    '''

    '''
    ic = import_required('icalendar', "us_holidays data requires icalendar (http://icalendar.readthedocs.org) to be installed")

    with open(package_path("USHolidays.ics")) as f:
        data = ic.Calendar.from_ical(f.read())

    return sorted((comp.get("dtstart").dt, str(comp.get("summary"))) for comp in data.walk() if comp.name == "VEVENT")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

us_holidays = _read_data()
