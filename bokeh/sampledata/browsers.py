from os.path import join, dirname

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("browsers data requires pandas (http://pandas.pydata.org) to be installed")

_data_dir = dirname(__file__)

# http://gs.statcounter.com/#browser_version-ww-monthly-201311-201311-bar
_csv_path = join(_data_dir, "browsers_nov_2013.csv")

browsers_nov_2013 = pd.read_csv(_csv_path, names=["Version", "Share"], skiprows=1)
browsers_nov_2013["Browser"] = browsers_nov_2013.Version.map(lambda x: x.rsplit(" ", 1)[0])

# https://github.com/alrra/browser-logos
_browsers = ["Chrome", "Firefox", "Safari", "Opera", "IE"]
icons = {}

for browser in _browsers:
    icon_path = join(_data_dir, "icons", browser.lower() + "_32x32.png")

    with open(icon_path, "r") as icon:
        icons[browser] = icon.read()
