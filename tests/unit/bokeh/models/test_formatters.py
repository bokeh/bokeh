#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import pytest

# Bokeh imports
from bokeh.core.validation.check import check_integrity
from bokeh.document import Document
from bokeh.models import ColumnDataSource, TeX, Toggle

# Module under test
import bokeh.models.formatters as bmf # isort:skip
import bokeh.models.tickers as bmt # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_custom_js_tick_formatter() -> None:
    source = ColumnDataSource({
        'fruits': ['apples', 'bananas', 'pears'],
        'counts': [6, 7, 3],
    })

    toggle = Toggle(label='Uppercase Ticks')

    formatter = bmf.CustomJSTickFormatter(code="""
        let label = source.data['fruits'][index];
        return toggle.active ? label.toUpperCase() : label
    """, args={'source': source, 'toggle': toggle})

    assert 'source' in formatter.args
    assert formatter.args['source'] is source
    assert 'toggle' in formatter.args
    assert formatter.args['toggle'] is toggle

    cutoff = 5

    formatter = bmf.CustomJSTickFormatter(code="""
        this.precision = this.precision || (ticks.length > cutoff ? 1 : 2);
        return Math.floor(tick) + " + " + (tick % 1).toFixed(this.precision);
    """, args={'cutoff': cutoff})

    assert 'cutoff' in formatter.args
    assert formatter.args['cutoff'] == cutoff

    with pytest.raises(AttributeError):
        # does not accept kwargs
        formatter = bmf.CustomJSTickFormatter(code="""
            this.precision = this.precision || (ticks.length > cutoff ? 1 : 2);
            return Math.floor(tick) + " + " + (tick % 1).toFixed(this.precision);
        """, cutoff=cutoff)

def test_scaled_tick_formatter() -> None:
    ticker = bmt.ScaledTicker(scale=3.14)
    formatter = bmf.ScaledTickFormatter(
        ticker=ticker,
        unit="pi",
        unit_style="symbolic",
    )

    assert formatter.ticker is ticker
    assert isinstance(formatter.formatter, bmf.BasicTickFormatter)
    assert formatter.origin_label == ""
    assert formatter.prefix == ""
    assert formatter.unit == "pi"
    assert formatter.unit_style == "symbolic"
    assert formatter.use_fractions is False
    assert formatter.fraction_style == "inline"
    assert formatter.max_denominator == 16

def test_scaled_tick_formatter_serialization() -> None:
    ticker = bmt.ScaledTicker(scale=3.14, origin=2.7, name="ticker")
    formatter = bmf.ScaledTickFormatter(
        ticker=ticker,
        unit="pi",
        unit_style="symbolic",
        use_fractions=True,
        fraction_style="inline",
        max_denominator=8,
        name="formatter",
    )
    doc = Document()
    doc.add_root(formatter)

    copy = Document.from_json(doc.to_json())
    copied_formatter = copy.get_model_by_name("formatter")
    copied_ticker = copy.get_model_by_name("ticker")

    assert isinstance(copied_formatter, bmf.ScaledTickFormatter)
    assert isinstance(copied_ticker, bmt.ScaledTicker)
    assert copied_formatter.ticker is copied_ticker
    assert copied_formatter.unit == "pi"
    assert copied_ticker.origin == 2.7
    assert copied_formatter.unit_style == "symbolic"
    assert copied_formatter.use_fractions is True
    assert copied_formatter.fraction_style == "inline"
    assert copied_formatter.max_denominator == 8

def test_scaled_tick_formatter_accepts_math_text_units() -> None:
    origin_label = TeX(text=r"\overline{x}")
    unit = TeX(text=r"\pi")
    formatter = bmf.ScaledTickFormatter(origin_label=origin_label, unit=unit, name="formatter")

    assert formatter.origin_label is origin_label
    assert formatter.unit is unit

    doc = Document()
    doc.add_root(formatter)
    copy = Document.from_json(doc.to_json())
    copied_formatter = copy.get_model_by_name("formatter")

    assert isinstance(copied_formatter, bmf.ScaledTickFormatter)
    assert isinstance(copied_formatter.origin_label, TeX)
    assert copied_formatter.origin_label.text == r"\overline{x}"
    assert isinstance(copied_formatter.unit, TeX)
    assert copied_formatter.unit.text == r"\pi"

