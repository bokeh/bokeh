set -e # exit on error
set -x # echo commands

git fetch origin master

wget -nv "http://repo.continuum.io/miniconda/${MINICONDA_FILENAME}"

bash ${MINICONDA_FILENAME} -b -f -p ${HOME}/miniconda

# If emergency, temporary package pins are necessary, they can go here
PINNED_PKGS=$(cat <<EOF
EOF
)
echo -e "$PINNED_PKGS" > $HOME/miniconda/conda-meta/pinned

conda install --yes python=${PYTHON:-3.6} ${CONDA_REQS}

conda config --set auto_update_conda off
conda config --append channels bokeh
conda config --append channels conda-forge
conda config --get channels
