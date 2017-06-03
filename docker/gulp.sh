BOKEHROOT="$( cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd )"
docker run -it -v $BOKEHROOT:/bokeh bokeh-dev /bin/sh -c "export PATH=$PATH:/bokeh/bokehjs/node_modules/.bin && cd /bokeh/bokehjs && gulp $1"
