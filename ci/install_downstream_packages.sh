#!/bin/bash

set -x #echo on

conda install --yes --quiet -c pyviz/label/dev holoviews nose
pip install dask["test"] distributed  # "test" extra installs additional testing dependencies
pip install pandas_bokeh
pip install geopandas
git clone https://github.com/PatrikHlobil/Pandas-Bokeh.git
