"""

"""
from __future__ import absolute_import

import json
from os import makedirs
from os.path import abspath, dirname, exists, isdir, join, relpath
import re
from shutil import copy
from tempfile import mkdtemp

from docutils import nodes
from docutils.parsers.rst.directives import unchanged
from docutils.statemachine import ViewList

import jinja2

from sphinx.locale import _
from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles


from .utils import out_of_date
from ..utils import decode_utf8, encode_utf8


    # <link rel="stylesheet" href="../../_static/gallery_detail.css">
    # <title>{{ name }}</title>
    # <script>
    #   (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    #   (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    #   m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    #   })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    #   ga('create', 'UA-27761864-7', 'pydata.org');
    #   ga('send', 'pageview');
    # </script>


DETAIL_TEMPLATE = jinja2.Template(u"""

.. _gallery_{{ name }}:

{{ name }}
{{ underline }}

{% if prev_ref -%} < :ref:`{{ prev_ref }}` | {% endif %}
back to :ref:`{{ up_ref }}`
{%- if next_ref %} | :ref:`{{ next_ref }}` >{% endif %}

.. bokeh-plot:: {{ path }}

""")


class BokehGalleryDirective(Directive):

    has_content = True
    required_arguments = 1

    option_spec = {
        'source-position' : unchanged
    }

    def run(self):

        env = self.state.document.settings.env
        app = env.app
        config = app.config

        env.note_reread()

        dest_dir = join(dirname(self.state_machine.node.source), "gallery")
        if not exists (dest_dir): makedirs(dest_dir)

        target_id = "bokeh-plot-%d" % env.new_serialno('bokeh-plot')
        target_node = nodes.target('', '', ids=[target_id])
        result = [target_node]

        source_position = self.options.get('source-position', 'below')

        spec = json.load(open(self.arguments[0]))

        details = spec['details']

        for i, detail in enumerate(details):
            path = detail['path']
            name = detail['name']
            prev_ref, next_ref = None, None
            if i > 0:
                prev_ref = "gallery_" + details[i-1]['name']
            if i < len(details)-1:
                next_ref = "gallery_" + details[i+1]['name']
            rst = DETAIL_TEMPLATE.render(
                name=name,
                underline="#"*len(name),
                path=abspath("../" + path),
                prev_ref=prev_ref,
                up_ref="gallery",
                next_ref=next_ref
            )
            with open(join(dest_dir, "%s.rst" % name), "w") as f:
                f.write(rst)
            env.read_doc(join("docs", "gallery", name), app=app)

        env.update(config, env.srcdir, env.doctreedir, app)

        result = ViewList()
        # text = SOURCE_TEMPLATE.render(source=source, linenos=linenos, emphasize_lines=emphasize_lines)
        # for line in text.split("\n"):
        #     result.append(line, "<bokeh-gallery>")
        node = nodes.paragraph()
        node.document = self.state.document
        self.state.nested_parse(result, 0, node)
        return node.children

def setup(app):
    app.add_directive('bokeh-gallery', BokehGalleryDirective)






