# These variables can be set from the command line.
BUILDDIR = build
SPHINXOPTS =

.PHONY: help clean html reference reference-check serve

help:
	@echo "Please use 'make <target>' where <target> is one of"
	@echo "  all              to make all standalone HTML files"
	@echo "  clean            to clear all built documentation files"
	@echo "  html             to make standalone (non-gallery) HTML files"
	@echo "  reference        to regenerate the bokeh.models API reference"
	@echo "  reference-check  to check that the generated API reference is current"
	@echo "  serve            to serve the generated HTML and open a browser"

all: html

clean:
	-rm -rf $(BUILDDIR)/*
	-rm -rf source/docs/gallery/*
	-rm -rf source/docs/examples/*
	-rm -rf source/_images/icons/*.svg

reference:
	cd ../.. && python -m tools.api_reference

reference-check:
	cd ../.. && python -m tools.api_reference --check

html: reference-check
	@start=$$(date +%s) \
	; cp -r ../../bokehjs/src/less/icons/* source/_images/icons/ \
	&& sphinx-build -W -b html -d $(BUILDDIR)/doctrees $(SPHINXOPTS) source $(BUILDDIR)/html \
	&& cp -r source/_images/examples $(BUILDDIR)/html/_images/ \
	&& (cp -r ../../src/bokeh/server/static $(BUILDDIR)/html/ || true) \
	&& echo \
	&& echo "Build finished in $$(($$(date +%s)-start)) seconds. The HTML pages are in $(BUILDDIR)/html."

serve:
	python docserver.py
