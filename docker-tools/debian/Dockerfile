# Base image from https://github.com/ContinuumIO/docker-images/blob/master/miniconda3/debian/Dockerfile
# Since it's not published on Dockerhub yet, we build it as separate stage

FROM debian:buster-slim AS continuumio-miniconda3-debian

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV PATH /opt/conda/bin:$PATH

RUN apt-get update --fix-missing && \
    apt-get install -y wget bzip2 ca-certificates libglib2.0-0 libxext6 libsm6 libxrender1 git && \
    apt-get clean

RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-4.7.12-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    /opt/conda/bin/conda clean -tipsy && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc && \
    find /opt/conda/ -follow -type f -name '*.a' -delete && \
    find /opt/conda/ -follow -type f -name '*.js.map' -delete && \
    /opt/conda/bin/conda clean -afy

CMD [ "/bin/bash" ]


###############################################################################
#
# Next, build the actual image that will run in production.

FROM continuumio-miniconda3-debian

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV NUM_PROCS=4
ENV BK_VERSION=1.4.0
ENV BOKEH_RESOURCES=cdn

# Running as root is insecure (http://canihaznonprivilegedcontainers.info/)
# so create a new user and set working directory:
RUN useradd --create-home appuser
WORKDIR /home/appuser


# Use environment.yml for specifying which conda env
# update conda base environment which is active
COPY --chown=appuser:appuser ./environment.yml .
RUN conda update -n base -c defaults conda
RUN conda env update -n base --f environment.yml

###############################################################################
#
# Copy the app you want to run, using demo.bokeh.org
RUN git clone --branch $BK_VERSION https://github.com/bokeh/bokeh.git
RUN mkdir -p ./examples \
    && cp -r ./bokeh/examples/app ./examples/ \
    && rm -rf ./bokeh
RUN python -c 'import bokeh; bokeh.sampledata.download(progress=False)'
RUN python ./examples/app/stocks/download_sample_data.py
ADD --chown=appuser:appuser https://raw.githubusercontent.com/bokeh/demo.bokeh.org/master/index.html ./index.html

# Run as the newly created user:
USER appuser

# Expose 8080 being default https port for e.g. Google App Engine
EXPOSE 8080

CMD bokeh serve --port 8080 \
    --allow-websocket-origin="*" \
    --index=/home/appuser/index.html \
    --num-procs=${NUM_PROCS} \
    ./examples/app/clustering \
    ./examples/app/crossfilter \
    ./examples/app/dash \
    ./examples/app/export_csv \
    ./examples/app/fourier_animated.py \
    ./examples/app/gapminder \
    ./examples/app/image_blur.py \
    ./examples/app/movies \
    ./examples/app/ohlc \
    ./examples/app/population.py \
    ./examples/app/selection_histogram.py \
    ./examples/app/sliders.py \
    ./examples/app/spectrogram \
    ./examples/app/surface3d \
    ./examples/app/stocks \
    ./examples/app/taylor.py \
    ./examples/app/weather
