#/* vim: set filetype=dockerfile : */
#############################
#  Set up build environment #
#############################
FROM frolvlad/alpine-miniconda3 AS build
LABEL org.pydata.bokeh.maintainer="Karel-van-de-Plassche <karelvandeplassche@gmail.com>"

RUN apk add --no-cache \
    git \
    bash

ENV BOKEH_SOURCE_DIR /bokeh
ARG BOKEH_VERSION

RUN git clone --depth=50 https://github.com/bokeh/bokeh.git $BOKEH_SOURCE_DIR

#Increase build number to force rebuild
ENV build 0
WORKDIR $BOKEH_SOURCE_DIR
#RUN git fetch origin $BOKEH_VERSION
RUN sh -c 'if [[ ! -z "$BOKEH_VERSION" ]]; then echo Fetching $BOKEH_VERSION; git fetch origin $BOKEH_VERSION; git checkout -f FETCH_HEAD; fi'

ENV CONDA_REQS="conda-build"
ENV BASH /bin/bash

# Prepare conda env for building
RUN conda create --yes --name bokeh_build
RUN $BASH -c 'source activate bokeh_build'
# Install build dependencies
RUN conda install --yes --quiet $CONDA_REQS
# set default conda channels
RUN conda config --set auto_update_conda off
RUN conda config --append channels bokeh
RUN conda config --append channels conda-forge
RUN conda config --get channels
# install build time dependencies
RUN conda install --yes --quiet `python scripts/deps.py build`
# install NPM dependencies
RUN npm install -g npm
WORKDIR $BOKEH_SOURCE_DIR/bokehjs
# build BokehJS
RUN npm install --no-save --no-progress
RUN sh -c 'if [[ -d make ]]; then node make build; else node_modules/.bin/gulp build; fi'
WORKDIR $BOKEH_SOURCE_DIR
# build a noarch conda package for Bokeh using the just-built BokehJS
RUN conda build conda.recipe --quiet --no-test --no-anaconda-upload --dirty

################################
#  Install build conda package #
################################
FROM frolvlad/alpine-miniconda3 AS install
COPY --from=build /opt/conda/conda-bld/noarch/ /opt/conda/conda-bld/noarch/
## We need a recent conda version for --use-local
RUN conda install --quiet --yes \
    conda

RUN conda install --quiet --yes --use-local \
    bokeh \
    nodejs
## Remove the build environment
#RUN conda remove --yes --name bokeh_build --all
#
# Clean the conda environment
RUN conda clean -ay
#
RUN python3 -c "import tornado; print('tornado version=' + tornado.version)"
RUN bokeh info

#FROM install AS test
#COPY --from=build $BOKEH_SOURCE_DIR/scripts/deps.py $BOKEH_SOURCE_DIR/scripts/deps.py
#
#ENV BOKEH_EXAMPLE_DIR bokeh_examples
#COPY hello_world.py $BOKEH_EXAMPLE_DIR/hello_world.py
#COPY hello_nodejs.py $BOKEH_EXAMPLE_DIR/hello_nodejs.py
## Build with 'sudo docker build . --tag bokeh'
## Run with 'sudo docker run -p 5006:5006 -it bokeh bokeh serve bokeh_examples/hello_world.py'
