import base64
from io import BytesIO
from PIL import Image, ImageChops, ImageOps, ImageDraw, ImageFont


class Screenshot(object):

    def __init__(self, item=None, request=None):
        if item:
            self.driver = getattr(item, '_driver', None)
            thing = item
        if request:
            self.driver = getattr(request.node, '_driver', None)
            thing = request
        assert self.driver is not None
        self.base_screenshot_path = self.get_screenshot_path(thing)

    @property
    def base_screenshot_as_png(self):
        try:
            with open(self.base_screenshot_path.strpath, 'rb') as f:
                screenshot = f.read()
        except IOError:
            screenshot = None
        return screenshot

    @property
    def base_screenshot(self):
        return self.base_screenshot_as_png

    @property
    def base_screenshot_as_pil_image(self):
        return self.convert_screenshot_to_pil_image(self.base_screenshot_as_png)

    @property
    def base_screenshot_as_b64(self):
        return self.convert_screenshot_to_b64(self.base_screenshot_as_pil_image)

    @property
    def current_screenshot_as_png(self):
        return self.get_current_screenshot()

    @property
    def current_screenshot(self):
        return self.current_screenshot_as_png

    @property
    def current_screenshot_as_b64(self):
        return self.convert_screenshot_to_b64(self.current_screenshot_as_png)

    @property
    def current_screenshot_as_pil_image(self):
        return self.convert_screenshot_to_pil_image(self.current_screenshot_as_png)

    def get_current_screenshot(self):
        return self.driver.get_screenshot_as_png()

    def set_base_screenshot(self):
        # Saves screenshot to file
        self.driver.get_screenshot_as_file(self.base_screenshot_path.strpath)

    def is_valid(self):
        return self.base_screenshot == self.current_screenshot

    def get_diff(self):
        diff = ImageChops.difference(
            self.base_screenshot_as_pil_image,
            self.current_screenshot_as_pil_image
        )
        # Pretty up the diff image and add a text note
        try:
            diff = ImageOps.invert(diff)
            diff = diff.convert('L')
            draw = ImageDraw.Draw(diff)
            font = ImageFont.truetype("Arial.ttf", 36)
            draw.text((20, 20), "Expected (left)  --- Diff ---  Actual (right)", (0, 0, 0), font=font)
            del draw
        except OSError:
            # It's ok if we can't do this.
            pass
        return self.convert_screenshot_to_b64(diff)

    @classmethod
    def get_screenshot_path(cls, item):
        # Get the path for the screenshot based on the test name
        #
        # item can be item or request
        #
        screenshot_dir = item.fspath.dirpath().join('screenshots')
        screenshot_dir.ensure_dir()
        test_file = item.fspath.basename.split('.py')[0]
        test_name = item.function.__name__
        base_screenshot_path = screenshot_dir.join(test_file + '__' + test_name + '__base.png')
        return base_screenshot_path

    @classmethod
    def convert_screenshot_to_b64(cls, img):
        return base64.b64encode(img._repr_png_()).decode("utf-8")  # noqa

    @classmethod
    def convert_screenshot_to_pil_image(cls, img):
        return Image.open(BytesIO(img)).convert('RGB')
