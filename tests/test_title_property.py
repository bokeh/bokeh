from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import Title


def test_figure_title_should_accept_title_or_string():

    # check if it works with title object
    title = Title(text='Great Title')
    plot = figure(title=title)
    l1 = plot.line([1, 2, 3], [1, 2, 3])
    assert plot.title.text == 'Great Title'

    # check if it works with string
    plot = figure(title='Great Title 2')
    l1 = plot.line([1, 2, 3], [1, 2, 3])
    assert plot.title.text == 'Great Title 2'
