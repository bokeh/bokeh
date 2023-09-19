#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from unittest.mock import MagicMock, patch

# External imports
import pandas as pd

# Bokeh imports
from bokeh.core.validation import check_integrity, process_validation_issues
from bokeh.palettes import Spectral6

from _util_models import check_properties_existence

# Module under test
import bokeh.models.mappers as bmm # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------


#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_CategoricalColorMapper:
    def test_basic(self) -> None:
        mapper = bmm.CategoricalColorMapper()
        check_properties_existence(mapper, [
            "factors",
            "palette",
            "start",
            "end",
            "nan_color",
        ])

    @patch("bokeh.core.validation.check.log.error")
    @patch("bokeh.core.validation.check.log.warning")
    def test_warning_with_short_palette(self, mock_warn: MagicMock, mock_error: MagicMock) -> None:
        m = bmm.CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green"])
        issues = check_integrity([m])
        process_validation_issues(issues)
        assert not mock_error.called
        assert mock_warn.called

    @patch("bokeh.core.validation.check.log.error")
    @patch("bokeh.core.validation.check.log.warning")
    def test_no_warning_with_long_palette(self, mock_warn: MagicMock, mock_error: MagicMock) -> None:
        m = bmm.CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green", "orange", "blue"])
        issues = check_integrity([m])
        process_validation_issues(issues)
        assert not mock_error.called
        assert not mock_warn.called

    def test_with_pandas_index(self) -> None:
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


class Test_CategoricalPatternMapper:
    def test_basic(self) -> None:
        mapper = bmm.CategoricalPatternMapper()
        check_properties_existence(mapper, [
            "factors",
            "patterns",
            "start",
            "end",
            "default_value"],
        )


class Test_CategoricalMarkerMapper:
    def test_basic(self) -> None:
        mapper = bmm.CategoricalMarkerMapper()
        check_properties_existence(mapper, [
            "factors",
            "markers",
            "start",
            "end",
            "default_value"],
        )


class Test_LinearColorMapper:
    def test_basic(self) -> None:
        mapper = bmm.LinearColorMapper()
        check_properties_existence(mapper, [
            "palette",
            "domain",
            "low",
            "high",
            "low_color",
            "high_color",
            "nan_color"],
        )


class Test_LogColorMapper:
    def test_basic(self) -> None:
        mapper = bmm.LogColorMapper()
        check_properties_existence(mapper, [
            "palette",
            "domain",
            "low",
            "high",
            "low_color",
            "high_color",
            "nan_color"],
        )


class Test_WeightedStackColorMapper:
    def test_basic(self) -> None:
        mapper = bmm.WeightedStackColorMapper()
        check_properties_existence(mapper, [
            "palette",
            "nan_color",
            "alpha_mapper",
            "color_baseline",
            "stack_labels"],
        )

    @patch("bokeh.core.validation.check.log.error")
    @patch("bokeh.core.validation.check.log.warning")
    def test_too_many_labels(self, mock_warn: MagicMock, mock_error: MagicMock) -> None:
        mapper = bmm.WeightedStackColorMapper(palette=["red", "green"], stack_labels=["one", "two", "three"])
        issues = check_integrity([mapper])
        process_validation_issues(issues)
        assert mock_error.called
        assert not mock_warn.called
        assert mapper.stack_labels == ["one", "two"]

    @patch("bokeh.core.validation.check.log.error")
    @patch("bokeh.core.validation.check.log.warning")
    def test_too_few_labels(self, mock_warn: MagicMock, mock_error: MagicMock) -> None:
        mapper = bmm.WeightedStackColorMapper(palette=["red", "green"], stack_labels=["one"])
        issues = check_integrity([mapper])
        process_validation_issues(issues)
        assert mock_error.called
        assert not mock_warn.called
        assert mapper.stack_labels == ["one", ""]


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
