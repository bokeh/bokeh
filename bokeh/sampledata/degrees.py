'''
This module provides a table of data regarding bachelors degrees earned by
women, broken down by field for any given year. It exposes an attribute
'data' which is a pandas dataframe with the following fields:

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

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'degrees sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

data = pd.read_csv(join(dirname(__file__), "percent-bachelors-degrees-women-usa.csv"))
