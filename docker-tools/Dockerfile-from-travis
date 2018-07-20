#/* vim: set filetype=dockerfile : */
FROM travisci/ci-garnet:packer-1512502276-986baf0

ADD . /tmp/bokeh
RUN chown -R travis /tmp/bokeh

USER travis

ENV NO_GIT_FETCH=1
ENV PATH="/home/travis/miniconda/bin:${PATH}"
ENV CONDA_REQS="conda=4.4.11 conda-env=2.6.0 conda-build=3.0.27"
ARG PYTHON

RUN cd /tmp/bokeh && scripts/ci/install.test

RUN rm -rf /tmp/bokeh
