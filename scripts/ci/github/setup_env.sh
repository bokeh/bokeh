#!/usr/bin/env bash

if [[ $RUNNER_OS ==  "macOS" ]]; then
    export MINICONDA_PATH=$RUNNER_WORKSPACE/miniconda
    export CONDA_SCRIPT=bin
    export BASHRC=.bash_profile
    export PYTHON_BIN=python3
elif [[ $RUNNER_OS ==  "Windows" ]]; then
    export MINICONDA_PATH=`cygpath --unix $CONDA`
    export CONDA_SCRIPT=Scripts
    export BASHRC=.bash_profile
    export PYTHON_BIN=python
fi

export MINICONDA_SUB_PATH=$MINICONDA_PATH/$CONDA_SCRIPT
