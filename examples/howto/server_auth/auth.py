import tornado
from tornado.web import RequestHandler

# could also define async_get_user
def get_user(request_handler):
    return request_handler.get_cookie("user")

# could also define get_login_url func (but give up LoginHandler)
login_url = "/login"

# optional login page at login_url
class LoginHandler(RequestHandler):

    def get(self):
        try:
            errormessage = self.get_argument("error")
        except:
            errormessage = ""
        self.render("login.html", errormessage=errormessage)

    def check_permission(self, password, username):
        if username == "bokeh" and password == "bokeh":
            return True
        return False

    def post(self):
        username = self.get_argument("username", "")
        password = self.get_argument("password", "")
        auth = self.check_permission(password, username)
        if auth:
            self.set_current_user(username)
            self.redirect(self.get_argument("next", u"/"))
        else:
            error_msg = u"?error=" + tornado.escape.url_escape("Login incorrect")
            self.redirect(login_url + error_msg)

    def set_current_user(self, user):
        if user:
            self.set_cookie("user", tornado.escape.json_encode(user))
        else:
            self.clear_cookie("user")

# could also define get_login_url func (but give up LogoutHandler)
logout_url = "/logout"

# optional logout handler at logout_url
class LogoutHandler(RequestHandler):

    def get(self):
        self.clear_cookie("user")
        self.redirect(self.get_argument("next", "/"))