def test_scaled_tick_formatter_serializes_delimited_math_text_strings() -> None:
    formatter = bmf.ScaledTickFormatter(
        origin_label=r"$$\overline{x}$$",
        prefix=r"$$\Delta$$",
        unit=r"$$\pi$$",
        name="formatter",
    )
    doc = Document()
    doc.add_root(formatter)

    copy = Document.from_json(doc.to_json())
    copied_formatter = copy.get_model_by_name("formatter")

    assert isinstance(copied_formatter, bmf.ScaledTickFormatter)
    assert copied_formatter.origin_label == r"$$\overline{x}$$"
    assert copied_formatter.prefix == r"$$\Delta$$"
    assert copied_formatter.unit == r"$$\pi$$"

def test_si_tick_formatter() -> None:
    formatter = bmf.SITickFormatter(unit="Hz", prefix="auto")

    assert isinstance(formatter.formatter, bmf.BasicTickFormatter)
    assert formatter.input_scale == 1
    assert formatter.unit == "Hz"
    assert formatter.prefix == "auto"
    assert formatter.unit_style == "always"

def test_si_tick_formatter_serialization() -> None:
    unit = TeX(text=r"\mathrm{Hz}")
    formatter = bmf.SITickFormatter(unit=unit, prefix="M", unit_style="except_zero", name="formatter")
    doc = Document()
    doc.add_root(formatter)

    copy = Document.from_json(doc.to_json())
    copied_formatter = copy.get_model_by_name("formatter")

    assert isinstance(copied_formatter, bmf.SITickFormatter)
    assert isinstance(copied_formatter.unit, TeX)
    assert copied_formatter.unit.text == r"\mathrm{Hz}"
    assert copied_formatter.prefix == "M"
    assert copied_formatter.unit_style == "except_zero"

def test_si_tick_formatter_serializes_disabled_prefix() -> None:
    formatter = bmf.SITickFormatter(unit="Hz", prefix=None, name="formatter")
    doc = Document()
    doc.add_root(formatter)

    copy = Document.from_json(doc.to_json())
    copied_formatter = copy.get_model_by_name("formatter")

    assert isinstance(copied_formatter, bmf.SITickFormatter)
    assert copied_formatter.prefix is None

@pytest.mark.parametrize("input_scale", [1e6, 1e-3])
@pytest.mark.parametrize("prefix", ["auto", "k", None])
def test_si_tick_formatter_serializes_input_scale(input_scale: float, prefix: str | None) -> None:
    formatter = bmf.SITickFormatter(unit="Hz", input_scale=input_scale, prefix=prefix, name="formatter")
    doc = Document()
    doc.add_root(formatter)

    copy = Document.from_json(doc.to_json())
    copied_formatter = copy.get_model_by_name("formatter")

    assert isinstance(copied_formatter, bmf.SITickFormatter)
    assert copied_formatter.input_scale == input_scale
    assert copied_formatter.unit == "Hz"
    assert copied_formatter.prefix == prefix

@pytest.mark.parametrize("input_scale", [0, -1, float("nan")])
def test_si_tick_formatter_requires_positive_input_scale(input_scale: float) -> None:
    with pytest.raises(ValueError):
        bmf.SITickFormatter(input_scale=input_scale)

@pytest.mark.parametrize("prefix", ["h", "da", "u", "μ"])
def test_si_tick_formatter_rejects_non_engineering_prefixes(prefix: str) -> None:
    with pytest.raises(ValueError):
        bmf.SITickFormatter(prefix=prefix)

def test_si_and_scaled_tick_formatters_cannot_be_nested() -> None:
    si_outer = bmf.SITickFormatter(formatter=bmf.ScaledTickFormatter())
    scaled_outer = bmf.ScaledTickFormatter(formatter=bmf.SITickFormatter())

    si_issues = check_integrity([si_outer]).error
    scaled_issues = check_integrity([scaled_outer]).error
    assert len(si_issues) == 1
    assert si_issues[0].code == 1032
    assert si_issues[0].name == "INCOMPATIBLE_NESTED_TICK_FORMATTERS"
    assert len(scaled_issues) == 1
    assert scaled_issues[0].code == 1032
    assert scaled_issues[0].name == "INCOMPATIBLE_NESTED_TICK_FORMATTERS"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
