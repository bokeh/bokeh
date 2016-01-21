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
    <td><img src="http://bokeh.pydata.org/static/clustering_t.png" width=400></img></td> 
    <td>Demonstrates different <a href=http://scikit-learn.org/stable>scikit-learn</a> clustering alorithms on a few different data sets.</td>
  </tr>
  
  <tr><td colspan="2">fourier_animated</td></tr>
  <tr>
    <td><img src="http://bokeh.pydata.org/static/fourier_animated_t.png" width=400></img></td> 
    <td>A continuously updating demonstration of Fourier synthesis using periodic callbacks</td>
  </tr>
  
  <tr><td colspan="2">movies</td></tr>
  <tr>
    <td><img src="http://bokeh.pydata.org/static/movies_t.png" width=400></img></td> 
    <td>An interactive query tool for a set of IMDB data</td>
  </tr>
  
  <tr><td colspan="2">ohlc</td></tr>
  <tr>
    <td><img src="http://bokeh.pydata.org/static/ohlc_t.png" width=400></img></td> 
    <td>A simulated streaming <a href=https://en.wikipedia.org/wiki/Open-high-low-close_chart>OHLC chart</a> with <a href=https://en.wikipedia.org/wiki/MACD>MACD indicator</a> and selectable moving averages using periodic callbacks</td>
  </tr>
  
  <tr><td colspan="2">random_tiles</td></tr>
  <tr>
    <td><img src="http://bokeh.pydata.org/static/random_tiles_t.png" width=400></img></td> 
    <td>Demonstrates a using User Defined Models with Bokeh server</td>
  </tr>
  
  <tr><td colspan="2">selection_histogram</td></tr>
  <tr>
    <td><img src="http://bokeh.pydata.org/static/selection_histogram_t.png" width=400></img></td> 
    <td>Shows axis histograms for selected <em>and</em> nonselected points in a scatter plot</td>
  </tr>
  
  <tr><td colspan="2">sliders</td></tr>
  <tr>
    <td><img src="http://bokeh.pydata.org/static/sliders_t.png" width=400></img></td> 
    <td>A basic demo that has sliders for controlling a plotted trigonometric function</td>
  </tr>
  
  <tr><td colspan="2">timeout</td></tr>
  <tr>
    <td><img src="http://bokeh.pydata.org/static/timeout_t.png" width=400></img></td> 
    <td> An updating plot that demonstrates using timeout callbacks in Bokeh server apps</td>
  </tr>
  
</table>
