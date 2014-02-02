from flask import (
    render_template, request,
    send_from_directory, abort,
    jsonify, Response, redirect)

from ..app import bokeh_app
import os
import logging
import uuid
from six import string_types


from .bbauth import check_read_authentication_and_create_client


from ..models import user
from ..models import docs
from ..models import convenience as mconv
from ... import protocol
from ...exceptions import DataIntegrityException
from ..views import make_json
from ..crossdomain import crossdomain
from ..serverbb import RedisSession
from flask import url_for
#main pages

@bokeh_app.route('/bokeh/ping')
def ping():
    #test route, to know if the server is up
    return "pong"

@bokeh_app.route('/bokeh/')
def index(*unused_all, **kwargs):
    bokehuser = bokeh_app.current_user()
    if not bokehuser:
        return redirect("/bokeh/login")
    return render_template('bokeh.html',
                           splitjs=bokeh_app.splitjs,
                           username=bokehuser.username,
                           title="Bokeh Documents for %s" % bokehuser.username
                           )

@bokeh_app.route('/')
def welcome(*unused_all, **kwargs):
    return redirect("/bokeh/")

@bokeh_app.route('/bokeh/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(bokeh_app.root_path, 'static'),
                               'favicon.ico', mimetype='image/x-icon')

def _makedoc(redisconn, u, title):
    docid = str(uuid.uuid4())
    if isinstance(u, string_types):
        u = user.User.load(redisconn, u)
    sess = bokeh_app.backbone_storage.get_session(docid)
    u.add_doc(docid, title)
    doc = docs.new_doc(bokeh_app, docid,
                       title, sess,
                       rw_users=[u.username])
    u.save(redisconn)
    return doc

@bokeh_app.route('/bokeh/doc', methods=['POST'])
@bokeh_app.route('/bokeh/doc/', methods=['POST'])
def makedoc():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = bokeh_app.current_user()
    try:
        doc = _makedoc(bokeh_app.servermodel_storage, bokehuser, title)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = protocol.serialize_web(bokehuser.to_public_json())
    msg = protocol.serialize_web({'msgtype' : 'docchange'})
    bokeh_app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    return make_json(jsonstring)

@bokeh_app.route('/bokeh/doc/<docid>', methods=['delete'])
@bokeh_app.route('/bokeh/doc/<docid>/', methods=['delete'])
def deletedoc(docid):
    bokehuser = bokeh_app.current_user()
    try:
        bokehuser.remove_doc(docid)
        bokehuser.save(bokeh_app.servermodel_storage)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = protocol.serialize_web(bokehuser.to_public_json())
    msg = protocol.serialize_web({'msgtype' : 'docchange'})
    bokeh_app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    return make_json(jsonstring)

@bokeh_app.route('/bokeh/getdocapikey/<docid>')
def get_doc_api_key(docid):
    bokehuser = bokeh_app.current_user()
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    if mconv.can_write_from_request(doc, request, bokeh_app):
        return jsonify({'apikey' : doc.apikey})
    elif mconv.can_write_from_request(doc, request, bokeh_app):
        return jsonify({'readonlyapikey' : doc.readonlyapikey})
    else:
        return abort(401)

@bokeh_app.route('/bokeh/userinfo/')
def get_user():
    bokehuser = bokeh_app.current_user()
    if not bokehuser:
        abort(403) 
    content = protocol.serialize_web(bokehuser.to_public_json())
    return make_json(content)

def _make_test_plot_file(username, userapikey, url):
    lines = ["from bokeh import mpl",
             "p = mpl.PlotClient(username='%s', serverloc='%s', userapikey='%s')" % (username, url, userapikey)]
    return "\n".join(lines)

