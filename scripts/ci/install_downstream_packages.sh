#!/bin/bash

set -x #echo on

banner() {
  echo
  echo "+------------------------------------------------------------------------------------+"
  printf "| %-80s   |\n" "$@"
  echo "+------------------------------------------------------------------------------------+"
  echo
}

banner_and_restore() {
        banner "$*"
        case "$save_flags" in
         (*x*)  set -x
        esac
}

alias banner='{ save_flags="$-"; set +x;} 2> /dev/null; banner_and_restore'

banner "holoviews" 2> /dev/null
conda install --yes --quiet -c pyviz/label/dev holoviews nose scipy

banner "dask/distributed" 2> /dev/null
git clone https://github.com/dask/distributed.git
pip install -e "./distributed"

banner "dask/dask" 2> /dev/null
pip install pytest-timeout pytest-cov pytest-rerunfailures pytest-repeat
git clone https://github.com/dask/dask.git
pip install -e "./dask[test]"  # "test" extra installs additional testing dependencies
