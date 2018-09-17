function install() {
    conda config --set auto_update_conda off
    conda config --set always_yes yes
    conda config --add channels bokeh
    conda config --add channels conda-forge
    conda config --get channels
    conda update -q conda
    conda install jinja2 pyyaml
    conda install $(python scripts/deps.py build).split() |  % {"""$_"""}
}

install
