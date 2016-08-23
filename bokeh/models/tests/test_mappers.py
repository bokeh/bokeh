from __future__ import  absolute_import

from bokeh.models.mappers import (
    LinearColorMapper, LogColorMapper
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