@bokeh_app.route('/bokeh/doc/<docid>/', methods=['GET', 'OPTIONS'])
@bokeh_app.route('/bokeh/bokehinfo/<docid>/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
@check_read_authentication_and_create_client
def get_bokeh_info(docid):
    return _get_bokeh_info(docid)

def _get_bokeh_info(docid):
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    sess = bokeh_app.backbone_storage.get_session(docid)    
    sess.load_all()
    sess.prune()
    all_models = sess._models.values()
    print("num models", len(all_models))
    all_models = sess.broadcast_attrs(all_models)
    returnval = {'plot_context_ref' : doc.plot_context_ref,
                 'docid' : docid,
                 'all_models' : all_models,
                 'apikey' : doc.apikey}
    returnval = sess.serialize(returnval)
    result = make_json(returnval,
                       headers={"Access-Control-Allow-Origin": "*"})
    return result

@bokeh_app.route('/bokeh/doc/<title>/show', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
def show_doc_by_title(title):
    bokehuser = bokeh_app.current_user()
    docs = [ doc for doc in bokehuser.docs if doc['title'] == title ]
    doc = docs[0] if len(docs) != 0 else abort(404)
    docid = doc['docid']
    return render_template('show.html', title=title, docid=docid)

@bokeh_app.route('/bokeh/doc/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
def doc_by_title():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = bokeh_app.current_user()
    docs = [doc for doc in bokehuser.docs if doc['title'] == title]
    if len(docs) == 0:
        try:
            doc = _makedoc(bokeh_app.servermodel_storage, bokehuser, title)
            docid = doc.docid
        except DataIntegrityException as e:
            return abort(409, e.message)
        jsonstring = protocol.serialize_web(bokehuser.to_public_json())
        msg = protocol.serialize_web({'msgtype' : 'docchange'})
        bokeh_app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    else:
        doc = docs[0]
        docid = doc['docid']
    return get_bokeh_info(docid)

"""need to rethink public publishing
"""
# @bokeh_app.route('/bokeh/publicbokehinfo/<docid>')
# def get_public_bokeh_info(docid):
#     doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
#     plot_context_ref = doc.plot_context_ref
#     all_models = docs.prune_and_get_valid_models(bokeh_app.servermodel_storage,
#                                                  bokeh_app.collections,
#                                                  docid)
#     public_models = [x for x in all_models if x.get('public', False)]
#     if len(public_models) == 0:
#         return False
#     all_models_json = [x.to_broadcast_json() for x in all_models]
#     returnval = {'plot_context_ref' : plot_context_ref,
#                  'docid' : docid,
#                  'all_models' : all_models_json,
#                  }
#     returnval = protocol.serialize_web(returnval)
#     #return returnval

#     return (returnval, "200",
#             {"Access-Control-Allow-Origin": "*"})


@bokeh_app.route('/bokeh/sampleerror')
def sampleerror():
    return 1 + "sdf"


def dom_embed(plot, **kwargs):
    if bokeh_app.debug:
        from continuumweb import hemlib
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(bokeh_app, slug['libs'])
        hemsource = os.path.join(bokeh_app.static_folder, "coffee")
        hem_js = hemlib.coffee_assets(hemsource, "localhost", 9294)
        hemsource = os.path.join(bokeh_app.static_folder, "vendor",
                                 "bokehjs", "coffee")
        hem_js += hemlib.coffee_assets(hemsource, "localhost", 9294)
    else:
        static_js = ['/bokeh/static/js/bokeh.js']
        hem_js = []
    plot2 = make_test_plot()
    return render_template(
        "embed.html", jsfiles=static_js, hemfiles=hem_js,
        docid=plot._session.docid, docapikey=plot._session.apikey, modelid=plot._id,
        plot2=plot2, **kwargs)

def make_test_plot():
    import numpy as np
    from bokeh.plotting import output_server, line

    N = 8000

    x = np.linspace(0, 4*np.pi, N)
    y = np.sin(x)

    output_server("line.py example")

    l = line(
        x,y, color="#0000FF",
        plot_height=300, plot_width=300,
        tools="pan,zoom,resize")
    return l
    #show()





@bokeh_app.route("/bokeh/generate_embed/<inject_type>")
def generate_embed(inject_type):
    """the following 8 functions setup embedding pages in a variety of formats

    urls with no_js don't have any of our javascript included in
    script tags.  the embed.js code is supposed to make sure the
    proper js files are sourced.  Embed.js should only donwload a new
    js file if the existing javascript code isn't in the runtime
    environment.

    static places a script tag into the html markup.

    static_double places two script tags in the dom.  This should
    still cause the bokeh js to be downloaded only once

    the rest of the urls construct a script tag with a source of the
    embed.js along with the proper attributes.

    with_delay doesn't inject until 5 seconds after pageload

    double_delay injects two separate plots, one at 3 seconds in,
        the other at 5 seconds in.

    onload injects at onload

    direct injects as soon as the script block is hit.

    Everyone one of these urls should display the same plot
    """

    plot = make_test_plot()
    delay, double_delay, onload, direct  = [False] * 4
    plot_scr = ""

    if inject_type == "delay":
        delay = True
    if inject_type == "double_delay":
        double_delay = True
    elif inject_type == "onload":
        onload = True
    elif inject_type == "direct":
        direct = True
    elif inject_type == "static":
        plot_scr = plot.create_html_snippet(server=True)
    elif inject_type == "static_double":

        plot_scr = "%s %s" % (plot.create_html_snippet(server=True),
                              plot.create_html_snippet(server=True))



    return dom_embed(
        plot, delay=delay, onload=onload,
        direct=direct,  plot_scr=plot_scr, double_delay=double_delay)


import os

@bokeh_app.route("/bokeh/embed.js")
def embed_js():
    import jinja2
    t_file = os.path.join(
        os.path.dirname(
            os.path.abspath(__file__)), "..", "..", "templates", "embed_direct.js")
    with open(t_file) as f:
        template = jinja2.Template(f.read())
        rendered = template.render(host=request.host)

        return  Response(rendered, "200",
            {'Content-Type':'application/javascript'})




