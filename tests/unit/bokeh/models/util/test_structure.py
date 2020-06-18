import pytest ; pytest

# Bokeh imports
from bokeh.model import collect_models
from bokeh.models.util import generate_structure_plot
from bokeh.plotting import figure


def test_structure(pd):
    f = figure(width=400,height=400)
    f.line(x=[1,2,3],y=[1,2,3])
    K = generate_structure_plot(f)
    assert 43 == len(collect_models(K))
