python setup.py install
if errorlevel 1 exit 1

mkdir %EXAMPLES%
if errorlevel 1 exit 1

move examples %EXAMPLES%\bokeh
if errorlevel 1 exit 1
