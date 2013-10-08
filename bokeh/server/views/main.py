from flask import (
    render_template, request,
    send_from_directory, make_response, abort,
    jsonify
    )
import flask
import os
import logging
import uuid
import urlparse

from ..app import app

from .. import wsmanager
from ..models import user
from ..models import docs
from ..models import convenience as mconv
from ... import protocol
from ...exceptions import DataIntegrityException
from bbauth import (check_read_authentication_and_create_client,
                    check_write_authentication_and_create_client)
from ..views import make_json
from ..crossdomain import crossdomain
from ..serverbb import RedisSession
#main pages

@app.route('/bokeh/')
def index(*unused_all, **kwargs):
    if getattr(app, "debugjs", False):
        from continuumweb import hemlib
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(app, slug['libs'])
        hem_js = hemlib.all_coffee_assets("localhost")
    else:
        static_js = ['/bokeh/static/js/application.js']
        hem_js = []
    return render_template('bokeh.html', jsfiles=static_js, hemfiles=hem_js)

@app.route('/bokeh/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/x-icon')

def _makedoc(redisconn, u, title):
    docid = str(uuid.uuid4())
    if isinstance(u, basestring):
        u = user.User.load(redisconn, u)
    sess = RedisSession(app.bb_redis, docid)
    u.add_doc(docid, title)
    doc = docs.new_doc(app, docid,
                       title, sess,
                       rw_users=[u.username])
    u.save(redisconn)
    return doc

@app.route('/bokeh/doc', methods=['POST'])
@app.route('/bokeh/doc/', methods=['POST'])
def makedoc():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = app.current_user(request)
    try:
        doc = _makedoc(app.model_redis, bokehuser, title)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = protocol.serialize_web(bokehuser.to_public_json())
    msg = protocol.serialize_web({'msgtype' : 'docchange'})
    app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    return make_json(jsonstring)

@app.route('/bokeh/doc/<docid>', methods=['delete'])
@app.route('/bokeh/doc/<docid>/', methods=['delete'])
def deletedoc(docid):
    bokehuser = app.current_user(request)
    try:
        bokehuser.remove_doc(docid)
        bokehuser.save(app.model_redis)
    except DataIntegrityException as e:
        return abort(409, e.message)
    jsonstring = protocol.serialize_web(bokehuser.to_public_json())
    msg = protocol.serialize_web({'msgtype' : 'docchange'})
    app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    return make_json(jsonstring)

@app.route('/bokeh/getdocapikey/<docid>')
def get_doc_api_key(docid):
    bokehuser = app.current_user(request)
    doc = docs.Doc.load(app.model_redis, docid)
    if mconv.can_write_from_request(doc, request, app):
        return jsonify({'apikey' : doc.apikey})
    elif mconv.can_write_from_request(doc, request, app):
        return jsonify({'readonlyapikey' : doc.readonlyapikey})
    else:
        return abort(401)

@app.route('/bokeh/userinfo/')
def get_user():
    bokehuser = app.current_user(request)
    content = protocol.serialize_web(bokehuser.to_public_json())
    write_plot_file(request.scheme + "://" + request.host)
    return make_json(content)

def _make_plot_file(username, userapikey, url):
    lines = ["from bokeh import mpl",
             "p = mpl.PlotClient(username='%s', serverloc='%s', userapikey='%s')" % (username, url, userapikey)]
    return "\n".join(lines)

def write_plot_file(url):
    bokehuser = app.current_user(request)
    codedata = _make_plot_file(bokehuser.username,
                               bokehuser.apikey,
                               url)
    app.write_plot_file(bokehuser.username, codedata)

