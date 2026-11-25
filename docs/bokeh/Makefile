# These variables can be set from the command line.
BUILDDIR = build
SPHINXOPTS =

PROJECT_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../..)
PROJECT_PIXI_ENVS := $(PROJECT_ROOT)/.pixi/envs
PROJECT_PIXI_ACTIVE := $(filter $(PROJECT_PIXI_ENVS)/%,$(CONDA_PREFIX))

ifeq ($(BOKEH_DOCS_PIXI_ACTIVE)$(PROJECT_PIXI_ACTIVE),)

.DEFAULT_GOAL := _pixi
.PHONY: _pixi

ifneq ($(strip $(MAKECMDGOALS)),)
.PHONY: $(MAKECMDGOALS)
$(MAKECMDGOALS): _pixi ;
endif

_pixi:
	@BOKEH_DOCS_PIXI_ACTIVE=1 pixi run --manifest-path "$(PROJECT_ROOT)" --locked $(MAKE) $(MAKECMDGOALS)

else

.PHONY: help clean html reference reference-check reference-clean serve

help:
	@echo "Please use 'make <target>' where <target> is one of"
	@echo "  all              to make standalone HTML files, their Markdown versions, and llms.txt"
	@echo "  clean            to clear all built documentation files"
	@echo "  html             to make standalone HTML files only"
	@echo "  reference        to regenerate the bokeh.models API reference"
	@echo "  reference-check  to check that the generated API reference is current"
	@echo "  reference-clean  to remove generated API reference sources"
	@echo "  serve            to serve the generated HTML and open a browser"

# The Markdown pages and llms.txt take a second, non-parallel Sphinx build.
# Only "all" includes them, to keep "html" fast for local work.
MARKDOWNOPTS = -D llms_txt_enabled=0

all: MARKDOWNOPTS =
all: html

clean: reference-clean
	-rm -rf $(BUILDDIR)/*
	-rm -rf source/docs/gallery/*
	-rm -rf source/docs/examples/*
	-rm -rf source/_images/icons/*.svg

reference:
	python -m api_reference

reference-check:
	@python -m api_reference --check || ( \
		echo "Reference check failed; retrying from a clean generated tree." && \
		python -m api_reference --clean && \
		python -m api_reference && \
		python -m api_reference --check \
	)

reference-clean:
	python -m api_reference --clean

# Keep icon dependency mtimes stable across unchanged builds.
html: reference-check
	@start=$$(date +%s) \
	; cp -pr ../../bokehjs/src/less/icons/* source/_images/icons/ \
	&& sphinx-build -W -b html -d $(BUILDDIR)/doctrees $(MARKDOWNOPTS) $(SPHINXOPTS) source $(BUILDDIR)/html \
	&& cp -r source/_images/examples $(BUILDDIR)/html/_images/ \
	&& (cp -r ../../src/bokeh/server/static $(BUILDDIR)/html/ || true) \
	&& echo \
	&& echo "Build finished in $$(($$(date +%s)-start)) seconds. The HTML pages are in $(BUILDDIR)/html."

serve:
	python docserver.py

endif
