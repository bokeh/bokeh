Automated testing of examples
=============================

1. Install PhantomJS (see http://phantomjs.org/download.html)
2. Start `bokeh-server` in another terminal
3. Start `ipython notebook` in `examples/plotting/notebook`
4. Run `./test`

Example output
--------------

```bash
$ ./test
Testing glyphs/anscombe.py ...
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "anscombe.py", line 14
    raw_columns=
               ^
SyntaxError: invalid syntax
[FAIL]

Testing glyphs/choropleth.py ...
Wrote choropleth.html
[OK]

Testing glyphs/colorspec.py ...
Wrote colorspec.html
[OK]

Testing glyphs/data_select_tool.py ...
Using plot server at http://localhost:5006/bokeh; Docname: data_select_tool
TypeError: 'undefined' is not an object (evaluating 'this.plot_view.ctx')
    http://localhost:5006/bokehjs/static/js/bokeh.js: 15821
    http://localhost:5006/bokehjs/static/js/bokeh.js: 23678
    http://localhost:5006/bokehjs/static/js/bokeh.js: 24677
    http://localhost:5006/bokehjs/static/js/bokeh.js: 11565
    http://localhost:5006/bokehjs/static/js/bokeh.js: 12353
    http://localhost:5006/bokehjs/static/js/bokeh.js: 15812
    http://localhost:5006/bokehjs/static/js/bokeh.js: 23673
    http://localhost:5006/bokehjs/static/js/bokeh.js: 24672
    http://localhost:5006/bokehjs/static/js/bokeh.js: 24888
    http://localhost:5006/bokehjs/static/js/bokeh.js: 11487
    http://localhost:5006/bokehjs/static/js/bokeh.js: 11274
    http://localhost:5006/bokehjs/static/js/bokeh.js: 11206
    http://localhost:5006/bokehjs/static/js/bokeh.js: 12266
    http://localhost:5006/bokehjs/static/js/bokeh.js: 28694
    http://localhost:5006/bokehjs/static/js/bokeh.js: 4659
    http://localhost:5006/bokehjs/static/js/bokeh.js: 4771
    http://localhost:5006/bokehjs/static/js/bokeh.js: 9146
    http://localhost:5006/bokehjs/static/js/bokeh.js: 9577
[FAIL]

Testing glyphs/dateaxis.py ...
Wrote dateaxis.html
[OK]

Testing glyphs/glyph1.py ...
Wrote glyph1.html
[OK]
```


Manual Testing
====================

Abstract Rendering
--------------------

1. Start the Bokeh server.  (Use '-D remotedata' to get all examples)
2. Run ./plotting/server/abstractrender.py
3. The screen should display three plot areas.  
   The top two showing a 2D Gaussian.  
   The bottom one with stock price vs. volume (if server was started with '-D ...')
4. If you have the census tract dataset, also run ./plotting/server/census.py
   You should have a plot of the contiguous US (requires the '-D ...' switch as well)
