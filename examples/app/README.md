# Bokeh Applications

The examples in this directory all make use of the Bokeh server, to create data visualization web apps from simple
python scripts.

To run any of these examples, excute `bokeh serve --show` and the name of the script or dirctory that contains the
demo. For example,

    bokeh serve --show sliders.py

will run the "sliders" demo, and open it up in a new browser tab.

The demos container here are:

<table>

  <tr><td colspan="2">clustering</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/clustering_t.png" width=400></img></td>
    <td>Demonstrates different <a href=http://scikit-learn.org/stable>scikit-learn</a> clustering alorithms on a few different data sets.</td>
  </tr>

  <tr><td colspan="2">crossfilter</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/crossfilter_t.png" width=400></img></td>
    <td>Explore the "autompg" data set by selecting and highlighting different dimensions</td>
  </tr>

  <tr><td colspan="2">export_csv</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/export_csv_t.png" width=400></img></td>
    <td>Query a data table and save the results to a CSV file</td>
  </tr>

  <tr><td colspan="2">fourier_animated</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/fourier_animated_t.png" width=400></img></td>
    <td>A continuously updating demonstration of Fourier synthesis using periodic callbacks</td>
  </tr>

  <tr><td colspan="2">gapminder</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/gapminder_t.png" width=400></img></td>
    <td>A reproduction of the famous Gapminder demo, with embedded video added using a custom page template</td>
  </tr>

  <tr><td colspan="2">movies</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/movies_t.png" width=400></img></td>
    <td>An interactive query tool for a set of IMDB data</td>
  </tr>

  <tr><td colspan="2">ohlc</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/ohlc_t.png" width=400></img></td>
    <td>A simulated streaming <a href=https://en.wikipedia.org/wiki/Open-high-low-close_chart>OHLC chart</a> with <a href=https://en.wikipedia.org/wiki/MACD>MACD indicator</a> and selectable moving averages using periodic callbacks nad the efficient streaming API</td>
  </tr>

  <tr><td colspan="2">pivot</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/pivot.png" width=400></img></td>
    <td>A tool for creating pivot charts from CSVs.</td>
  </tr>

  <tr><td colspan="2">selection_histogram</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/selection_histogram_t.png" width=400></img></td>
    <td>Shows axis histograms for selected <em>and</em> nonselected points in a scatter plot</td>
  </tr>

  <tr><td colspan="2">sliders</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/sliders_t.png" width=400></img></td>
    <td>A basic demo that has sliders for controlling a plotted trigonometric function</td>
  </tr>

  <tr><td colspan="2">spectrogram</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/spectrogram_t.png" width=400></img></td>
    <td>A live audio spectrogram that connects NumPy to interactive web visualizations</td>
  </tr>

  <tr><td colspan="2">stocks</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/stocks_t.png" width=400></img></td>
    <td>Linked plots, summary statistics, and correlations for market data </td>
  </tr>

  <tr><td colspan="2">surface3d</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/surface3d_t.png" width=400></img></td>
    <td> An updating 3d plot that demonstrates using using Bokeh custom extensions to wrap third-party JavaScript libraries</td>
  </tr>

  <tr><td colspan="2">weather</td></tr>
  <tr>
    <td><img src="https://bokeh.pydata.org/static/weather_t.png" width=400></img></td>
    <td> A basic demo with dropdown menus and weather data for various cities</td>
  </tr>

</table>
