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

# Install the downstream projects tested from their current default branches.
banner "dask/distributed" 2> /dev/null
git clone https://github.com/dask/distributed.git
python -m pip install --no-deps -e "./distributed"

banner "dask/dask" 2> /dev/null
git clone https://github.com/dask/dask.git
python -m pip install -e "./dask[test]"  # "test" extra installs additional testing dependencies
