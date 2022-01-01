#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Four of the datasets from Gapminder.

Sourced from https://www.gapminder.org/data/

Licensed under `CC-BY`_.

This module contains four pandas Dataframes: ``fertility``, ``life_expectancy``,
``population``, and ``regions``.

.. rubric:: ``fertility``

:bokeh-dataframe:`bokeh.sampledata.gapminder.fertility`

.. rubric:: ``life_expectancy``

:bokeh-dataframe:`bokeh.sampledata.gapminder.life_expectancy`

.. rubric:: ``population``

:bokeh-dataframe:`bokeh.sampledata.gapminder.population`

.. rubric:: ``regions``

:bokeh-dataframe:`bokeh.sampledata.gapminder.regions`

.. _CC-BY: https://creativecommons.org/licenses/by/2.0/

'''


#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..util.sampledata import external_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'fertility',
    'life_expectancy',
    'population',
    'regions',
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

fertility       = external_csv('gapminder', 'gapminder_fertility.csv', index_col='Country', encoding='utf-8')
life_expectancy = external_csv('gapminder', 'gapminder_life_expectancy.csv', index_col='Country', encoding='utf-8')
population      = external_csv('gapminder', 'gapminder_population.csv', index_col='Country', encoding='utf-8')
regions         = external_csv('gapminder', 'gapminder_regions.csv', index_col='Country', encoding='utf-8')



#-----------------------------------------------------------------------------

# Original data is from Gapminder - www.gapminder.org.
# The google docs links are maintained by gapminder

# The following script was used to get the data from gapminder
# and process it into the csvs stored in bokeh's sampledata.

'''
population_url = "http://spreadsheets.google.com/pub?key=phAwcNAVuyj0XOoBL_n5tAQ&output=xls"
fertility_url = "http://spreadsheets.google.com/pub?key=phAwcNAVuyj0TAlJeCEzcGQ&output=xls"
life_expectancy_url = "http://spreadsheets.google.com/pub?key=tiAiXcrneZrUnnJ9dBU-PAw&output=xls"
regions_url = "https://docs.google.com/spreadsheets/d/1OxmGUNWeADbPJkQxVPupSOK5MbAECdqThnvyPrwG5Os/pub?gid=1&output=xls"

def _get_data(url):
    # Get the data from the url and return only 1962 - 2013
    df = pd.read_excel(url, index_col=0)
    df = df.unstack().unstack()
    df = df[(df.index >= 1964) & (df.index <= 2013)]
    df = df.unstack().unstack()
    return df

fertility_df = _get_data(fertility_url)
life_expectancy_df = _get_data(life_expectancy_url)
population_df = _get_data(population_url)
regions_df = pd.read_excel(regions_url, index_col=0)

# have common countries across all data
fertility_df = fertility_df.drop(fertility_df.index.difference(life_expectancy_df.index))
population_df = population_df.drop(population_df.index.difference(life_expectancy_df.index))
regions_df = regions_df.drop(regions_df.index.difference(life_expectancy_df.index))

fertility_df.to_csv('gapminder_fertility.csv')
population_df.to_csv('gapminder_population.csv')
life_expectancy_df.to_csv('gapminder_life_expectancy.csv')
regions_df.to_csv('gapminder_regions.csv')
'''

#-----------------------------------------------------------------------------
