""" Generate a gallery of Bokeh plots from a configuration file.

"""
from __future__ import absolute_import

import json
from os.path import abspath, dirname, join

from sphinx.errors import SphinxError
from sphinx.util import copyfile, ensuredir, status_iterator

from .bokeh_directive import BokehDirective
from .templates import GALLERY_PAGE

class BokehGalleryDirective(BokehDirective):

    has_content = False
    required_arguments = 1

    def run(self):
        env = self.state.document.settings.env
        app = env.app

        # workaround (used below) for https://github.com/sphinx-doc/sphinx/issues/3924
        current_docname = env.docname

        docdir = dirname(env.doc2path(env.docname))

        specpath = join(docdir, self.arguments[0])

        dest_dir = join(dirname(specpath), "gallery")
        ensuredir(dest_dir)

        env.note_dependency(specpath)
        spec = json.load(open(specpath))
        details = spec['details']

        details_iter = status_iterator(details,
                                       'copying gallery files... ',
                                       'brown',
                                       len(details),
                                       stringify_func=lambda x: x['name'] + ".py")

        env.gallery_updated = []
        for detail in details_iter:
            src_path = abspath(join("..", detail['path']))
            dest_path = join(dest_dir, detail['name'] + ".py")

            # sphinx pickled env works only with forward slash
            docname = join(env.app.config.bokeh_gallery_dir, detail['name']).replace("\\","/")

            try:
                copyfile(src_path, dest_path)
            except OSError as e:
                raise SphinxError('cannot copy gallery file %r, reason: %s' % (src_path, e))

            try:
                env.clear_doc(docname)
                env.read_doc(docname, app=app)
                env.gallery_updated.append(docname)
            except Exception as e:
                raise SphinxError('failed to read gallery doc %r, reason: %s' % (docname, e))

        names = [detail['name']for detail in details]
        rst_text = GALLERY_PAGE.render(names=names)

        # workaround for https://github.com/sphinx-doc/sphinx/issues/3924
        env.temp_data['docname'] = current_docname

        return self._parse(rst_text, "<bokeh-gallery>")

def env_updated_handler(app, env):
    # this is to make sure the files that were copied and read by hand
    # in by the directive get marked updated and written out appropriately
    return getattr(env, 'gallery_updated', [])

def setup(app):
    app.add_config_value('bokeh_gallery_dir', join("docs", "gallery"), 'html')
    app.connect('env-updated', env_updated_handler)
    app.add_directive('bokeh-gallery', BokehGalleryDirective)
