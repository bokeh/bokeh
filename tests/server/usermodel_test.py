from cdx.app import app
import time
import unittest
import mock
import gevent
import test_utils
import redis
import cdx.redisutils as redisutils
import cdx.bbmodel as bbmodel
import cdx.models.user as user
import cdx.models as models
import requests

frontaddr = "tcp://127.0.0.1:6000"

class TestUser(test_utils.CDXServerTestCase):
    def setUp(self):
        super(TestUser, self).setUp()
        self.client = app.model_redis

    def test_cant_create_twice(self):
        model = user.new_user(self.client, 'test@test.com', 'mypassword',
                              docs=[1,2,3])
        self.assertRaises(models.UnauthorizedException, user.new_user,
                          self.client, 'test@test.com', 'mypassword')
        
    def test_auth_user(self):
        self.assertRaises(models.UnauthorizedException,
                          user.auth_user,
                          self.client, 'test@test.com', 'mypassword')
        model = user.new_user(self.client, 'test@test.com', 'mypassword')
        assert model.username == 'test@test.com'
        model = user.auth_user(self.client, 'test@test.com', 'mypassword')
        self.assertRaises(models.UnauthorizedException, user.auth_user,
                          self.client, 'test@test.com', 'wrongpassword')
        
            
# class TestUserModelWeb(unittest.TestCase):
#     def setUp(self):
#         maincontroller.prepare_app(frontaddr, timeout=0.1)        
#         self.servert = gevent.spawn(maincontroller.start_app)
#         self.redisproc = redisutils.RedisProcess(6379, '/tmp', save=False)
#         time.sleep(1.0)
        
#     def tearDown(self):
#         maincontroller.shutdown_app()
#         self.servert.kill()
#         self.redisproc.close()        
#         time.sleep(1.0)
        
#     def test_invalid_login(self):
#         s = requests.session()
#         response = s.post('http://localhost:5000/login',
#                           data={'email' : 'test@test.com',
#                                 'password' : 'mypassword'})
#         #invalid login
#         assert response.status_code == 401
#         assert s.get('http://localhost:5000/authtest').content == 'WRONG'

#     def test_incorrect_login(self):
#         s = requests.session()
#         response = s.post('http://localhost:5000/register',
#                           data={'email' : 'test@test.com',
#                                 'password' : 'mypassword'})
#         assert response.status_code != 401
#         s = requests.session()        
#         response = s.post('http://localhost:5000/login',
#                           data={'email' : 'test@test.com',
#                                 'password' : 'wrong'})
#         #invalid login
#         assert response.status_code == 401
#         assert s.get('http://localhost:5000/authtest').content == 'WRONG'
#     def test_duplicate_registration(self):
#         s = requests.session()
#         response = s.post('http://localhost:5000/register',
#                           data={'email' : 'test@test.com',
#                                 'password' : 'mypassword'})
#         assert response.status_code != 401
#         s = requests.session()        
#         response = s.post('http://localhost:5000/register',
#                           data={'email' : 'test@test.com',
#                                 'password' : 'mypassword'})
#         #invalid login
#         assert response.status_code == 401
#         assert s.get('http://localhost:5000/authtest').content == 'WRONG'

#     def test_correct_login(self):
#         s = requests.session()
#         response = s.post('http://localhost:5000/register',
#                           data={'email' : 'test@test.com',
#                                 'password' : 'mypassword'})
#         assert response.status_code != 401
#         assert s.get('http://localhost:5000/authtest').content == 'test@test.com'
#         s = requests.session()
#         response = s.post('http://localhost:5000/login',
#                           data={'email' : 'test@test.com',
#                                 'password' : 'mypassword'})
#         assert s.get('http://localhost:5000/authtest').content == 'test@test.com'        
#     def test_logout(self):
#         s = requests.session()
#         response = s.post('http://localhost:5000/register',
#                           data={'email' : 'test@test.com',
#                                 'password' : 'mypassword'})
#         assert response.status_code != 401
#         assert s.get('http://localhost:5000/authtest').content == 'test@test.com'
#         s.get('http://localhost:5000/logout')
#         s.get('http://localhost:5000/logout')        
#         assert s.get('http://localhost:5000/authtest').content == 'WRONG'
