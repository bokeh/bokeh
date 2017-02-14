from PIL import Image, ImageChops

import logging
logging.getLogger('PIL.PngImagePlugin').setLevel(logging.INFO)

def image_diff(diff_path, before_path, after_path, superimpose=False):
    """ Returns the percentage of differing pixels or -1 if dimensions differ. """
    before = Image.open(before_path)
    after = Image.open(after_path)

    if before.size != after.size:
        return -1

    before = before.convert('RGBA')
    after = after.convert('RGBA')

    mask = ImageChops.difference(before, after)
    mask = mask.convert('L')
    mask = mask.point(lambda k: 0 if k == 0 else 255)

    if mask.getbbox() is None:
        return 0
    else:
        diff = mask.convert('RGB')
        if superimpose:
            diff.paste(after, mask=mask)
        else:
            diff.paste((0, 0, 255), mask=mask)
        diff.save(diff_path)

        w, h = after.size
        pixels = 0

        for v in mask.getdata():
            if v == 255:
                pixels += 1

        return float(pixels)/(w*h)*100
