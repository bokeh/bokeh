python setup.py --quiet install --build-js --single-version-externally-managed --record=record.txt
if errorlevel 1 exit 1

mkdir %PREFIX%\Examples
if errorlevel 1 exit 1

copy /Y examples %PREFIX%\Examples\bokeh
if errorlevel 1 exit 1
