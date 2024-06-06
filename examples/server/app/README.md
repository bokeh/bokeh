# Bokeh Applications

The examples in this directory all make use of the Bokeh server, to create data visualization web apps from simple
python scripts.

To run any of these examples, execute `bokeh serve --show` and the name of the script or directory that contains the
demo. For example,

    bokeh serve --show sliders.py

will run the "sliders" demo, and open it up in a new browser tab.

The demos container here are:

<table>

  <tr><td colspan="2">clustering</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/clustering"><img src="https://docs.bokeh.org/static/clustering_t.png" width=400></a></td>
    <td>Demonstrates different <a href=http://scikit-learn.org/stable>scikit-learn</a> clustering algorithms on a few different data sets.</td>
  </tr>

  <tr><td colspan="2">contour_animated</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/contour_animated.py"><img src="https://docs.bokeh.org/static/contour_animated_t.png" width=400></a></td>
    <td>Using a Python callback to animate a contour plot.</td>
  </tr>

  <tr><td colspan="2">crossfilter</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/crossfilter"><img src="https://docs.bokeh.org/static/crossfilter_t.png" width=400></a></td>
    <td>Explore the "autompg" data set by selecting and highlighting different dimensions</td>
  </tr>

  <tr><td colspan="2">dash</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/dash"><img src="https://docs.bokeh.org/static/dash_t.png" width=400></a></td>
    <td>Demonstrates use of custom Bootstrap template with a Bokeh application</td>
  </tr>

  <tr><td colspan="2">export_csv</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/export_csv"><img src="https://docs.bokeh.org/static/export_csv_t.png" width=400></a></td>
    <td>Query a data table and save the results to a CSV file</td>
  </tr>

  <tr><td colspan="2">fourier_animated</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/fourier_animated.py"><img src="https://docs.bokeh.org/static/fourier_animated_t.png" width=400></a></td>
    <td>A continuously updating demonstration of Fourier synthesis using periodic callbacks</td>
  </tr>

  <tr><td colspan="2">gapminder</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/gapminder"><img src="https://docs.bokeh.org/static/gapminder_t.png" width=400></a></td>
    <td>A reproduction of the famous Gapminder demo, with embedded video added using a custom page template</td>
  </tr>

  <tr><td colspan="2">movies</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/movies"><img src="https://docs.bokeh.org/static/movies_t.png" width=400></a></td>
    <td>An interactive query tool for a set of IMDB data</td>
  </tr>

  <tr><td colspan="2">ohlc</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/ohlc"><img src="https://docs.bokeh.org/static/ohlc_t.png" width=400></a></td>
    <td>A simulated streaming <a href=https://en.wikipedia.org/wiki/Open-high-low-close_chart>OHLC chart</a> with <a href=https://en.wikipedia.org/wiki/MACD>MACD indicator</a> and selectable moving averages using periodic callbacks and the efficient streaming API</td>
  </tr>

  <tr><td colspan="2">selection_histogram</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/selection_histogram.py"><img src="https://docs.bokeh.org/static/selection_histogram_t.png" width=400></a></td>
    <td>Shows axis histograms for selected <em>and</em> unselected points in a scatter plot</td>
  </tr>

  <tr><td colspan="2">sliders</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/sliders.py"><img src="https://docs.bokeh.org/static/sliders_t.png" width=400></a></td>
    <td>A basic demo that has sliders for controlling a plotted trigonometric function</td>
  </tr>

  <tr><td colspan="2">spectrogram</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/spectrogram"><img src="https://docs.bokeh.org/static/spectrogram_t.png" width=400></a></td>
    <td>A live audio spectrogram that connects NumPy to interactive web visualizations</td>
  </tr>

  <tr><td colspan="2">stocks</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/stocks"><img src="https://docs.bokeh.org/static/stocks_t.png" width=400></a></td>
    <td>Linked plots, summary statistics, and correlations for market data </td>
  </tr>

  <tr><td colspan="2">surface3d</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/surface3d"><img src="https://docs.bokeh.org/static/surface3d_t.png" width=400></a></td>
    <td> An updating 3d plot that demonstrates using Bokeh custom extensions to wrap third-party JavaScript libraries</td>
  </tr>

  <tr><td colspan="2">weather</td></tr>
  <tr>
    <td><a href="https://github.com/bokeh/bokeh/blob/-/examples/server/app/weather"><img src="https://docs.bokeh.org/static/weather_t.png" width=400></img></a></td>
    <td> A basic demo with dropdown menus and weather data for various cities</td>
  </tr>

</table>
