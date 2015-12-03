from bokeh.charts.glyphs import AreaGlyph
import pandas as pd


def test_area_base_values(test_data):
    """Test creating chart data source from array-like list data."""
    x = pd.Series(test_data.array_data[0])
    y = pd.Series(test_data.array_data[1])

    ag = AreaGlyph(x=x, y=y)

    assert ag.source.data['y_values'][0] == 0
    assert ag.source.data['y_values'][-1] == 0