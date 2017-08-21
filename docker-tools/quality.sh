BOKEHROOT="$( cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd )"
docker run -it -v $BOKEHROOT:/bokeh "bokeh-dev:py${PYTHON:-3}" /bin/sh -c "cd /bokeh && pytest -m quality"
