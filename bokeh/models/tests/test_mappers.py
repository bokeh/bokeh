from __future__ import absolute_import

from bokeh.models.tests.utils.property_utils import check_properties_existence
from bokeh.palettes import Spectral6

import bokeh.models.mappers as bmm

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
