from __future__ import print_function
from werkzeug.utils import secure_filename
import json
from os.path import join, exists
from os import makedirs, remove
import shelve
import uuid
import posixpath
from .models import user
from .models import UnauthorizedException
from .app import bokeh_app
from ..exceptions import DataIntegrityException
from ..utils import encode_utf8, decode_utf8
from ..transforms import line_downsample
from ..transforms import image_downsample
from ..transforms import ar_downsample
import logging
import numpy as np

logger = logging.getLogger(__name__)


class AbstractServerModelStorage(object):
    """Storage class for server side models (non backbone, that would be
    document and user classes)
    """
    def get(self, key):
        """given a key returns json objects"""
        raise NotImplementedError

    def set(self, key, val):
        """given a key and a json object, saves it"""
        raise NotImplementedError

    def create(self, key, val):
        """given a key and a json object, saves it
        differs from set because this method should check
        to make sure the object doesn't already exist
        """
        raise NotImplementedError

class RedisServerModelStorage(object):
    def __init__(self, redisconn):
        self.redisconn = redisconn

    def get(self, key):
        data = self.redisconn.get(key)
        if data is None:
            return None
        attrs = json.loads(data.decode('utf-8'))
        return attrs

    def set(self, key, val):
        self.redisconn.set(key, json.dumps(val))

    def create(self, key, val):
        with self.redisconn.pipeline() as pipe:
            pipe.watch(key)
            pipe.multi()
            if self.redisconn.exists(key):
                raise DataIntegrityException("%s already exists" % key)
            else:
                pipe.set(key, json.dumps(val))
            pipe.execute()

class InMemoryServerModelStorage(object):
    def __init__(self):
        self._data = {}

    def get(self, key):
        data = self._data.get(key, None)
        if data is None:
            return None
        attrs = json.loads(decode_utf8(data))
        return attrs

    def set(self, key, val):
        self._data[key] = json.dumps(val)

    def create(self, key, val):
        if key in self._data:
            raise DataIntegrityException("%s already exists" % key)
        self._data[key] = json.dumps(val)

class ShelveServerModelStorage(object):

    def get(self, key):
        _data = shelve.open('bokeh.server')
        key = encode_utf8(key)
        data = _data.get(key, None)
        if data is None:
            return None
        attrs = json.loads(decode_utf8(data))
        _data.close()
        return attrs

    def set(self, key, val):
        _data = shelve.open('bokeh.server')
        key = encode_utf8(key)
        _data[key] = json.dumps(val)
        _data.close()

    def create(self, key, val):
        _data = shelve.open('bokeh.server')
        if key in _data:
            raise DataIntegrityException("%s already exists" % key)
        _data[key] = json.dumps(val)
        _data.close()

class AbstractAuthentication(object):
    def current_user_name(self):
        """obtain current user name from the current request
        current request is obtained from flask request thread local
        object
        """
        raise NotImplementedError
    def login(self, username):
        """login the user, sets whatever request information is necessary
        (usually, session['username'] = username)
        """
        raise NotImplementedError

    def logout(self):
        """logs out the user, sets whatever request information is necessary
        usually, session.pop('username')
        """
        raise NotImplementedError

    def current_user(self):
        """returns bokeh User object from self.current_user_name
        """
        username = self.current_user_name()
        bokehuser = user.User.load(bokeh_app.servermodel_storage, username)
        return bokehuser

    def login_get(self):
        """custom login view
        """
        raise NotImplementedError

    def login_post(self):
        """custom login submission. Request form will have
        username, password, and possibly an api field.
        api indicates that we are
        submitting via python, and we should try to return error
        codes rather than flash messages
        """
        raise NotImplementedError

    def login_from_apikey(self):
        """login URL using apikey.  This is usually generated
        by the python client
        """
        raise NotImplementedError

    def register_get(self):
        """custom register view
        """
        raise NotImplementedError

    def register_post(self):
        """custom register submission
        request form will have username, password, password_confirm,
        and possibly an api field. api indicates that we are
        submitting via python, and we should try to return error
        codes rather than flash messages
        """
        raise NotImplementedError

