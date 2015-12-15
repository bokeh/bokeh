""" Daylight hours from http://www.sunrisesunset.com

"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'daylight sample data requires Pandas (http://pandas.pydata.org) to be installed')

import re
import datetime
import requests

from six.moves import xrange
from os.path import join, abspath, dirname

url = "http://sunrisesunset.com/calendar.asp"

r0 = re.compile("<[^>]+>|&nbsp;|[\r\n\t]")
r1 = re.compile(r"(\d+)(DST Begins|DST Ends)?Sunrise: (\d+):(\d\d)Sunset: (\d+):(\d\d)")

def fetch_daylight_hours(lat, lon, tz, dst, year):
    """Fetch daylight hours from sunrisesunset.com for a given location.

       Parameters
       ----------
       lat  : float
           Location's latitude.
       lon  : float
           Location's longitude.
       tz   : int or float
           Time zone offset from UTC. Use floats for half-hour time zones.
       dst  : int
           Daylight saving type, e.g. 0 -> none, 1 -> North America, 2 -> Europe.
           See sunrisesunset.com/custom.asp for other possible values.
       year : int
           Year (1901..2099).
    """
    daylight = []
    summer = 0 if lat >= 0 else 1

    for month in xrange(1, 12+1):
        args = dict(url=url, lat=lat, lon=lon, tz=tz, dst=dst, year=year, month=month)
        response = requests.get("%(url)s?comb_city_info=_;%(lon)s;%(lat)s;%(tz)s;%(dst)s&month=%(month)s&year=%(year)s&time_type=1&wadj=1" % args)
        entries = r1.findall(r0.sub("", response.text))

        for day, note, sunrise_hour, sunrise_minute, sunset_hour, sunset_minute in entries:
            if note == "DST Begins":
                summer = 1
            elif note == "DST Ends":
                summer = 0

            date = datetime.date(year, month, int(day))
            sunrise = datetime.time(int(sunrise_hour), int(sunrise_minute))
            sunset = datetime.time(int(sunset_hour), int(sunset_minute))

            daylight.append([date, sunrise, sunset, summer])

    return pd.DataFrame(daylight, columns=["Date", "Sunrise", "Sunset", "Summer"])

# daylight_warsaw_2013 = fetch_daylight_hours(52.2297, -21.0122, 1, 2, 2013)
# daylight_warsaw_2013.to_csv("bokeh/sampledata/daylight_warsaw_2013.csv", index=False)

def load_daylight_hours(file):
    path = join(dirname(abspath(__file__)), file)
    df = pd.read_csv(path, parse_dates=["Date", "Sunrise", "Sunset"])

    df["Date"] = df.Date.map(lambda x: x.date())
    df["Sunrise"] = df.Sunrise.map(lambda x: x.time())
    df["Sunset"] = df.Sunset.map(lambda x: x.time())

    return df

daylight_warsaw_2013 = load_daylight_hours("daylight_warsaw_2013.csv")
