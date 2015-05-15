'''
This module provides a table of data regarding bachelors degrees earned by
women, broken down by field for any given year. It exposes a an attribute
'xyvalues' which is a pandas dataframe with the following fields:

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
from __future__ import absolute_import

from os.path import dirname, join

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("degrees data requires pandas (http://pandas.pydata.org) to be installed")

xyvalues = pd.read_csv(join(dirname(__file__), "percent-bachelors-degrees-women-usa.csv"))
