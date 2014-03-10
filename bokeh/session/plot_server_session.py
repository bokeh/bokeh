""" Defines the base PlotSession and some example session types.
"""
from __future__ import absolute_import

from os.path import abspath, split, join
import os.path
import logging
import uuid
import warnings
import requests

from six import string_types
from six.moves.urllib.parse import urljoin, urlencode, urlsplit

from .. import protocol, serverconfig, utils
from ..objects import PlotObject, Plot, PlotContext, recursively_traverse_plot_object
from ..properties import HasProps
from ..exceptions import DataIntegrityException
from .base_html_session import BaseHTMLSession
from .persistent_backbone_session import PersistentBackboneSession

logger = logging.getLogger(__file__)

class PlotServerSession(BaseHTMLSession, PersistentBackboneSession):

    def __init__(self, server_config=None, server_name=None, username=None,
                 serverloc=None, userapikey="nokey"):
        # This logic is based on ContinuumModelsClient.__init__ and
        # mpl.PlotClient.__init__.  There is some merged functionality here
        # since a Session is meant to capture the little bit of lower-level
        # logic in PlotClient (i.e. avoiding handling of things like
        # _newxyplot()), but also build in the functionality of the
        # ContinuumModelsClient.
        if not server_config:
            if not server_name: server_name = serverloc
            server_config = serverconfig.Server(name=server_name,
                                                root_url=serverloc,
                                                userapikey=userapikey,
                                                username=username)
        self.load_server_config(server_config)
        self.http_session = requests.session()
        self.http_session.headers.update({
            'content-type':'application/json',
            'BOKEHUSER-API-KEY' : self.userapikey,
            'BOKEHUSER' : self.username})

        if self.root_url:
            url = urljoin(self.root_url, '/bokeh/userinfo/')
            self.userinfo = utils.get_json(self.http_session.get(url, verify=False))
        else:
            # why is this here?  It seems like we would not use this session
            # if we weren't connecting to a server
            logger.info('Not using a server, plots will only work in embedded mode')
            self.userinfo = None

        self.docid = None
        self.plotcontext = None
        self.apikey = None
        self.base_url = urljoin(self.root_url, "/bokeh/bb/")
        self.raw_js_objs = []
        super(PlotServerSession, self).__init__()

    def load_server_config(self, config):
        self.username = config.username
        self.root_url = config.root_url
        self.userapikey = config.userapikey
        self.config = config

    #------------------------------------------------------------------------
    # Document-related operations
    #------------------------------------------------------------------------
    def raw_js_snippets(self, obj):
        self.raw_js_objs.append(obj)

    def load_doc(self, docid):
        url = urljoin(self.root_url,"/bokeh/getdocapikey/%s" % docid)
        resp = self.http_session.get(url, verify=False)
        if resp.status_code == 401:
            raise Exception('HTTP Unauthorized accessing DocID "%s"' % docid)
        apikey = utils.get_json(resp)
        if 'apikey' in apikey:
            self.docid = docid
            self.apikey = apikey['apikey']
            logger.info('got read write apikey')
        else:
            self.docid = docid
            self.apikey = apikey['readonlyapikey']
            logger.info('got read only apikey')
        self.load_all()
        plotcontext = self.load_type('PlotContext')
        if len(plotcontext):
            temp = plotcontext[0]
            if len(plotcontext) > 1:
                logger.warning(
                    "Found more than one PlotContext for doc ID %s; " \
                    "Using PlotContext ID %s" % (self.docid, temp._id))
            plotcontext = temp
        else:
            logger.warning("Unable to load PlotContext for doc ID %s" % self.docid)
            plotcontext = PlotContext()
            self.store_obj(plotcontext)
        self.plotcontext = plotcontext
        self.add(self.plotcontext)

    def make_doc(self, title):
        url = urljoin(self.root_url,"/bokeh/doc/")
        data = protocol.serialize_web({'title' : title})
        response = self.http_session.post(url, data=data, verify=False)
        if response.status_code == 409:
            raise DataIntegrityException
        self.userinfo = utils.get_json(response)

    def remove_doc(self, title):
        matching = [x for x in self.userinfo['docs'] \
                    if x.get('title') == title]
        docid = matching[0]['docid']
        url = urljoin(self.root_url,"/bokeh/doc/%s/" % docid)
        response = self.http_session.delete(url, verify=False)
        if response.status_code == 409:
            raise DataIntegrityException
        self.userinfo = utils.get_json(response)

    def use_doc(self, name):
        self.docname = name
        docs = self.userinfo.get('docs')
        matching = [x for x in docs if x.get('title') == name]
        if len(matching) == 0:
            logger.info("No documents found, creating new document '%s'" % name)
            self.make_doc(name)
            return self.use_doc(name)
        elif len(matching) > 1:
            logger.warning("Multiple documents with title '%s'" % name)
        self.load_doc(matching[0]['docid'])

    def make_source(self, *args, **kwargs):
        # This should not implement this here directly, since it should
        # done by separately creating the DataSource object. Stubbing this
        # out for now for symmetry with mpl.PlotClient
        raise NotImplementedError("Construct DataSources manually from bokeh.objects")

    def store_broadcast_attrs(self, attrs):
        data = self.serialize(attrs)
        url = utils.urljoin(self.base_url, self.docid + "/", "bulkupsert")
        self.http_session.post(url, data=data)

    #------------------------------------------------------------------------
    # Loading models
    #------------------------------------------------------------------------

    def load_all(self, asdict=False):
        """the json coming out of this looks different than that coming
        out of load_type, because it contains id, type, attributes, whereas
        the other one just contains attributes directly
        """
        url = utils.urljoin(self.base_url, self.docid +"/")
        attrs = protocol.deserialize_json(self.http_session.get(url).content.decode('utf-8'))
        if not asdict:
            models = self.load_broadcast_attrs(attrs)
            for m in models:
                m._dirty = False
            return models
        else:
            models = attrs
        return models

    def load_type(self, typename, asdict=False):
        url = utils.urljoin(self.base_url, self.docid +"/", typename + "/")
        attrs = protocol.deserialize_json(self.http_session.get(url).content.decode('utf-8'))
        if not asdict:
            models = self.load_attrs(typename, attrs)
            for m in models:
                m._dirty = False
            return models
        else:
            models = attrs
        return models

    def load_obj(self, ref, asdict=False):
        """loads an object from the server.
        if asdict:
            only the json is returned.
        else:
            update the existing copy in _models if it is present
            instantiate a new one if it is not
            and make sure to convert all references into models
        in the conversion from json to objects, sometimes references
        to models need to be resolved.
        """
        typename = ref["type"]
        ref_id = ref["id"]
        url = utils.urljoin(self.base_url, self.docid + "/" + typename +\
                            "/" + ref_id + "/")
        attr = protocol.deserialize_json(self.http_session.get(url).content)
        if not asdict:
            return self.load_attrs(typename, [attr])[0]
        else:
            return attr

    #loading callbacks
    def load_all_callbacks(self, get_json=False):
        """get_json = return json of callbacks, rather than
        loading them into models
        """
        url = utils.urljoin(self.base_url, self.docid + "/", "callbacks")
        data = protocol.deserialize_json(self.http_session.get(url).content)
        if get_json:
            return data
        self.load_callbacks_json(data)

    #storing callbacks

    def store_callbacks(self, to_store):
        all_data = self.callbacks_json(to_store)
        url = utils.urljoin(self.base_url, self.docid + "/", "callbacks")
        all_data = self.serialize(all_data)
        self.http_session.post(url, data=all_data)
        for m in to_store:
            m._callbacks_dirty = False
