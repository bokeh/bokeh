from __future__ import absolute_import

from bokeh.models.mappers import LinearColorMapper, LogColorMapper, CategoricalColorMapper

from .utils.property_utils import check_properties_existence


def test_LinearColorMapper():
    mapper = LinearColorMapper()
    check_properties_existence(mapper, [
        "palette",
        "low",
        "high",
        "low_color",
        "high_color",
        "nan_color"],
    )


def test_LogColorMapper():
    mapper = LogColorMapper()
    check_properties_existence(mapper, [
        "palette",
        "low",
        "high",
        "low_color",
        "high_color",
        "nan_color"],
    )


def test_CategoricalColorMapper():
    mapper = CategoricalColorMapper()
    check_properties_existence(mapper, [
        "factors",
        "palette",
        "start",
        "end",
        "nan_color"],
    )


def test_warning_if_categorical_color_mapper_with_short_palette(recwarn):
    CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green"])
    assert len(recwarn) == 1


def test_no_warning_if_categorical_color_mapper_with_long_palette(recwarn):
    CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green", "orange", "blue"])
    assert len(recwarn) == 0

def test_categorical_color_mapper_with_pandas_index():
    import pandas as pd
    from bokeh.palettes import Spectral6
    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
    years = ['2015', '2016', '2017']
    data = {'2015'   : [2, 1, 4, 3, 2, 4],
            '2016'   : [5, 3, 3, 2, 4, 6],
            '2017'   : [3, 2, 4, 4, 5, 3]}

    df = pd.DataFrame(data, index=fruits)
    fruits = df.index
    years = df.columns
    m = CategoricalColorMapper(palette=Spectral6, factors=years, start=1, end=2)
    assert list(m.factors) == list(years)
    assert isinstance(m.factors, pd.Index)
