#!/bin/bash

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

set -x #echo on

set +e

banner "Dask -- dask/diagnostics" 2> /dev/null
cd dask
pytest dask/diagnostics
cd ..

banner "Dask -- distributed/dashboard" 2> /dev/null
cd distributed
pytest distributed/dashboard
cd ..

pushd "$(python -c 'import site; print(site.getsitepackages()[0])')" || exit

banner "Panel" 2> /dev/null
pytest panel/tests

banner "Holoviews" 2> /dev/null
nosetests holoviews/tests/plotting/bokeh

popd

exit 0
