from __future__ import absolute_import

from bokeh.models.mappers import (
    LinearColorMapper, LogColorMapper, CategoricalColorMapper
)

from .utils.property_utils import (
    check_properties_existence,
)


def test_LinearColorMapper():
    mapper = LinearColorMapper()
    yield (check_properties_existence, mapper, [
        "palette",
        "low",
        "high",
        "nan_color"],
    )


def test_LogColorMapper():
    mapper = LogColorMapper()
    yield (check_properties_existence, mapper, [
        "palette",
        "low",
        "high",
        "nan_color"],
    )


def test_CategoricalColorMapper():
    mapper = CategoricalColorMapper()
    check_properties_existence(mapper, [
        "factors",
        "palette",
        "nan_color"],
    )


def test_warning_if_categorical_color_mapper_with_different_length_palette_factors(recwarn):
    CategoricalColorMapper(factors=["a", "b", "c"], palette=["red", "green"])
    assert len(recwarn) == 1
