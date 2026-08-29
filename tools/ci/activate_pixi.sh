#!/usr/bin/env bash

# Pixi doesn't run Conda post-link scripts by default. Initialize Graphviz's
# plugin registry on macOS, mirroring the conda-forge graphviz post-link script.
if [[ -x "${CONDA_PREFIX}/bin/dot" ]] && ! compgen -G "${CONDA_PREFIX}/lib/graphviz/config*" > /dev/null; then
    "${CONDA_PREFIX}/bin/dot" -c
fi