from flask import (request, session, abort,
                   flash, redirect, url_for, render_template,
                   jsonify
                   )

class SingleUserAuthentication(AbstractAuthentication):
    def current_user_name(self):
        return "defaultuser"

    def current_user(self):
        """returns bokeh User object matching defaultuser
        if the user does not exist, one will be created
        """
        username = self.current_user_name()
        bokehuser = user.User.load(bokeh_app.servermodel_storage, username)
        if bokehuser is not None:
            return bokehuser
        bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                                  str(uuid.uuid4()), apikey='nokey', docs=[])
        return bokehuser

class MultiUserAuthentication(AbstractAuthentication):

    def login(self, username):
        session['username'] = username

    def print_connection_info(self, bokehuser):
        logger.info("connect using the following")
        command = "output_server(docname, username='%s', userapikey='%s')"
        command = command % (bokehuser.username, bokehuser.apikey)
        logger.info(command)

    def current_user_name(self):
        # users can be authenticated by logging in (setting the session)
        # or by setting fields in the http header (api keys, etc..)
        username =  session.get('username', None)
        if username:
            return username
        else:
            # check for auth via apis and headers
            bokehuser = user.apiuser_from_request(bokeh_app, request)
            if bokehuser:
                return bokehuser.username

    def register_get(self):
        return render_template("register.html", title="Register")

    def login_get(self):
        return render_template("login.html", title="Login")

    def register_post_api(self):
        username = request.values['username']
        password = request.values['password']
        try:
            bokehuser = user.new_user(
                bokeh_app.servermodel_storage, username, password
                )
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            return jsonify(status=False,
                           error="user already exists")
        return jsonify(status=True,
                       userapikey=bokehuser.apikey
                       )

    def register_post(self):
        if request.values.get('api', None):
            return self.register_post_api()
        username = request.values['username']
        password = request.values['password']
        password_confirm = request.values['password_confirm']
        if password != password_confirm:
            flash("password and confirmation do not match")
            return redirect(url_for('.register_get'))
        try:
            bokehuser = user.new_user(
                bokeh_app.servermodel_storage, username, password
                )
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            flash("user already exists")
            return redirect(url_for('.register_get'))
        return redirect(url_for(".index"))

    def login_post_api(self):
        username = request.values['username']
        password = request.values['password']
        try:
            bokehuser = user.auth_user(bokeh_app.servermodel_storage,
                                       username,
                                       password)
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            return jsonify(status=False,
                           error="incorrect login ")
        return jsonify(status=True,
                       userapikey=bokehuser.apikey
                       )

    def login_post(self):
        if request.values.get('api', None):
            return self.login_post_api()
        username = request.values['username']
        password = request.values['password']
        try:
            bokehuser = user.auth_user(bokeh_app.servermodel_storage,
                                       username,
                                       password=password)
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            flash("incorrect login exists")
            return redirect(url_for('.login_get'))
        return redirect(url_for(".index"))

    def login_from_apikey(self):
        username = request.values.get('username')
        apikey = request.values.get('userapikey')
        try:
            bokehuser = user.auth_user(bokeh_app.servermodel_storage,
                                       username,
                                       apikey=apikey)

            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            flash("incorrect login")
            return redirect(url_for('.login_get'))
        return redirect(url_for(".index"))
    def logout(self):
        session.pop('username', None)
        return redirect(url_for(".index"))

