#!/bin/sh

rm -rf _build/html/static
rm -rf _build/html/plot_gallery/
mkdir -p _build/plot_gallery
rm -rf _build/plot_gallery/*

python build_gallery.py
make html

cp -r ../bokeh/server/static _build/html/static
cp -r _build/plot_gallery _build/html/plot_gallery

rm _templates/gallery_core.html
rm *.html


