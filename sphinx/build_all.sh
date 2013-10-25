#!/bin/sh
cd ..
python exportjs.py
cd sphinx
python build_gallery.py
make html
rm -rf _build/html/static
cp -r ../bokeh/server/static _build/html/static


