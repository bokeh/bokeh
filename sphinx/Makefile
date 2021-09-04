# These variables can be set from the command line.
BUILDDIR = build
SPHINXOPTS =

.PHONY: help clean html serve

help:
	@echo "Please use 'make <target>' where <target> is one of"
	@echo "  all              to make all standalone HTML files"
	@echo "  clean            to clear all built documentation files"
	@echo "  html             to make standalone (non-gallery) HTML files"
	@echo "  serve            to serve the generated HTML and open a browser"

all: html

clean:
	-rm -rf $(BUILDDIR)/*
	-rm -rf source/docs/gallery/*

html:
	@start=$$(date +%s) \
	; sphinx-build -b html -d $(BUILDDIR)/doctrees $(SPHINXOPTS) source -W $(BUILDDIR)/html \
	&& cp -r ../bokeh/server/static $(BUILDDIR)/html/ \
	&& echo \
	&& echo "Build finished in $$(($$(date +%s)-start)) seconds. The HTML pages are in $(BUILDDIR)/html."

serve:
	python docserver.py