@app.route('/bokeh/doc/<docid>/', methods=['GET', 'OPTIONS'])
@app.route('/bokeh/bokehinfo/<docid>/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
@check_read_authentication_and_create_client
def get_bokeh_info(docid):
    return _get_bokeh_info(docid)

def _get_bokeh_info(docid):
    doc = docs.Doc.load(app.model_redis, docid)
    sess = RedisSession(app.bb_redis, doc)
    sess.load()
    sess.prune()
    all_models = sess._models.values()
    print "num models", len(all_models)
    all_models = sess.broadcast_attrs(all_models)
    returnval = {'plot_context_ref' : doc.plot_context_ref,
                 'docid' : docid,
                 'all_models' : all_models,
                 'apikey' : doc.apikey}
    returnval = sess.serialize(returnval)
    result = make_json(returnval,
                       headers={"Access-Control-Allow-Origin": "*"})
    return result

@app.route('/bokeh/doc/', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", headers=['BOKEH-API-KEY', 'Continuum-Clientid'])
def doc_by_title():
    if request.json:
        title = request.json['title']
    else:
        title = request.values['title']
    bokehuser = app.current_user(request)
    docs = [doc for doc in bokehuser.docs if doc['title'] == title]
    if len(docs) == 0:
        try:
            doc = _makedoc(app.model_redis, bokehuser, title)
            docid = doc.docid
        except DataIntegrityException as e:
            return abort(409, e.message)
        jsonstring = protocol.serialize_web(bokehuser.to_public_json())
        msg = protocol.serialize_web({'msgtype' : 'docchange'})
        app.wsmanager.send("bokehuser:" + bokehuser.username, msg)
    else:
        doc = docs[0]
        docid = doc['docid']
    return get_bokeh_info(docid)

"""need to rethink public publishing
"""
# @app.route('/bokeh/publicbokehinfo/<docid>')
# def get_public_bokeh_info(docid):
#     doc = docs.Doc.load(app.model_redis, docid)
#     plot_context_ref = doc.plot_context_ref
#     all_models = docs.prune_and_get_valid_models(app.model_redis,
#                                                  app.collections,
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


@app.route('/bokeh/sampleerror')
def sampleerror():
    return 1 + "sdf"


@app.route("/bokeh/embed_test/")
def embed_test():
    """this is made to test the case where  """
    return render_template("embed_test.html")

@app.route("/bokeh/dynamic_embed_test/")
def dynamic_embed_test():
    """this is made to test the case where application.js is already
loaded, and embed.js script tags are dynamically injected"""
    if app.debug:
        from continuumweb import hemlib
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(app, slug['libs'])
        hemsource = os.path.join(app.static_folder, "coffee")
        hem_js = hemlib.coffee_assets(hemsource, "localhost", 9294)
        hemsource = os.path.join(app.static_folder, "vendor",
                                 "bokehjs", "coffee")
        hem_js += hemlib.coffee_assets(hemsource, "localhost", 9294)
    else:
        static_js = ['/bokeh/static/js/application.js']
        hem_js = []
    return render_template("dynamic_embed_test.html", jsfiles=static_js, hemfiles=hem_js)

@app.route("/bokeh/embed_with_existing_js")
def embed_with_existing_js_test():
    """this is made to test the case where application.js is already
loaded, and embed.js script tags are dynamically injected"""
    if app.debug:
        from continuumweb import hemlib
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(app, slug['libs'])
        hemsource = os.path.join(app.static_folder, "coffee")
        hem_js = hemlib.coffee_assets(hemsource, "localhost", 9294)
        hemsource = os.path.join(app.static_folder, "vendor",
                                 "bokehjs", "coffee")
        hem_js += hemlib.coffee_assets(hemsource, "localhost", 9294)
    else:
        static_js = ['/bokeh/static/js/application.js']
        hem_js = []
    return render_template("embed_with_existing_js.html", jsfiles=static_js, hemfiles=hem_js)

def dom_embed(plot, **kwargs):
    if app.debug:
        from continuumweb import hemlib
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(app, slug['libs'])
        hemsource = os.path.join(app.static_folder, "coffee")
        hem_js = hemlib.coffee_assets(hemsource, "localhost", 9294)
        hemsource = os.path.join(app.static_folder, "vendor",
                                 "bokehjs", "coffee")
        hem_js += hemlib.coffee_assets(hemsource, "localhost", 9294)
    else:
        static_js = ['/bokeh/static/js/application.js']
        hem_js = []
    return render_template(
        "embed_with_delay.html", jsfiles=static_js, hemfiles=hem_js,
        docid=plot._session.docid, docapikey=plot._session.apikey, modelid=plot._id,
        **kwargs)



@app.route("/bokeh/generate_embed_with_delay")
def generate_embed_with_delay():
    """this is made to test the case where application.js is already
loaded, and embed.js script tags are dynamically injected"""
    plot = make_plot()
    return dom_embed(plot, include_js=True, delay=True)

@app.route("/bokeh/generate_embed_with_delay_no_js")
def generate_embed_with_delay_no_js():
    """this is made to test the case where there is no bokeh js on the page, and
    after pageload, an embed.js is injected into the dom"""
    plot = make_plot()
    return dom_embed(plot, include_js=False, delay=True)


def make_plot():

    from numpy import pi, arange, sin, cos
    import numpy as np

    from bokeh.objects import (
        Plot, DataRange1d, LinearAxis, 
        ColumnDataSource, GlyphRenderer,
        PanTool, PreviewSaveTool)

    from bokeh.glyphs import Circle
    from bokeh import session

    x = arange(-2*pi, 2*pi, 0.1)
    y = sin(x)
    z = cos(x)
    widths = np.ones_like(x) * 0.02
    heights = np.ones_like(x) * 0.2

    source = ColumnDataSource(data=dict(x=x,y=y,z=z,widths=widths,
                                    heights=heights))

    xdr = DataRange1d(sources=[source.columns("x")])
    ydr = DataRange1d(sources=[source.columns("y")])

    circle = Circle(x="x", y="y", fill="red", radius=5, line_color="black")

    glyph_renderer = GlyphRenderer(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle)


    pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
    #zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))
    previewtool = PreviewSaveTool(dataranges=[xdr,ydr], dimensions=("width","height"))

    plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
                border= 80)
    xaxis = LinearAxis(plot=plot, dimension=0)
    yaxis = LinearAxis(plot=plot, dimension=1)
    #xgrid = Rule(plot=plot, dimension=0)
    #ygrid = Rule(plot=plot, dimension=1)

    plot.renderers.append(glyph_renderer)
    plot.tools = [pantool, previewtool]

    sess = session.PlotServerSession(
        username="defaultuser",
        serverloc="http://localhost:5006", userapikey="nokey")
    sess.use_doc("glyph2")
    sess.add(plot, glyph_renderer, xaxis, yaxis, # xgrid, ygrid,
             source,  xdr, ydr, pantool, previewtool)
    sess.plotcontext.children.append(plot)
    sess.plotcontext._dirty = True
    # not so nice.. but set the model doens't know
    # that we appended to children
    sess.store_all()
    return plot

@app.route("/bokeh/generate_embed_test")
def generate_embed_test():
    """this generates a new plot and uses the script inject to put it
    into a page running this repeatedly will fill up your redis DB
    quickly, but it allows quick iteration

    """
    plot = make_plot()
    if app.debug:
        from continuumweb import hemlib
        slug = hemlib.slug_json()
        static_js = hemlib.slug_libs(app, slug['libs'])
        hemsource = os.path.join(app.static_folder, "coffee")
        hem_js = hemlib.coffee_assets(hemsource, "localhost", 9294)
        hemsource = os.path.join(app.static_folder, "vendor",
                                 "bokehjs", "coffee")
        hem_js += hemlib.coffee_assets(hemsource, "localhost", 9294)
    else:
        static_js = ['/bokeh/static/js/application.js']
        hem_js = []
    return render_template("generate_embed_test.html", jsfiles=static_js, hemfiles=hem_js,
                           plot_scr=plot.script_inject())





@app.route("/bokeh/embed.js")
def embed_js():
    return (render_template("embed.js", host=request.host), "200",
            {'Content-Type':'application/javascript'})
