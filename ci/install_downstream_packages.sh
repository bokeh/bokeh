#!/bin/bash

set -x #echo on

conda install --yes --quiet -c pyviz/label/dev holoviews nose scipy
git clone https://github.com/dask/distributed.git
pip install -e "./distributed"
git clone https://github.com/dask/dask.git
pip install -e "./dask[test]"  # "test" extra installs additional testing dependencies
pip install pandas_bokeh
pip install geopandas
git clone https://github.com/PatrikHlobil/Pandas-Bokeh.git
