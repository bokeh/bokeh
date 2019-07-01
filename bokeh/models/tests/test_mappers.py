#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.models.tests.utils.property_utils import check_properties_existence
from bokeh.palettes import Spectral6

# Module under test
import bokeh.models.mappers as bmm

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_CategoricalColorMapper(object):

    def test_basic(self):
        mapper = bmm.CategoricalColorMapper()
        check_properties_existence(mapper, [
            "factors",
            "palette",
            "start",
            "end",
            "nan_color"],
        )

    def test_warning_with_short_palette(self, recwarn):
        bmm.CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green"])
        assert len(recwarn) == 1

    def test_no_warning_with_long_palette(self, recwarn):
        bmm.CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green", "orange", "blue"])
        assert len(recwarn) == 0

    def test_with_pandas_index(self, pd):
        fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
        years = ['2015', '2016', '2017']
        data = {'2015'   : [2, 1, 4, 3, 2, 4],
                '2016'   : [5, 3, 3, 2, 4, 6],
                '2017'   : [3, 2, 4, 4, 5, 3]}

        df = pd.DataFrame(data, index=fruits)
        fruits = df.index
        years = df.columns
        m = bmm.CategoricalColorMapper(palette=Spectral6, factors=years, start=1, end=2)
        assert list(m.factors) == list(years)
        assert isinstance(m.factors, pd.Index)

class Test_CategoricalPatternMapper(object):

    def test_basic(self):
        mapper = bmm.CategoricalPatternMapper()
        check_properties_existence(mapper, [
            "factors",
            "patterns",
            "start",
            "end",
            "default_value"],
        )

class Test_CategoricalMarkerMapper(object):

    def test_basic(self):
        mapper = bmm.CategoricalMarkerMapper()
        check_properties_existence(mapper, [
            "factors",
            "markers",
            "start",
            "end",
            "default_value"],
        )

class Test_LinearColorMapper(object):

    def test_basic(self):
        mapper = bmm.LinearColorMapper()
        check_properties_existence(mapper, [
            "palette",
            "low",
            "high",
            "low_color",
            "high_color",
            "nan_color"],
        )

class Test_LogColorMapper(object):

    def test_basic(self):
        mapper = bmm.LogColorMapper()
        check_properties_existence(mapper, [
            "palette",
            "low",
            "high",
            "low_color",
            "high_color",
            "nan_color"],
        )

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
