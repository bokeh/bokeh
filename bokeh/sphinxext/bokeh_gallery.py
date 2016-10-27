""" Generate a gallery of Bokeh plots from a configuration file.

"""
from __future__ import absolute_import

import json
from os import makedirs, listdir, remove
from os.path import abspath, dirname, exists, join

from docutils.parsers.rst.directives import unchanged

from .bokeh_directive import BokehDirective
from .templates import GALLERY_DETAIL, GALLERY_PAGE

class BokehGalleryDirective(BokehDirective):

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
            rst = GALLERY_DETAIL.render(
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

        names = [detail['name'] for detail in details]
        env.gallery_names = [join("docs", "gallery", n) for n in names]
        rst_text = GALLERY_PAGE.render(names=names)

        return self._parse(rst_text, "<bokeh-gallery>")

def env_updated_handler(app, env):
    return getattr(env, 'gallery_names', [])

def setup(app):

    # Clear gallery before generating a new one
    dirname = 'source/docs/gallery'
    if not exists(dirname):
        makedirs(dirname)
    for fname in listdir(dirname):
        remove(join(dirname, fname))

    app.connect('env-updated', env_updated_handler)
    app.add_directive('bokeh-gallery', BokehGalleryDirective)
