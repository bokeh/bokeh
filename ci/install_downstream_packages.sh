#!/bin/bash

set -x #echo on

conda install --yes --quiet -c pyviz/label/dev holoviews nose
pip install dask["test"] distributed  # "test" extra installs additional testing dependencies
# This is a temporary workaround to avoid clashing between `flaky` and `pytest-rerunfailures`.
# See https://github.com/bokeh/bokeh/issues/11211
pip uninstall --yes flaky
pip install pandas_bokeh
pip install geopandas
git clone https://github.com/PatrikHlobil/Pandas-Bokeh.git