class AbstractDataBackend(object):
    """These functions take a request_username parameter,
    which is the identify of the requester.
    
    Some also take request_docid, which is the docid of the 
    requester.  You only need one or the other.  pass None for the
    one you don't want to set
    
    IT is up to the implementation to handle permissions

    many functions take a data_url.  It is assumed that
    the implementation can retrieve the dataset owner from
    the dataset_url 
    """
    def list_data_sources(self, request_username, username):
        """
        request_username is the identity of the requester

        list data sources for username
        
        should probably return an error if request_username and username
        don't match, but that is delegated to the backend, which can
        do something else if it chooses

        return data_source urls as list, 
        ["/foo/bar", "foo/bar/baz"]
        """
        raise NotImplementedError
    
    def get_permissons(self, request_username, data_url):
        """return permissions as JSON
        rw_users : [list of users], or 'all'
        r_users: [list of users], or 'all'
        rw_docs : [list of doc_ids], or 'all'
        r_docs: [list of doc_ids], or 'all'
        """
        raise NotImplementedError

    def modify_permissions(self, request_username, data_url, permissions_json):
        """permissions_json is a json object like that which is 
        returned by get_permissions
        """
        
    #parameters for this are undefined at the moment
    def get_data(self, request_username, datasource, parameters, plot_state): 
        raise NotImplementedError        
    
    def append_data(self, request_username, request_docid, data_url, datafile):
        raise NotImplementedError


def user_url_root(data_directory, username):
    user_directory = safe_url_join(data_directory, username)
    user_directory = posixpath.abspath(user_directory)
    if posixpath.basename(user_directory) != username:
        raise IOError('security error')
    return user_directory
    
def safe_url_join(base_path, paths):
    proposed_path = posixpath.realpath(posixpath.join(base_path, *paths))
    if not proposed_path.startswith(base_path):
        raise IOError('security error')
    return proposed_path

def safe_user_url_join(data_directory, username, path):
    user_path = user_url_root(data_directory, username)
    return safe_url_join(user_path, path)


        
class FunctionBackend(AbstractDataBackend):
    """ Collection of datasets defined by functions.  
        Datasets are accessed by a URL starting with 'fn://'
    """
    gauss = {'oneA': np.random.randn(1000), 
             'oneB': np.random.randn(1000), 
             'hundredA': np.random.randn(1000)*100,
             'hundredB': np.random.randn(1000)*100}
    
    uniform = {'oneA': np.random.rand(1000), 
               'oneB': np.random.rand(1000), 
               'hundredA': np.random.rand(1000)*100,
               'hundredB': np.random.rand(1000)*100}

    pyramid = {'x': [1, 1, 1, 2, 2, 2, 2, 1, 1, 1],
               'y': [1, 1, 1, 2, 2, 2, 2, 1, 1, 1]}
    
    def __init__(self):
      N = 1000
      x = np.linspace(0, 10, N)
      y = np.linspace(0, 10, N)
      xx, yy = np.meshgrid(x, y)
      self.sin_cos = np.sin(xx)*np.cos(yy)

    def get_dataset(self, dataset):
      """Get a known dataset by name.  The dataset may start with fn://, but does not need to."""

      if (dataset.startswith("fn://")):
        dataset = dataset[5:]

      if dataset in self.list_data_sources():
        return self.__getattribute__(dataset)
      else:
        raise ValueError("Unknown (function-defined) dataset '{}'".format(dataset))

    def list_data_sources(self, *args):
      return ["sin_cos", "gauss","uniform"]
    
    def get_data(self, request_username, datasource, parameters, plot_state): 
        data_url = datasource.data_url
        resample_op = datasource.transform['resample']

        dataset = self.get_dataset(data_url)
        
        if resample_op == 'abstract rendering':
          result = ar_downsample.downsample(dataset, datasource.transform, plot_state)
          return result
        else:
          raise ValueError("Unknown resample op '{}'".format(resample_op))
        
    

