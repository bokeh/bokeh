"""
This file demonstrates a bokeh applet, which can be viewed directly
on a bokeh-server. See the README.md file in this directory for
instructions on running.
"""
from __future__ import print_function

from bokeh.appmaker import bokeh_app
from os.path import join
from stocks_utils import get_data, make_hist_plot, update_selection, new_hist, here


def happy_title(title):
    return "HAPPY " + title


app = bokeh_app(join(here, 'stocks.yaml'), route='/stocks/',
                handler=update_selection, theme=join(here, 'dark.yaml'),
                env={
                    'stocks_returns': stocks_utils.stocks_return,
                }
)

selected_df = get_data(**app._values)
app.sources['main_source'].data = selected_df.to_dict(orient='list')
app.add_objects({
    'hist1': make_hist_plot(new_hist('%s Histogram' % app._values['ticker1']), selected_df, 'x'),
    'hist2': make_hist_plot(new_hist('%s Histogram' % app._values['ticker2']), selected_df, 'y')
})

@app.env
def your_foo():
    print