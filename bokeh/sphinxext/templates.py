from __future__ import absolute_import

from jinja2 import Environment, PackageLoader

_env = Environment(loader=PackageLoader('bokeh.sphinxext', '_templates'))

CCB_PROLOGUE = _env.get_template("collapsible_code_block_prologue.html")
CCB_EPILOGUE = _env.get_template("collapsible_code_block_epilogue.html")

COLOR_DETAIL = _env.get_template("color_detail.html")

ENUM_DETAIL = _env.get_template("enum_detail.rst")

GALLERY_PAGE = _env.get_template("gallery_page.rst")

JINJA_DETAIL = _env.get_template("jinja_detail.rst")

MODEL_DETAIL = _env.get_template("model_detail.rst")

OPTIONS_DETAIL = _env.get_template("options_detail.rst")

PALETTE_DETAIL = _env.get_template("palette_detail.html")

PALETTE_GROUP_DETAIL = _env.get_template("palette_group_detail.html")

PLOT_PAGE = _env.get_template("plot_page.rst")

PROP_DETAIL = _env.get_template("prop_detail.rst")
