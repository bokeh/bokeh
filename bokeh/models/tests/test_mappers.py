from __future__ import absolute_import

from bokeh.models.mappers import (
    LinearColorMapper, LogColorMapper, CategoricalColorMapper
)

from .utils.property_utils import (
    check_properties_existence,
)


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
        "nan_color"],
    )


def test_warning_if_categorical_color_mapper_with_short_palette(recwarn):
    CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green"])
    assert len(recwarn) == 1


def test_no_warning_if_categorical_color_mapper_with_long_palette(recwarn):
    CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green", "orange", "blue"])
    assert len(recwarn) == 0
