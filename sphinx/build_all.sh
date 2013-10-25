#!/bin/sh
cd ..
python exportjs.py
cd sphinx
python build_gallery.py
make html
rm -rf _build/html/static
rm -rf _build/html/plot_gallery/
cp -r ../bokeh/server/static _build/html/static
cp -r plot_gallery _build/html/plot_gallery