class HDF5DataBackend(AbstractDataBackend):
    """Everything here is world readable, but only writeable by the user
    """

    def __init__(self, data_directory):
        self.data_directory = data_directory
        try:
            from arraymanagement.client import ArrayClient
            self.client = ArrayClient(self.data_directory, 
                                      configname="bokeh.server.hdf5_backend_config")
        except Exception as e:
            logger.exception(e)
            logger.info("error importing arraymanagement")
            logger.info("install arraymanagement from https://github.com/continuumio/ArrayManagement")
            logger.info("or procede without remote data capabilities")
            
    def write(self, request_username, request_filename, fileobj):
        username_path = secure_filename(request_username)
        fpath = secure_filename(request_filename)
        target_dir = join(self.data_directory, username_path)
        if not exists(target_dir):
            makedirs(target_dir)
        path = join(self.data_directory, username_path, fpath)
        if exists(path):
            remove(path)
        fileobj.save(path)
        return posixpath.join("/", username_path, fpath)
        
    def list_data_sources(self, request_username, username):
        return self.client[username].descendant_urls(ignore_groups=True)

    def line1d_downsample(self, request_username, data_url, data_parameters):
        dataset = self.client[data_url]
        (primary_column, domain_name, columns,
         domain_limit, range_limit, domain_resolution, input_params) = data_parameters
       
        method = input_params['method']

        if domain_limit == 'auto':
            domain = dataset.select(columns=[domain_name])[domain_name]
            domain_limit = [domain.min(), domain.max()]
            if domain.dtype.kind == "M":
                domain_limit = np.array(domain_limit).astype('datetime64[ns]')
        else:
            sample = dataset.select(start=0, stop=1)
            if sample[domain_name].dtype.kind == 'M':
                #FIXME we need a conversion that won't truncate to ms
                domain_limit = np.array(domain_limit).astype('datetime64[ms]')
        all_columns = columns[:]
        if domain_name not in columns:
            all_columns.append(domain_name)
        #some type coercion
        result = dataset.select(where=[(domain_name, ">=", domain_limit[0]),
                                       (domain_name, "<=", domain_limit[1])],
                                columns=all_columns)

        result = line_downsample.downsample(result.to_records(),
                                            domain_name,
                                            primary_column,
                                            domain_limit,
                                            range_limit,
                                            domain_resolution,
                                            method)

        return result;


    def heatmap_downsample(self, request_username, data_url, 
                           parameters, plot_state):
        dataset = self.client[data_url].node
        (global_x_range, global_y_range, 
         global_offset_x, global_offset_y,
         index_slice, data_slice, 
         transpose, input_params) = parameters

        x_resolution = plot_state['screen_x'].end - plot_state['screen_x'].start
        y_resolution = plot_state['screen_y'].end - plot_state['screen_y'].start

        if data_slice:
            #not supported for z yet...
            pass
        elif index_slice:
            print ('index_slice', index_slice)
            index_slices = [slice(None) if x is None else x for x in index_slice]
            dataset = dataset[tuple(index_slices)]
        if transpose:
            dataset = dataset[:].T
            #HACK
            dataset = dataset[::-1]
        image_x_axis = np.linspace(global_x_range[0],
                                   global_x_range[1],
                                   dataset.shape[1])
        image_y_axis = np.linspace(global_y_range[0],
                                   global_y_range[1],
                                   dataset.shape[0])
        result = image_downsample.downsample(dataset, image_x_axis, image_y_axis,
                                             plot_state['data_x'], plot_state['data_y'], x_resolution,
                                             y_resolution)
        output = {}
        output['image'] = [result['data']]
        output['x'] = [global_offset_x + result['offset_x']]
        output['y'] = [global_offset_y + result['offset_y']]
        output['dw'] = [result['dw']]
        output['dh'] = [result['dh']]
        return output

    def get_data(self, request_username, datasource, parameters, plot_state): 
        data_url = datasource.data_url
        resample_op = datasource.transform['resample']

        if resample_op == 'line1d':


            return self.line1d_downsample(
                request_username, data_url, 
                parameters)
        elif resample_op == 'heatmap':
            return self.heatmap_downsample(
                request_username, data_url, 
                parameters, plot_state)
        elif resample_op == 'abstract rendering':
          if (data_url.startswith("fn://")):
            dataset = FunctionBackend().get_dataset(data_url)
          else:
            dataset = self.client[data_url]
          result = ar_downsample.downsample(dataset, datasource.transform, plot_state)
          return result
        else:
          raise ValueError("Unknown resample op '{}'".format(resample_op))
        
