FROM frolvlad/alpine-miniconda3
LABEL org.pydata.bokeh.maintainer="Karel-van-de-Plassche <karelvandeplassche@gmail.com>"

RUN apk add --no-cache \
    git \
    bash \
    curl

ENV BOKEH_SOURCE_DIR /bokeh
RUN git clone https://github.com/bokeh/bokeh.git $BOKEH_SOURCE_DIR

#Increase build number to force rebuild
ENV build 0
RUN cd $BOKEH_SOURCE_DIR && git fetch && git checkout 2283_docker_container
RUN cat $BOKEH_SOURCE_DIR/scripts/ci/install

ENV CONDA_REQS="conda-build"
ENV NO_INSTALL_CONDA 1
ENV NO_GIT_FETCH 1

ENV BASH /bin/bash

# Create separate conda-env to build bokeh
RUN conda create --yes --name bokeh_build
RUN $BASH -c 'source activate bokeh_build'
RUN cd $BOKEH_SOURCE_DIR && scripts/ci/install:build
RUN cd $BOKEH_SOURCE_DIR && scripts/ci/build
RUN $BASH -c 'source deactivate'

# Install the build bokeh package. Workaround as --yes and --use-local don't work together
RUN conda install --yes /opt/conda/conda-bld/noarch/bokeh*

# Remove the build environment
RUN conda remove --yes --name bokeh_build --all

# Bokeh optional dependencies
#RUN conda install -y \
#    'nodejs'
    #'psutil' # Not used in bokeh==0.12.7

RUN conda clean -ay

RUN python3 -c "import tornado; print('tornado version=' + tornado.version)"
RUN bokeh info

ENV BOKEH_EXAMPLE_DIR bokeh_examples
COPY hello_world.py $BOKEH_EXAMPLE_DIR/hello_world.py
COPY hello_nodejs.py $BOKEH_EXAMPLE_DIR/hello_nodejs.py
# Build with 'sudo docker build . --tag bokeh'
# Run with 'sudo docker run -p 5006:5006 -it bokeh bokeh serve bokeh_examples/hello_world.py'
