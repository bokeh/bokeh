''' Provide special versions of list, dict, that can be used for property
values.

Mutations to these values are detected, and the properties owning the
collection is notified of the changes.

'''
from __future__ import absolute_import, print_function

def notify_owner(func):
    ''' A decorator for mutating methods of property container classes, to
    notify a the owner that a mutating change has occurred.

    '''
    def wrapper(*args, **kwargs):
        self = args[0]
        old = self._saved_copy()
        result = func(*args, **kwargs)
        self._notify_owners(old)
        return result
    return wrapper

class PropertyValueContainer(object):
    ''' A base class for property container classes that support change
    notifications on mutating operations.

    '''
    def __init__(self, *args, **kwargs):
        self._owners = set()
        # this flag is set to True by HasProps when it wraps
        # a default value
        self._unmodified_default_value = False
        super(PropertyValueContainer, self).__init__(*args, **kwargs)

    def _register_owner(self, owner, prop):
        self._owners.add((owner, prop))

    def _unregister_owner(self, owner, prop):
        self._owners.discard((owner, prop))

    def _notify_owners(self, old):
        self._unmodified_default_value = False
        for (owner, prop) in self._owners:
            prop._notify_mutated(owner, old)

    def _saved_copy(self):
        raise RuntimeError("Subtypes must implement this to make a backup copy")

# This is supposed to override every mutating method
# on list and send change notification to the
# properties it's a value of.
class PropertyValueList(PropertyValueContainer, list):
    ''' A list property value that supports change notifications on mutating
    operations.

    '''

    def __init__(self, *args, **kwargs):
        return super(PropertyValueList, self).__init__(*args, **kwargs)

    def _saved_copy(self):
        return list(self)

    # delete x[y]
    @notify_owner
    def __delitem__(self, y):
        return super(PropertyValueList, self).__delitem__(y)

    # delete x[i:j]
    @notify_owner
    def __delslice__(self, i, j):
        return super(PropertyValueList, self).__delslice__(i, j)

    # x += y
    @notify_owner
    def __iadd__(self, y):
        return super(PropertyValueList, self).__iadd__(y)

    # x *= y
    @notify_owner
    def __imul__(self, y):
        return super(PropertyValueList, self).__imul__(y)

    # x[i] = y
    @notify_owner
    def __setitem__(self, i, y):
        return super(PropertyValueList, self).__setitem__(i, y)

    # x[i:j] = y
    @notify_owner
    def __setslice__(self, i, j, y):
        return super(PropertyValueList, self).__setslice__(i, j, y)

    @notify_owner
    def append(self, obj):
        return super(PropertyValueList, self).append(obj)

    @notify_owner
    def extend(self, iterable):
        return super(PropertyValueList, self).extend(iterable)

    @notify_owner
    def insert(self, index, obj):
        return super(PropertyValueList, self).insert(index, obj)

    @notify_owner
    def pop(self, index=-1):
        return super(PropertyValueList, self).pop(index)

    @notify_owner
    def remove(self, obj):
        return super(PropertyValueList, self).remove(obj)

    @notify_owner
    def reverse(self):
        return super(PropertyValueList, self).reverse()

    @notify_owner
    def sort(self, **kwargs):
        return super(PropertyValueList, self).sort(**kwargs)

class PropertyValueDict(PropertyValueContainer, dict):
    ''' A dict property value that supports change notifications on mutating
    opertations.

    '''
    def __init__(self, *args, **kwargs):
        return super(PropertyValueDict, self).__init__(*args, **kwargs)

    def _saved_copy(self):
        return dict(self)

    # delete x[y]
    @notify_owner
    def __delitem__(self, y):
        return super(PropertyValueDict, self).__delitem__(y)

    # x[i] = y
    @notify_owner
    def __setitem__(self, i, y):
        return super(PropertyValueDict, self).__setitem__(i, y)

    @notify_owner
    def clear(self):
        return super(PropertyValueDict, self).clear()

    @notify_owner
    def pop(self, *args):
        return super(PropertyValueDict, self).pop(*args)

    @notify_owner
    def popitem(self):
        return super(PropertyValueDict, self).popitem()

    @notify_owner
    def setdefault(self, *args):
        return super(PropertyValueDict, self).setdefault(*args)

    @notify_owner
    def update(self, *args, **kwargs):
        return super(PropertyValueDict, self).update(*args, **kwargs)

