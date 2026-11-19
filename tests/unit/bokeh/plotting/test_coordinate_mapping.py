from __future__ import annotations

import pytest

from bokeh.core.validation import check_integrity
from bokeh.document import Document
from bokeh.models import (
    CartesianMapping,
    CategoricalAxis,
    CoordinateMapping,
    FactorRange,
    GlyphRenderer,
    LinearAxis,
    LogAxis,
    LogScale,
    Plot,
    PolarAxis,
    PolarMapping,
    Range1d,
    Rect,
    SubplotMapping,
)
from bokeh.plotting import figure


@pytest.mark.parametrize("mapping, axis_type", [
    (CartesianMapping(), LinearAxis),
    (CartesianMapping(x_range=FactorRange(factors=["a", "b"])), CategoricalAxis),
    (CartesianMapping(x_range=Range1d(1, 100), x_scale=LogScale()), LogAxis),
])
def test_explicit_cartesian_mapping(mapping, axis_type) -> None:
    plot = figure(coordinate_system=mapping)
    assert isinstance(mapping, CoordinateMapping)
    assert plot.x_range is mapping.x_range
    assert plot.y_range is mapping.y_range
    assert plot.x_scale is mapping.x_scale
    assert plot.y_scale is mapping.y_scale
    assert isinstance(plot.xaxis[0], axis_type)
    assert not plot.select(PolarAxis)
    plot.segment([1], [2], [3], [4])
    assert not plot._check_polar_renderers()
    document = Document()
    document.add_root(plot)
    restored = Document.from_json(document.to_json()).roots[0]
    assert isinstance(restored.coordinate_system, CartesianMapping)
    assert restored.x_range is restored.coordinate_system.x_range
    assert restored.x_scale is restored.coordinate_system.x_scale


def test_legacy_subplot_options_and_defaults() -> None:
    plot = figure()
    scale = LogScale()
    subplot = plot.subplot(x_source=Range1d(1, 100), x_scale=scale, x_target=Range1d(0, 1), y_target=Range1d(0, 1))
    assert subplot.coordinates.x_scale is scale
    assert subplot.coordinates.y_source is not None
    renderer = subplot.scatter([2], [3])
    assert isinstance(renderer.coordinates, SubplotMapping)
    document = Document()
    document.add_root(plot)
    restored = Document.from_json(document.to_json()).roots[0]
    assert isinstance(restored.renderers[-1].coordinates, SubplotMapping)


def test_mapping_errors_use_normal_validation() -> None:
    system = PolarMapping(radial_range=Range1d(-1, 10))
    assert any("nonnegative" in issue.extra for issue in check_integrity(system.references()).error)
    cartesian = CartesianMapping()
    raw = Plot(coordinate_system=cartesian, x_range=Range1d(0, 1))
    assert "owns the plot ranges" in raw._check_polar_coordinate_system()[0].extra


def test_subplot_requires_cartesian_parent() -> None:
    with pytest.raises(ValueError, match="Cartesian parent"):
        figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10))).subplot(x_target=Range1d(0, 1), y_target=Range1d(0, 1))


@pytest.mark.parametrize("coordinates", [CartesianMapping(), SubplotMapping(x_target=Range1d(0, 1), y_target=Range1d(0, 1))])
def test_raw_mapping_requires_cartesian_parent(coordinates: CoordinateMapping) -> None:
    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    plot.renderers.append(GlyphRenderer(glyph=Rect(), coordinates=coordinates))
    assert "require a Cartesian parent" in plot._check_polar_renderers()[0].extra
    with pytest.raises(ValueError, match="require a Cartesian parent"):
        plot.add_glyph(Rect(), coordinates=coordinates)


def test_raw_guide_mapping_requires_cartesian_parent() -> None:
    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    coordinates = SubplotMapping(x_target=Range1d(0, 1), y_target=Range1d(0, 1))
    plot.add_layout(PolarAxis(coordinates=coordinates))
    assert "require a Cartesian parent" in plot._check_polar_renderers()[0].extra


def test_raw_native_polar_mapping_requires_matching_parent() -> None:
    from bokeh.models import Scatter

    plot = figure()
    mapping = PolarMapping(radial_range=Range1d(0, 10))
    with pytest.raises(ValueError, match="matching polar parent"):
        plot.scatter([2], [90], coordinates=mapping)
    plot.renderers.append(GlyphRenderer(glyph=Scatter(), coordinates=mapping))
    assert "matching polar parent" in plot._check_polar_renderers()[0].extra


@pytest.mark.parametrize("factory", [Plot, figure])
def test_root_mapping_rejects_subplot_mapping(factory) -> None:
    mapping = SubplotMapping(x_target=Range1d(0, 1), y_target=Range1d(0, 1))
    with pytest.raises(ValueError, match="coordinate_system"):
        factory(coordinate_system=mapping)
    plot = factory()
    with pytest.raises(ValueError, match="coordinate_system"):
        plot.coordinate_system = mapping
