from __future__ import absolute_import, print_function


class value_to_be_present_in_datahash(object):
    """
    An expectation for checking if the given value is present in the element's data-hash
    """
    def __init__(self, element, value):
        self.element = element
        self.value = value

    def __call__(self, driver):
        data_hash = self.element.get_attribute("data-hash")
        if data_hash == self.value:
            return True
        else:
            print(data_hash)
            return False


class element_to_start_resizing(object):
    """
    An expectation for checking if an element has started resizing
    """
    def __init__(self, element):
        self.element = element
        self.previous_width = self.element.size['width']

    def __call__(self, driver):
        current_width = self.element.size['width']
        if self.previous_width != current_width:
            return True
        else:
            self.previous_width = current_width
            return False

class element_to_finish_resizing(object):
    """
    An expectation for checking if an element has finished resizing
    """
    def __init__(self, element):
        self.element = element
        self.previous_width = self.element.size['width']

    def __call__(self, driver):
        current_width = self.element.size['width']
        if self.previous_width == current_width:
            return True
        else:
            self.previous_width = current_width
            return False
