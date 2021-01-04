#!/bin/bash

set -x #echo on

set +e

pushd `python -c "import site; print(site.getsitepackages()[0])"`
pytest distributed/dashboard
nosetests holoviews/tests/plotting/bokeh
popd

pytest Pandas-Bokeh/Tests/test_PandasBokeh.py
pytest Pandas-Bokeh/Tests/test_GeoPandasBokeh.py

exit 0
