BOKEHROOT="$( cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd )"
docker run -it -v $BOKEHROOT:/bokeh bokeh-dev /bin/sh -c "ln -fs /root/.virtualenvs/python3/bin/python /usr/bin/python && export PATH=$PATH:/bokeh/bokehjs/node_modules/.bin:/root/.virtualenvs/python3/bin && cd /bokeh && pytest $1"
