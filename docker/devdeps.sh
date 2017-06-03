BOKEHROOT="$( cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd )"
docker run -it -v $BOKEHROOT:/bokeh bokeh-dev /bin/sh -c 'cd /bokeh/scripts && python devdeps.py'
