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

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
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

def test_unit_tick_formatter() -> None:
    ticker = bmt.UnitTicker(scale=3.14)
    formatter = bmf.UnitTickFormatter(
        ticker=ticker,
        suffix="pi",
        unit_style="symbolic",
    )

    assert formatter.ticker is ticker
    assert isinstance(formatter.formatter, bmf.BasicTickFormatter)
    assert formatter.base_label == ""
    assert formatter.prefix == ""
    assert formatter.suffix == "pi"
    assert formatter.unit_style == "symbolic"
    assert formatter.use_fractions is False
    assert formatter.fraction_style == "inline"
    assert formatter.max_denominator == 16

def test_unit_tick_formatter_serialization() -> None:
    ticker = bmt.UnitTicker(scale=3.14, offset=2.7, name="ticker")
    formatter = bmf.UnitTickFormatter(
        ticker=ticker,
        suffix="pi",
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

    assert isinstance(copied_formatter, bmf.UnitTickFormatter)
    assert isinstance(copied_ticker, bmt.UnitTicker)
    assert copied_formatter.ticker is copied_ticker
    assert copied_ticker.offset == 2.7
    assert copied_formatter.unit_style == "symbolic"
    assert copied_formatter.use_fractions is True
    assert copied_formatter.fraction_style == "inline"
    assert copied_formatter.max_denominator == 8

def test_unit_tick_formatter_accepts_math_text_units() -> None:
    base_label = TeX(text=r"\overline{x}")
    suffix = TeX(text=r"\pi")
    formatter = bmf.UnitTickFormatter(base_label=base_label, suffix=suffix, name="formatter")

    assert formatter.base_label is base_label
    assert formatter.suffix is suffix

    doc = Document()
    doc.add_root(formatter)
    copy = Document.from_json(doc.to_json())
    copied_formatter = copy.get_model_by_name("formatter")

    assert isinstance(copied_formatter, bmf.UnitTickFormatter)
    assert isinstance(copied_formatter.base_label, TeX)
    assert copied_formatter.base_label.text == r"\overline{x}"
    assert isinstance(copied_formatter.suffix, TeX)
    assert copied_formatter.suffix.text == r"\pi"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
