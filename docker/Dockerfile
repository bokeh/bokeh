FROM ubuntu:16.04

RUN apt-get update

RUN apt-get install -y curl git build-essential python python-pip python3-pip python-tk python3-tk

RUN git clone https://github.com/bokeh/bokeh.git /bokeh

RUN cd ~ \
    && curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh \
    && bash nodesource_setup.sh \
    && rm nodesource_setup.sh

RUN apt-get install nodejs

RUN pip3 install virtualenv
RUN virtualenv ~/.virtualenvs/python2 --python=python2
RUN virtualenv ~/.virtualenvs/python3 --python=python3

COPY requirements.txt /tmp/
RUN ~/.virtualenvs/python2/bin/pip install --upgrade --no-cache-dir -r /tmp/requirements.txt
RUN ~/.virtualenvs/python3/bin/pip install --upgrade --no-cache-dir -r /tmp/requirements.txt

RUN echo "export PATH=\$PATH:/bokeh/bokehjs/node_modules/.bin" >> ~/.bashrc

RUN cd /bokeh && ~/.virtualenvs/python3/bin/python -c 'import bokeh.sampledata; bokeh.sampledata.download()'

WORKDIR /bokeh
