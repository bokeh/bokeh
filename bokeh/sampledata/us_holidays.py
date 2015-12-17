'''

'''
from __future__ import absolute_import

from os.path import dirname, join

try:
    from icalendar import Calendar as ICalendar
except ImportError as e:
    raise RuntimeError("us_holidays data requires icalendar (http://icalendar.readthedocs.org) to be installed")

def read_ical(name):
    with open(join(dirname(__file__), name)) as ics:
        ical = ICalendar.from_ical(ics.read())

    return sorted([ (comp.get("dtstart").dt, str(comp.get("summary"))) for comp in ical.walk() if comp.name == "VEVENT" ])

us_holidays = read_ical("USHolidays.ics") # https://www.mozilla.org/en-US/projects/calendar/holidays/
