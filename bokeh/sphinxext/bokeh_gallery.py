""" Generate a gallery of Bokeh plots from a configuration file.

"""
from __future__ import absolute_import

import json
from os import makedirs
from os.path import abspath, dirname, exists, join

from docutils import nodes
from docutils.parsers.rst.directives import unchanged
from docutils.statemachine import ViewList

import jinja2

from sphinx.util.compat import Directive

GALLERY_TEMPLATE = jinja2.Template(u"""

{% for name in names %}
* |{{ name }}|
{% endfor %}

{% for name in names %}
.. |{{ name }}| image:: /_images/gallery/{{ name }}.png
    :target: gallery/{{ name }}.html
    :class: gallery
{% endfor %}

""")

DETAIL_TEMPLATE = jinja2.Template(u"""
:orphan:

.. _gallery_{{ name }}:

{{ name }}
{{ underline }}

{% if prev_ref -%} < :ref:`{{ prev_ref }}` | {% endif %}
back to :ref:`{{ up_ref }}`
{%- if next_ref %} | :ref:`{{ next_ref }}` >{% endif %}

.. bokeh-plot:: {{ path }} {%- if symbol %} {{ symbol }} {% endif %}
   {% if source_position -%}:source-position: {{ source_position }} {% endif %}

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

        spec_path = self.arguments[0]

        env.note_reread()

        dest_dir = join(dirname(self.state_machine.node.source), "gallery")
        if not exists (dest_dir): makedirs(dest_dir)

        target_id = "bokeh-plot-%d" % env.new_serialno('bokeh-plot')
        target_node = nodes.target('', '', ids=[target_id])
        result = [target_node]

        source_position = self.options.get('source-position', 'below')

        spec = json.load(open(spec_path))

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
                symbol=detail.get('symbol'),
                prev_ref=prev_ref,
                up_ref="gallery",
                next_ref=next_ref,
                source_position=source_position,
            )
            with open(join(dest_dir, "%s.rst" % name), "w") as f:
                f.write(rst)
            env.clear_doc(join("docs", "gallery", name))
            env.read_doc(join("docs", "gallery", name), app=app)

        result = ViewList()
        names = [detail['name'] for detail in details]
        env.gallery_names = [join("docs", "gallery", n) for n in names]
        text = GALLERY_TEMPLATE.render(names=names)
        for line in text.split("\n"):
            result.append(line, "<bokeh-gallery>")
        node = nodes.paragraph()
        node.document = self.state.document
        self.state.nested_parse(result, 0, node)


        return node.children

def env_updated_handler(app, env):
    return getattr(env, 'gallery_names', [])

def setup(app):
    app.connect('env-updated', env_updated_handler)
    app.add_directive('bokeh-gallery', BokehGalleryDirective)
