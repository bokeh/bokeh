// Copyright 2012 Mauricio Santos. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//
// Some documentation is borrowed from the official Java API
// as it serves the same porpose.

/**
 * @namespace Top level namespace for Buckets, a JavaScript data structure library.
 */
var buckets = {};

/**
 * Default function to compare element order.
 * @function
 * @private
 */
buckets.defaultCompare = function(a, b) {
    if (a < b) {
        return - 1;
    } else if (a === b) {
        return 0;
    } else {
        return 1;
    }
};
/**
 * Default function to test equality.
 * @function
 * @private
 */
buckets.defaultEquals = function(a, b) {
    return a === b;
};

/**
 * Default function to convert an object to a string.
 * @function
 * @private
 */
buckets.defaultToString = function(item) {
    if (item === null) {
        return 'BUCKETS_NULL';
    } else if (buckets.isUndefined(item)) {
        return 'BUCKETS_UNDEFINED';
    } else if (buckets.isString(item)) {
        return item;
    } else {
        return item.toString();
    }
};

/**
 * Checks if the given argument is a function.
 * @function
 * @private
 */
buckets.isFunction = function(func) {
    return (typeof func) === 'function';
};

/**
 * Checks if the given argument is undefined.
 * @function
 * @private
 */
buckets.isUndefined = function(obj) {
    return (typeof obj) === 'undefined';
};

/**
 * Checks if the given argument is a string.
 * @function
 * @private
 */
buckets.isString = function(obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
};

/**
 * Reverses a compare function.
 * @function
 * @private
 */
buckets.reverseCompareFunction = function(compareFunction) {
    if (!buckets.isFunction(compareFunction)) {
        return function(a, b) {
            if (a < b) {
                return 1;
            } else if (a === b) {
                return 0;
            } else {
                return - 1;
            }
        };
    } else {
        return function(d, v) {
            return compareFunction(d, v) * -1;
        };
    }
};

/**
 * Returns an equal function given a compare function.
 * @function
 * @private
 */
buckets.compareToEquals = function(compareFunction) {
    return function(a, b) {
        return compareFunction(a, b) === 0;
    };
};

/**
 * @namespace Contains various functions for manipulating arrays.
 */
buckets.arrays = {};

/**
 * Returns the position of the first occurrence of the specified item
 * within the specified array.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the position of the first occurrence of the specified element
 * within the specified array, or -1 if not found.
 */
buckets.arrays.indexOf = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    for (var i = 0; i < length; i++) {
        if (equals(array[i], item)) {
            return i;
        }
    }
    return - 1;
};

/**
 * Returns the position of the last occurrence of the specified element
 * within the specified array.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the position of the last occurrence of the specified element
 * within the specified array or -1 if not found.
 */
buckets.arrays.lastIndexOf = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    for (var i = length - 1; i >= 0; i--) {
        if (equals(array[i], item)) {
            return i;
        }
    }
    return - 1;
};

/**
 * Returns true if the specified array contains the specified element.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function to 
 * check equality between 2 elements.
 * @return {boolean} true if the specified array contains the specified element.
 */
buckets.arrays.contains = function(array, item, equalsFunction) {
    return buckets.arrays.indexOf(array, item, equalsFunction) >= 0;
};


/**
 * Removes the first ocurrence of the specified element from the specified array.
 * @param {*} array the array in which to search element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function to 
 * check equality between 2 elements.
 * @return {boolean} true if the array changed after this call.
 */
buckets.arrays.remove = function(array, item, equalsFunction) {
    var index = buckets.arrays.indexOf(array, item, equalsFunction);
    if (index < 0) {
        return false;
    }
    array.splice(index, 1);
    return true;
};

/**
 * Returns the number of elements in the specified array equal
 * to the specified object.
 * @param {Array} array the array in which to determine the frequency of the element.
 * @param {Object} item the element whose frequency is to be determined.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the number of elements in the specified array 
 * equal to the specified object.
 */
buckets.arrays.frequency = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    var freq = 0;
    for (var i = 0; i < length; i++) {
        if (equals(array[i], item)) {
            freq++;
        }
    }
    return freq;
};

/**
 * Returns true if the two specified arrays are equal to one another.
 * Two arrays are considered equal if both arrays contain the same number
 * of elements, and all corresponding pairs of elements in the two 
 * arrays are equal and are in the same order. 
 * @param {Array} array1 one array to be tested for equality.
 * @param {Array} array2 the other array to be tested for equality.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between elemements in the arrays.
 * @return {boolean} true if the two arrays are equal
 */
buckets.arrays.equals = function(array1, array2, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;

    if (array1.length !== array2.length) {
        return false;
    }
    var length = array1.length;
    for (var i = 0; i < length; i++) {
        if (!equals(array1[i], array2[i])) {
            return false;
        }
    }
    return true;
};

/**
 * Returns shallow a copy of the specified array.
 * @param {*} array the array to copy.
 * @return {Array} a copy of the specified array
 */
buckets.arrays.copy = function(array) {
    return array.concat();
};

/**
 * Swaps the elements at the specified positions in the specified array.
 * @param {Array} array The array in which to swap elements.
 * @param {number} i the index of one element to be swapped.
 * @param {number} j the index of the other element to be swapped.
 * @return {boolean} true if the array is defined and the indexes are valid.
 */
buckets.arrays.swap = function(array, i, j) {
    if (i < 0 || i >= array.length || j < 0 || j >= array.length) {
        return false;
    }
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    return true;
};

/**
 * Executes the provided function once for each element present in this array 
 * starting from index 0 to length - 1.
 * @param {Array} array The array in which to iterate.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.arrays.forEach = function(array, callback) {
   var lenght = array.length;
   for (var i=0; i < lenght; i++) {
   		if(callback(array[i])===false){
			return;
		}
   }	 
};

/**
 * Creates an empty Linked List.
 * @class A linked list is a data structure consisting of a group of nodes
 * which together represent a sequence.
 * @constructor
 */
buckets.LinkedList = function() {

    /**
     * First node in the list
     * @type {Object}
     * @private
     */
    this.firstNode = null;

    /**
     * Last node in the list
     * @type {Object}
     * @private
     */
    this.lastNode = null;

    /**
     * Number of elements in the list
     * @type {number}
     * @private
     */
    this.nElements = 0;
};


/**
 * Adds an element to this list.
 * @param {Object} item element to be added.
 * @param {number=} index optional index to add the element. If no index is specified
 * the element is added to the end of this list.
 * @return {boolean} true if the element was added or false if the index is invalid
 * or if the element is undefined.
 */
buckets.LinkedList.prototype.add = function(item, index) {

    if (buckets.isUndefined(index)) {
        index = this.nElements;
    }
    if (index < 0 || index > this.nElements || buckets.isUndefined(item)) {
        return false;
    }
    var newNode = this.createNode(item);
    if (this.nElements === 0) {
        // First node in the list.
        this.firstNode = newNode;
        this.lastNode = newNode;
    } else if (index === this.nElements) {
        // Insert at the end.
        this.lastNode.next = newNode;
        this.lastNode = newNode;
    } else if (index === 0) {
        // Change first node.
        newNode.next = this.firstNode;
        this.firstNode = newNode;
    } else {
        var prev = this.nodeAtIndex(index - 1);
        newNode.next = prev.next;
        prev.next = newNode;
    }
    this.nElements++;
    return true;
};


/**
 * Returns the first element in this list.
 * @return {*} the first element of the list or undefined if the list is
 * empty.
 */
buckets.LinkedList.prototype.first = function() {

    if (this.firstNode !== null) {
        return this.firstNode.element;
    }
    return undefined;
};

/**
 * Returns the last element in this list.
 * @return {*} the last element in the list or undefined if the list is
 * empty.
 */
buckets.LinkedList.prototype.last = function() {

    if (this.lastNode !== null) {
        return this.lastNode.element;
    }
    return undefined;
};


/**
 * Returns the element at the specified position in this list.
 * @param {number} index desired index.
 * @return {*} the element at the given index or undefined if the index is
 * out of bounds.
 */
buckets.LinkedList.prototype.elementAtIndex = function(index) {

    var node = this.nodeAtIndex(index);
    if (node === null) {
        return undefined;
    }
    return node.element;
};

/**
 * Returns the index in this list of the first occurrence of the
 * specified element, or -1 if the List does not contain this element.
 * <p>If the elements inside this list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction Optional
 * function used to check if two elements are equal.
 * @return {number} the index in this list of the first occurrence
 * of the specified element, or -1 if this list does not contain the
 * element.
 */
buckets.LinkedList.prototype.indexOf = function(item, equalsFunction) {

    var equalsF = equalsFunction || buckets.defaultEquals;
    if (buckets.isUndefined(item)) {
        return - 1;
    }
    var currentNode = this.firstNode;
    var index = 0;
    while (currentNode !== null) {
        if (equalsF(currentNode.element, item)) {
            return index;
        }
        index++;
        currentNode = currentNode.next;
    }
    return - 1;
};

/**
 * Returns true if this list contains the specified element.
 * <p>If the elements inside the list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction Optional
 * function used to check if two elements are equal.
 * @return {boolean} true if this list contains the specified element, false
 * otherwise.
 */
buckets.LinkedList.prototype.contains = function(item, equalsFunction) {
    return (this.indexOf(item, equalsFunction) >= 0);
};

/**
 * Removes the first occurrence of the specified element in this list.
 * <p>If the elements inside the list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to be removed from this list, if present.
 * @return {boolean} true if the list contained the specified element.
 */
buckets.LinkedList.prototype.remove = function(item, equalsFunction) {
    var equalsF = equalsFunction || buckets.defaultEquals;
    if (this.nElements < 1 || buckets.isUndefined(item)) {
        return false;
    }
    var previous = null;
    var currentNode = this.firstNode;
    while (currentNode !== null) {

        if (equalsF(currentNode.element, item)) {

            if (currentNode === this.firstNode) {
                this.firstNode = this.firstNode.next;
                if (currentNode === this.lastNode) {
                    this.lastNode = null;
                }
            } else if (currentNode === this.lastNode) {
                this.lastNode = previous;
                previous.next = currentNode.next;
                currentNode.next = null;
            } else {
                previous.next = currentNode.next;
                currentNode.next = null;
            }
            this.nElements--;
            return true;
        }
        previous = currentNode;
        currentNode = currentNode.next;
    }
    return false;
};

/**
 * Removes all of the elements from this list.
 */
buckets.LinkedList.prototype.clear = function() {
    this.firstNode = null;
    this.lastNode = null;
    this.nElements = 0;
};

/**
 * Returns true if this list is equal to the given list.
 * Two lists are equal if they have the same elements in the same order.
 * @param {buckets.LinkedList} other the other list.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function used to check if two elements are equal. If the elements in the lists
 * are custom objects you should provide a function, otherwise the
 * the === operator is used to check equality between elements.
 * @return {boolean} true if this list is equal to the given list.
 */
buckets.LinkedList.prototype.equals = function(other, equalsFunction) {
    var eqF = equalsFunction || buckets.defaultEquals;
    if (! (other instanceof buckets.LinkedList)) {
        return false;
    }
    if (this.size() !== other.size()) {
        return false;
    }
    return this.equalsAux(this.firstNode, other.firstNode, eqF);
};

/**
 * @private
 */
buckets.LinkedList.prototype.equalsAux = function(n1, n2, eqF) {
    while (n1 !== null) {
        if (!eqF(n1.element, n2.element)) {
            return false;
        }
        n1 = n1.next;
        n2 = n2.next;
    }
    return true;
};

/**
 * Removes the element at the specified position in this list.
 * @param {number} index given index.
 * @return {*} removed element or undefined if the index is out of bounds.
 */
buckets.LinkedList.prototype.removeElementAtIndex = function(index) {

    if (index < 0 || index >= this.nElements) {
        return undefined;
    }
    var element;
    if (this.nElements === 1) {
        //First node in the list.
        element = this.firstNode.element;
        this.firstNode = null;
        this.lastNode = null;
    } else {
        var previous = this.nodeAtIndex(index - 1);
        if (previous === null) {
            element = this.firstNode.element;
            this.firstNode = this.firstNode.next;
        } else if (previous.next === this.lastNode) {
            element = this.lastNode.element;
            this.lastNode = previous;
        }
        if (previous !== null) {
            element = previous.next.element;
            previous.next = previous.next.next;
        }
    }
    this.nElements--;
    return element;
};

/**
 * Executes the provided function once for each element present in this list in order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.LinkedList.prototype.forEach = function(callback) {
    var currentNode = this.firstNode;
    while (currentNode !== null) {
        if (callback(currentNode.element) === false) {
            break;
        }
        currentNode = currentNode.next;
    }
};

/**
 * Reverses the order of the elements in this linked list (makes the last 
 * element first, and the first element last).
 */
buckets.LinkedList.prototype.reverse = function() {
    var previous = null;
    var current = this.firstNode;
    var temp = null;
    while (current !== null) {
        temp = current.next;
        current.next = previous;
        previous = current;
        current = temp;
    }
    temp = this.firstNode;
    this.firstNode = this.lastNode;
    this.lastNode = temp;
};


/**
 * Returns an array containing all of the elements in this list in proper
 * sequence.
 * @return {Array.<*>} an array containing all of the elements in this list,
 * in proper sequence.
 */
buckets.LinkedList.prototype.toArray = function() {
    var array = [];
    var currentNode = this.firstNode;
    while (currentNode !== null) {
        array.push(currentNode.element);
        currentNode = currentNode.next;
    }
    return array;
};
/**
 * Returns the number of elements in this list.
 * @return {number} the number of elements in this list.
 */
buckets.LinkedList.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this list contains no elements.
 * @return {boolean} true if this list contains no elements.
 */
buckets.LinkedList.prototype.isEmpty = function() {
    return this.nElements <= 0;
};

/**
 * @private
 */
buckets.LinkedList.prototype.nodeAtIndex = function(index) {

    if (index < 0 || index >= this.nElements) {
        return null;
    }
    if (index === (this.nElements - 1)) {
        return this.lastNode;
    }
    var node = this.firstNode;
    for (var i = 0; i < index; i++) {
        node = node.next;
    }
    return node;
};
/**
 * @private
 */
buckets.LinkedList.prototype.createNode = function(item) {
    return {
        element: item,
        next: null
    };
};


/**
 * Creates an empty dictionary. 
 * @class <p>Dictionaries map keys to values; each key can map to at most one value.
 * This implementation accepts any kind of objects as keys.</p>
 *
 * <p>If the keys are custom objects a function which converts keys to unique
 * strings must be provided. Example:</p>
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 * @constructor
 * @param {function(Object):string=} toStrFunction optional function used
 * to convert keys to strings. If the keys aren't strings or if toString()
 * is not appropriate, a custom function which receives a key and returns a
 * unique string must be provided.
 */
buckets.Dictionary = function(toStrFunction) {

    /**
     * Object holding the key-value pairs.
     * @type {Object}
     * @private
     */
    this.table = {};

    /**
     * Number of elements in the list.
     * @type {number}
     * @private
     */
    this.nElements = 0;

    /**
     * Function used to convert keys to strings.
     * @type {function(Object):string}
     * @private
     */
    this.toStr = toStrFunction || buckets.defaultToString;
};

/**
 * Returns the value to which this dictionary maps the specified key.
 * Returns undefined if this dictionary contains no mapping for this key.
 * @param {Object} key key whose associated value is to be returned.
 * @return {*} the value to which this dictionary maps the specified key or
 * undefined if the map contains no mapping for this key.
 */
buckets.Dictionary.prototype.get = function(key) {

    var pair = this.table[this.toStr(key)];
    if (buckets.isUndefined(pair)) {
        return undefined;
    }
    return pair.value;
};
/**
 * Associates the specified value with the specified key in this dictionary.
 * If the dictionary previously contained a mapping for this key, the old
 * value is replaced by the specified value.
 * @param {Object} key key with which the specified value is to be
 * associated.
 * @param {Object} value value to be associated with the specified key.
 * @return {*} previous value associated with the specified key, or undefined if
 * there was no mapping for the key or if the key/value are undefined.
 */
buckets.Dictionary.prototype.set = function(key, value) {

    if (buckets.isUndefined(key) || buckets.isUndefined(value)) {
        return undefined;
    }

    var ret;
    var k = this.toStr(key);
    var previousElement = this.table[k];
    if (buckets.isUndefined(previousElement)) {
        this.nElements++;
        ret = undefined;
    } else {
        ret = previousElement.value;
    }
    this.table[k] = {
        key: key,
        value: value
    };
    return ret;
};
/**
 * Removes the mapping for this key from this dictionary if it is present.
 * @param {Object} key key whose mapping is to be removed from the
 * dictionary.
 * @return {*} previous value associated with specified key, or undefined if
 * there was no mapping for key.
 */
buckets.Dictionary.prototype.remove = function(key) {
    var k = this.toStr(key);
    var previousElement = this.table[k];
    if (!buckets.isUndefined(previousElement)) {
        delete this.table[k];
        this.nElements--;
        return previousElement.value;
    }
    return undefined;
};
/**
 * Returns an array containing all of the keys in this dictionary.
 * @return {Array} an array containing all of the keys in this dictionary.
 */
buckets.Dictionary.prototype.keys = function() {
    var array = [];
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            array.push(this.table[name].key);
        }
    }
    return array;
};
/**
 * Returns an array containing all of the values in this dictionary.
 * @return {Array} an array containing all of the values in this dictionary.
 */
buckets.Dictionary.prototype.values = function() {
    var array = [];
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            array.push(this.table[name].value);
        }
    }
    return array;
};

/**
 * Executes the provided function once for each key-value pair 
 * present in this dictionary.
 * @param {function(Object,Object):*} callback function to execute, it is
 * invoked with two arguments: key and value. To break the iteration you can 
 * optionally return false.
 */
buckets.Dictionary.prototype.forEach = function(callback) {
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            var pair = this.table[name];
            var ret = callback(pair.key, pair.value);
            if (ret === false) {
                return;
            }
        }
    }
};

/**
 * Returns true if this dictionary contains a mapping for the specified key.
 * @param {Object} key key whose presence in this dictionary is to be
 * tested.
 * @return {boolean} true if this dictionary contains a mapping for the
 * specified key.
 */
buckets.Dictionary.prototype.containsKey = function(key) {
    return ! buckets.isUndefined(this.get(key));
};
/**
 * Removes all mappings from this dictionary.
 * @this {buckets.Dictionary}
 */
buckets.Dictionary.prototype.clear = function() {

    this.table = {};
    this.nElements = 0;
};
/**
 * Returns the number of keys in this dictionary.
 * @return {number} the number of key-value mappings in this dictionary.
 */
buckets.Dictionary.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this dictionary contains no mappings.
 * @return {boolean} true if this dictionary contains no mappings.
 */
buckets.Dictionary.prototype.isEmpty = function() {
    return this.nElements <= 0;
};

// /**
//  * Returns true if this dictionary is equal to the given dictionary.
//  * Two dictionaries are equal if they contain the same mappings.
//  * @param {buckets.Dictionary} other the other dictionary.
//  * @param {function(Object,Object):boolean=} valuesEqualFunction optional
//  * function used to check if two values are equal.
//  * @return {boolean} true if this dictionary is equal to the given dictionary.
//  */
// buckets.Dictionary.prototype.equals = function(other,valuesEqualFunction) {
// 	var eqF = valuesEqualFunction || buckets.defaultEquals;
// 	if(!(other instanceof buckets.Dictionary)){
// 		return false;
// 	}
// 	if(this.size() !== other.size()){
// 		return false;
// 	}
// 	return this.equalsAux(this.firstNode,other.firstNode,eqF);
// };
/**
 * Creates an empty multi dictionary. 
 * @class <p>A multi dictionary is a special kind of dictionary that holds
 * multiple values against each key. Setting a value into the dictionary will 
 * add the value to an array at that key. Getting a key will return an array,
 * holding all the values set to that key.
 * This implementation accepts any kind of objects as keys.</p>
 *
 * <p>If the keys are custom objects a function which converts keys to strings must be
 * provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 * <p>If the values are custom objects a function to check equality between values
 * must be provided. Example:</p>
 *
 * <pre>
 * function petsAreEqualByAge(pet1,pet2) {
 *  return pet1.age===pet2.age;
 * }
 * </pre>
 * @constructor
 * @param {function(Object):string=} toStrFunction optional function
 * to convert keys to strings. If the keys aren't strings or if toString()
 * is not appropriate, a custom function which receives a key and returns a
 * unique string must be provided.
 * @param {function(Object,Object):boolean=} valuesEqualsFunction optional
 * function to check if two values are equal.
 * 
 */
buckets.MultiDictionary = function(toStrFunction, valuesEqualsFunction) {
    // Call the parent's constructor
    this.parent = new buckets.Dictionary(toStrFunction);
    this.equalsF = valuesEqualsFunction || buckets.defaultEquals;
};

/**
 * Returns an array holding the values to which this dictionary maps
 * the specified key.
 * Returns an empty array if this dictionary contains no mappings for this key.
 * @param {Object} key key whose associated values are to be returned.
 * @return {Array} an array holding the values to which this dictionary maps
 * the specified key.
 */
buckets.MultiDictionary.prototype.get = function(key) {
    var values = this.parent.get(key);
    if (buckets.isUndefined(values)) {
        return [];
    }
    return buckets.arrays.copy(values);
};

/**
 * Adds the value to the array associated with the specified key, if 
 * it is not already present.
 * @param {Object} key key with which the specified value is to be
 * associated.
 * @param {Object} value the value to add to the array at the key
 * @return {boolean} true if the value was not already associated with that key.
 */
buckets.MultiDictionary.prototype.set = function(key, value) {

    if (buckets.isUndefined(key) || buckets.isUndefined(value)) {
        return false;
    }
    if (!this.containsKey(key)) {
        this.parent.set(key, [value]);
        return true;
    }
    var array = this.parent.get(key);
    if (buckets.arrays.contains(array, value, this.equalsF)) {
        return false;
    }
    array.push(value);
    return true;
};

/**
 * Removes the specified values from the array of values associated with the
 * specified key. If a value isn't given, all values associated with the specified 
 * key are removed.
 * @param {Object} key key whose mapping is to be removed from the
 * dictionary.
 * @param {Object=} value optional argument to specify the value to remove 
 * from the array associated with the specified key.
 * @return {*} true if the dictionary changed, false if the key doesn't exist or 
 * if the specified value isn't associated with the specified key.
 */
buckets.MultiDictionary.prototype.remove = function(key, value) {
    if (buckets.isUndefined(value)) {
        var v = this.parent.remove(key);
        if (buckets.isUndefined(v)) {
            return false;
        }
        return true;
    }
    var array = this.parent.get(key);
    if (buckets.arrays.remove(array, value, this.equalsF)) {
        if (array.length === 0) {
            this.parent.remove(key);
        }
        return true;
    }
    return false;
};

/**
 * Returns an array containing all of the keys in this dictionary.
 * @return {Array} an array containing all of the keys in this dictionary.
 */
buckets.MultiDictionary.prototype.keys = function() {
    return this.parent.keys();
};

/**
 * Returns an array containing all of the values in this dictionary.
 * @return {Array} an array containing all of the values in this dictionary.
 */
buckets.MultiDictionary.prototype.values = function() {
    var values = this.parent.values();
    var array = [];
    for (var i = 0; i < values.length; i++) {
        var v = values[i];
        for (var j = 0; j < v.length; j++) {
            array.push(v[j]);
        }
    }
    return array;
};

/**
 * Returns true if this dictionary at least one value associatted the specified key.
 * @param {Object} key key whose presence in this dictionary is to be
 * tested.
 * @return {boolean} true if this dictionary at least one value associatted 
 * the specified key.
 */
buckets.MultiDictionary.prototype.containsKey = function(key) {
    return this.parent.containsKey(key);
};

/**
 * Removes all mappings from this dictionary.
 */
buckets.MultiDictionary.prototype.clear = function() {
    return this.parent.clear();
};

/**
 * Returns the number of keys in this dictionary.
 * @return {number} the number of key-value mappings in this dictionary.
 */
buckets.MultiDictionary.prototype.size = function() {
    return this.parent.size();
};

/**
 * Returns true if this dictionary contains no mappings.
 * @return {boolean} true if this dictionary contains no mappings.
 */
buckets.MultiDictionary.prototype.isEmpty = function() {
    return this.parent.isEmpty();
};

/**
 * Creates an empty Heap.
 * @class 
 * <p>A heap is a binary tree, where the nodes maintain the heap property: 
 * each node is smaller than each of its children. 
 * This implementation uses an array to store elements.</p>
 * <p>If the inserted elements are custom objects a compare function must be provided, 
 *  at construction time, otherwise the <=, === and >= operators are 
 * used to compare elements. Example:</p>
 *
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 *
 * <p>If a Max-Heap is wanted (greater elements on top) you can a provide a
 * reverse compare function to accomplish that behavior. Example:</p>
 *
 * <pre>
 * function reverseCompare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return 1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return -1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two elements. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.Heap = function(compareFunction) {

    /**
     * Array used to store the elements od the heap.
     * @type {Array.<Object>}
     * @private
     */
    this.data = [];

    /**
     * Function used to compare elements.
     * @type {function(Object,Object):number}
     * @private
     */
    this.compare = compareFunction || buckets.defaultCompare;
};
/**
 * Returns the index of the left child of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the left child
 * for.
 * @return {number} The index of the left child.
 * @private
 */
buckets.Heap.prototype.leftChildIndex = function(nodeIndex) {
    return (2 * nodeIndex) + 1;
};
/**
 * Returns the index of the right child of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the right child
 * for.
 * @return {number} The index of the right child.
 * @private
 */
buckets.Heap.prototype.rightChildIndex = function(nodeIndex) {
    return (2 * nodeIndex) + 2;
};
/**
 * Returns the index of the parent of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the parent for.
 * @return {number} The index of the parent.
 * @private
 */
buckets.Heap.prototype.parentIndex = function(nodeIndex) {
    return Math.floor((nodeIndex - 1) / 2);
};
/**
 * Returns the index of the smaller child node (if it exists).
 * @param {number} leftChild left child index.
 * @param {number} rightChild right child index.
 * @return {number} the index with the minimum value or -1 if it doesn't
 * exists.
 * @private
 */
buckets.Heap.prototype.minIndex = function(leftChild, rightChild) {

    if (rightChild >= this.data.length) {
        if (leftChild >= this.data.length) {
            return - 1;
        } else {
            return leftChild;
        }
    } else {
        if (this.compare(this.data[leftChild], this.data[rightChild]) <= 0) {
            return leftChild;
        } else {
            return rightChild;
        }
    }
};
/**
 * Moves the node at the given index up to its proper place in the heap.
 * @param {number} index The index of the node to move up.
 * @private
 */
buckets.Heap.prototype.siftUp = function(index) {

    var parent = this.parentIndex(index);
    while (index > 0 && this.compare(this.data[parent], this.data[index]) > 0) {
        buckets.arrays.swap(this.data, parent, index);
        index = parent;
        parent = this.parentIndex(index);
    }
};
/**
 * Moves the node at the given index down to its proper place in the heap.
 * @param {number} nodeIndex The index of the node to move down.
 * @private
 */
buckets.Heap.prototype.siftDown = function(nodeIndex) {

    //smaller child index
    var min = this.minIndex(this.leftChildIndex(nodeIndex),
    this.rightChildIndex(nodeIndex));

    while (min >= 0 && this.compare(this.data[nodeIndex],
    this.data[min]) > 0) {
        buckets.arrays.swap(this.data, min, nodeIndex);
        nodeIndex = min;
        min = this.minIndex(this.leftChildIndex(nodeIndex),
        this.rightChildIndex(nodeIndex));
    }
};
/**
 * Retrieves but does not remove the root element of this heap.
 * @return {*} The value at the root of the heap. Returns undefined if the
 * heap is empty.
 */
buckets.Heap.prototype.peek = function() {

    if (this.data.length > 0) {
        return this.data[0];
    } else {
        return undefined;
    }
};
/**
 * Adds the given element into the heap.
 * @param {*} element the element.
 * @return true if the element was added or fals if it is undefined.
 */
buckets.Heap.prototype.add = function(element) {
    if (buckets.isUndefined(element)) {
        return undefined;
    }
    this.data.push(element);
    this.siftUp(this.data.length - 1);
    return true;
};

/**
 * Retrieves and removes the root element of this heap.
 * @return {*} The value removed from the root of the heap. Returns
 * undefined if the heap is empty.
 */
buckets.Heap.prototype.removeRoot = function() {

    if (this.data.length > 0) {
        var obj = this.data[0];
        this.data[0] = this.data[this.data.length - 1];
        this.data.splice(this.data.length - 1, 1);
        if (this.data.length > 0) {
            this.siftDown(0);
        }
        return obj;
    }
    return undefined;
};
/**
 * Returns true if this heap contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this Heap contains the specified element, false
 * otherwise.
 */
buckets.Heap.prototype.contains = function(element) {
    var equF = buckets.compareToEquals(this.compare);
    return buckets.arrays.contains(this.data, element, equF);
};
/**
 * Returns the number of elements in this heap.
 * @return {number} the number of elements in this heap.
 */
buckets.Heap.prototype.size = function() {
    return this.data.length;
};
/**
 * Checks if this heap is empty.
 * @return {boolean} true if and only if this heap contains no items; false
 * otherwise.
 */
buckets.Heap.prototype.isEmpty = function() {
    return this.data.length <= 0;
};
/**
 * Removes all of the elements from this heap.
 */
buckets.Heap.prototype.clear = function() {
    this.data.length = 0;
};

/**
 * Executes the provided function once for each element present in this heap in 
 * no particular order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Heap.prototype.forEach = function(callback) {
   buckets.arrays.forEach(this.data,callback);
};

/**
 * Creates an empty Stack.
 * @class A Stack is a Last-In-First-Out (LIFO) data structure, the last
 * element added to the stack will be the first one to be removed. This
 * implementation uses a linked list as a container.
 * @constructor
 */
buckets.Stack = function() {

    /**
     * List containing the elements.
     * @type buckets.LinkedList
     * @private
     */
    this.list = new buckets.LinkedList();
};
/**
 * Pushes an item onto the top of this stack.
 * @param {Object} elem the element to be pushed onto this stack.
 * @return {boolean} true if the element was pushed or false if it is undefined.
 */
buckets.Stack.prototype.push = function(elem) {
    return this.list.add(elem, 0);
};
/**
 * Pushes an item onto the top of this stack.
 * @param {Object} elem the element to be pushed onto this stack.
 * @return {boolean} true if the element was pushed or false if it is undefined.
 */
buckets.Stack.prototype.add = function(elem) {
    return this.list.add(elem, 0);
};
/**
 * Removes the object at the top of this stack and returns that object.
 * @return {*} the object at the top of this stack or undefined if the
 * stack is empty.
 */
buckets.Stack.prototype.pop = function() {
    return this.list.removeElementAtIndex(0);
};
/**
 * Looks at the object at the top of this stack without removing it from the
 * stack.
 * @return {*} the object at the top of this stack or undefined if the
 * stack is empty.
 */
buckets.Stack.prototype.peek = function() {
    return this.list.first();
};
/**
 * Returns the number of elements in this stack.
 * @return {number} the number of elements in this stack.
 */
buckets.Stack.prototype.size = function() {
    return this.list.size();
};

/**
 * Returns true if this stack contains the specified element.
 * <p>If the elements inside this stack are
 * not comparable with the === operator, a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} elem element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function to check if two elements are equal.
 * @return {boolean} true if this stack contains the specified element,
 * false otherwise.
 */
buckets.Stack.prototype.contains = function(elem, equalsFunction) {
    return this.list.contains(elem, equalsFunction);
};
/**
 * Checks if this stack is empty.
 * @return {boolean} true if and only if this stack contains no items; false
 * otherwise.
 */
buckets.Stack.prototype.isEmpty = function() {
    return this.list.isEmpty();
};
/**
 * Removes all of the elements from this stack.
 */
buckets.Stack.prototype.clear = function() {
    this.list.clear();
};

/**
 * Executes the provided function once for each element present in this stack in 
 * LIFO order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Stack.prototype.forEach = function(callback) {
   this.list.forEach(callback);
};

/**
 * Creates an empty queue.
 * @class A queue is a First-In-First-Out (FIFO) data structure, the first
 * element added to the queue will be the first one to be removed. This
 * implementation uses a linked list as a container.
 * @constructor
 */
buckets.Queue = function() {

    /**
     * List containing the elements.
     * @type buckets.LinkedList
     * @private
     */
    this.list = new buckets.LinkedList();
};
/**
 * Inserts the specified element into the end of this queue.
 * @param {Object} elem the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.Queue.prototype.enqueue = function(elem) {
    return this.list.add(elem);
};
/**
 * Inserts the specified element into the end of this queue.
 * @param {Object} elem the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.Queue.prototype.add = function(elem) {
    return this.list.add(elem);
};
/**
 * Retrieves and removes the head of this queue.
 * @return {*} the head of this queue, or undefined if this queue is empty.
 */
buckets.Queue.prototype.dequeue = function() {
    if (this.list.size() !== 0) {
        var el = this.list.first();
        this.list.removeElementAtIndex(0);
        return el;
    }
    return undefined;
};
/**
 * Retrieves, but does not remove, the head of this queue.
 * @return {*} the head of this queue, or undefined if this queue is empty.
 */
buckets.Queue.prototype.peek = function() {

    if (this.list.size() !== 0) {
        return this.list.first();
    }
    return undefined;
};

/**
 * Returns the number of elements in this queue.
 * @return {number} the number of elements in this queue.
 */
buckets.Queue.prototype.size = function() {
    return this.list.size();
};

/**
 * Returns true if this queue contains the specified element.
 * <p>If the elements inside this stack are
 * not comparable with the === operator, a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} elem element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function to check if two elements are equal.
 * @return {boolean} true if this queue contains the specified element,
 * false otherwise.
 */
buckets.Queue.prototype.contains = function(elem, equalsFunction) {
    return this.list.contains(elem, equalsFunction);
};

/**
 * Checks if this queue is empty.
 * @return {boolean} true if and only if this queue contains no items; false
 * otherwise.
 */
buckets.Queue.prototype.isEmpty = function() {
    return this.list.size() <= 0;
};

/**
 * Removes all of the elements from this queue.
 */
buckets.Queue.prototype.clear = function() {
    this.list.clear();
};

/**
 * Executes the provided function once for each element present in this queue in 
 * FIFO order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Queue.prototype.forEach = function(callback) {
   this.list.forEach(callback);
};

/**
 * Creates an empty priority queue.
 * @class <p>In a priority queue each element is associated with a "priority",
 * elements are dequeued in highest-priority-first order (the elements with the 
 * highest priority are dequeued first). Priority Queues are implemented as heaps. 
 * If the inserted elements are custom objects a compare function must be provided, 
 * otherwise the <=, === and >= operators are used to compare object priority.</p>
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two element priorities. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.PriorityQueue = function(compareFunction) {
    this.heap = new buckets.Heap(buckets.reverseCompareFunction(compareFunction));
};

/**
 * Inserts the specified element into this priority queue.
 * @param {Object} element the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.PriorityQueue.prototype.enqueue = function(element) {
    return this.heap.add(element);
};

/**
 * Inserts the specified element into this priority queue.
 * @param {Object} element the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.PriorityQueue.prototype.add = function(element) {
    return this.heap.add(element);
};

/**
 * Retrieves and removes the highest priority element of this queue.
 * @return {*} the the highest priority element of this queue, 
or undefined if this queue is empty.
 */
buckets.PriorityQueue.prototype.dequeue = function() {
    if (this.heap.size() !== 0) {
        var el = this.heap.peek();
        this.heap.removeRoot();
        return el;
    }
    return undefined;
};

/**
 * Retrieves, but does not remove, the highest priority element of this queue.
 * @return {*} the highest priority element of this queue, or undefined if this queue is empty.
 */
buckets.PriorityQueue.prototype.peek = function() {
    return this.heap.peek();
};

/**
 * Returns true if this priority queue contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this priority queue contains the specified element,
 * false otherwise.
 */
buckets.PriorityQueue.prototype.contains = function(element) {
    return this.heap.contains(element);
};

/**
 * Checks if this priority queue is empty.
 * @return {boolean} true if and only if this priority queue contains no items; false
 * otherwise.
 */
buckets.PriorityQueue.prototype.isEmpty = function() {
    return this.heap.isEmpty();
};

/**
 * Returns the number of elements in this priority queue.
 * @return {number} the number of elements in this priority queue.
 */
buckets.PriorityQueue.prototype.size = function() {
    return this.heap.size();
};

/**
 * Removes all of the elements from this priority queue.
 */
buckets.PriorityQueue.prototype.clear = function() {
    this.heap.clear();
};

/**
 * Executes the provided function once for each element present in this queue in 
 * no particular order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.PriorityQueue.prototype.forEach = function(callback) {
   buckets.heap.forEach(callback);
};


/**
 * Creates an empty set.
 * @class <p>A set is a data structure that contains no duplicate items.</p>
 * <p>If the inserted elements are custom objects a function 
 * which converts elements to strings must be provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object):string=} toStringFunction optional function used
 * to convert elements to strings. If the elements aren't strings or if toString()
 * is not appropriate, a custom function which receives a onject and returns a
 * unique string must be provided.
 */
buckets.Set = function(toStringFunction) {
    this.dictionary = new buckets.Dictionary(toStringFunction);
};

/**
 * Returns true if this set contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this set contains the specified element,
 * false otherwise.
 */
buckets.Set.prototype.contains = function(element) {
    return this.dictionary.containsKey(element);
};

/**
 * Adds the specified element to this set if it is not already present.
 * @param {Object} element the element to insert.
 * @return {boolean} true if this set did not already contain the specified element.
 */
buckets.Set.prototype.add = function(element) {
    if (this.contains(element) || buckets.isUndefined(element)) {
        return false;
    } else {
        this.dictionary.set(element, element);
        return true;
    }
};

/**
 * Performs an intersecion between this an another set.
 * Removes all values that are not present this set and the given set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.intersection = function(otherSet) {
    var set = this;
    this.forEach(function(element) {
        if (!otherSet.contains(element)) {
            set.remove(element);
        }
    });
};

/**
 * Performs a union between this an another set.
 * Adds all values from the given set to this set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.union = function(otherSet) {
    var set = this;
    otherSet.forEach(function(element) {
        set.add(element);
    });
};

/**
 * Performs a difference between this an another set.
 * Removes from this set all the values that are present in the given set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.difference = function(otherSet) {
    var set = this;
    otherSet.forEach(function(element) {
        set.remove(element);
    });
};

/**
 * Checks whether the given set contains all the elements in this set.
 * @param {buckets.Set} otherSet other set.
 * @return {boolean} true if this set is a subset of the given set.
 */
buckets.Set.prototype.isSubsetOf = function(otherSet) {
    if (this.size() > otherSet.size()) {
        return false;
    }

    this.forEach(function(element) {
        if (!otherSet.contains(element)) {
            return false;
        }
    });
    return true;
};

/**
 * Removes the specified element from this set if it is present.
 * @return {boolean} true if this set contained the specified element.
 */
buckets.Set.prototype.remove = function(element) {
    if (!this.contains(element)) {
        return false;
    } else {
        this.dictionary.remove(element);
        return true;
    }
};

/**
 * Executes the provided function once for each element 
 * present in this set.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one arguments: the element. To break the iteration you can 
 * optionally return false.
 */
buckets.Set.prototype.forEach = function(callback) {
    this.dictionary.forEach(function(k, v) {
        return callback(v);
    });
};

/**
 * Returns an array containing all of the elements in this set in arbitrary order.
 * @return {Array} an array containing all of the elements in this set.
 */
buckets.Set.prototype.toArray = function() {
    return this.dictionary.values();
};

/**
 * Returns true if this set contains no elements.
 * @return {boolean} true if this set contains no elements.
 */
buckets.Set.prototype.isEmpty = function() {
    return this.dictionary.isEmpty();
};

/**
 * Returns the number of elements in this set.
 * @return {number} the number of elements in this set.
 */
buckets.Set.prototype.size = function() {
    return this.dictionary.size();
};

/**
 * Removes all of the elements from this set.
 */
buckets.Set.prototype.clear = function() {
    this.dictionary.clear();
};

/**
 * Creates an empty bag.
 * @class <p>A bag is a special kind of set in which members are 
 * allowed to appear more than once.</p>
 * <p>If the inserted elements are custom objects a function 
 * which converts elements to unique strings must be provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object):string=} toStringFunction optional function used
 * to convert elements to strings. If the elements aren't strings or if toString()
 * is not appropriate, a custom function which receives an object and returns a
 * unique string must be provided.
 */
buckets.Bag = function(toStrFunction) {
    this.toStrF = toStrFunction || buckets.defaultToString;
    this.dictionary = new buckets.Dictionary(this.toStrF);
    this.nElements = 0;
};

/**
* Adds nCopies of the specified object to this bag.
* @param {Object} element element to add.
* @param {number=} nCopies the number of copies to add, if this argument is
* undefined 1 copy is added.
* @return {boolean} true unless element is undefined.
*/
buckets.Bag.prototype.add = function(element, nCopies) {

    if (isNaN(nCopies) || buckets.isUndefined(nCopies)) {
        nCopies = 1;
    }
    if (buckets.isUndefined(element) || nCopies <= 0) {
        return false;
    }

    if (!this.contains(element)) {
        var node = {
            value: element,
            copies: nCopies
        };
        this.dictionary.set(element, node);
    } else {
        this.dictionary.get(element).copies += nCopies;
    }
    this.nElements += nCopies;
    return true;
};

/**
* Counts the number of copies of the specified object in this bag.
* @param {Object} element the object to search for..
* @return {number} the number of copies of the object, 0 if not found
*/
buckets.Bag.prototype.count = function(element) {

    if (!this.contains(element)) {
        return 0;
    } else {
        return this.dictionary.get(element).copies;
    }
};

/**
 * Returns true if this bag contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this bag contains the specified element,
 * false otherwise.
 */
buckets.Bag.prototype.contains = function(element) {
    return this.dictionary.containsKey(element);
};

/**
* Removes nCopies of the specified object to this bag.
* If the number of copies to remove is greater than the actual number 
* of copies in the Bag, all copies are removed. 
* @param {Object} element element to remove.
* @param {number=} nCopies the number of copies to remove, if this argument is
* undefined 1 copy is removed.
* @return {boolean} true if at least 1 element was removed.
*/
buckets.Bag.prototype.remove = function(element, nCopies) {

    if (isNaN(nCopies) || buckets.isUndefined(nCopies)) {
        nCopies = 1;
    }
    if (buckets.isUndefined(element) || nCopies <= 0) {
        return false;
    }

    if (!this.contains(element)) {
        return false;
    } else {
        var node = this.dictionary.get(element);
        if (nCopies > node.copies) {
            this.nElements -= node.copies;
        } else {
            this.nElements -= nCopies;
        }
        node.copies -= nCopies;
        if (node.copies <= 0) {
            this.dictionary.remove(element);
        }
        return true;
    }
};

/**
 * Returns an array containing all of the elements in this big in arbitrary order, 
 * including multiple copies.
 * @return {Array} an array containing all of the elements in this bag.
 */
buckets.Bag.prototype.toArray = function() {
    var a = [];
    var values = this.dictionary.values();
    var vl = values.length;
    for (var i = 0; i < vl; i++) {
        var node = values[i];
        var element = node.value;
        var copies = node.copies;
        for (var j = 0; j < copies; j++) {
            a.push(element);
        }
    }
    return a;
};

/**
 * Returns a set of unique elements in this bag. 
 * @return {buckets.Set} a set of unique elements in this bag.
 */
buckets.Bag.prototype.toSet = function() {
    var set = new buckets.Set(this.toStrF);
    var elements = this.dictionary.values();
    var l = elements.length;
    for (var i = 0; i < l; i++) {
        var value = elements[i].value;
        set.add(value);
    }
    return set;
};

/**
 * Executes the provided function once for each element 
 * present in this bag, including multiple copies.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element. To break the iteration you can 
 * optionally return false.
 */
buckets.Bag.prototype.forEach = function(callback) {
    this.dictionary.forEach(function(k, v) {
        var value = v.value;
        var copies = v.copies;
        for (var i = 0; i < copies; i++) {
            if (callback(value) === false) {
                return false;
            }
        }
        return true;
    });
};
/**
 * Returns the number of elements in this bag.
 * @return {number} the number of elements in this bag.
 */
buckets.Bag.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this bag contains no elements.
 * @return {boolean} true if this bag contains no elements.
 */
buckets.Bag.prototype.isEmpty = function() {
    return this.nElements === 0;
};

/**
 * Removes all of the elements from this bag.
 */
buckets.Bag.prototype.clear = function() {
    this.nElements = 0;
    this.dictionary.clear();
};



/**
 * Creates an empty binary search tree.
 * @class <p>A binary search tree is a binary tree in which each 
 * internal node stores an element such that the elements stored in the 
 * left subtree are less than it and the elements 
 * stored in the right subtree are greater.</p>
 * <p>Formally, a binary search tree is a node-based binary tree data structure which 
 * has the following properties:</p>
 * <ul>
 * <li>The left subtree of a node contains only nodes with elements less 
 * than the node's element</li>
 * <li>The right subtree of a node contains only nodes with elements greater 
 * than the node's element</li>
 * <li>Both the left and right subtrees must also be binary search trees.</li>
 * </ul>
 * <p>If the inserted elements are custom objects a compare function must 
 * be provided at construction time, otherwise the <=, === and >= operators are 
 * used to compare elements. Example:</p>
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two elements. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.BSTree = function(compareFunction) {
    this.root = null;
    this.compare = compareFunction || buckets.defaultCompare;
    this.nElements = 0;
};


/**
 * Adds the specified element to this tree if it is not already present.
 * @param {Object} element the element to insert.
 * @return {boolean} true if this tree did not already contain the specified element.
 */
buckets.BSTree.prototype.add = function(element) {
    if (buckets.isUndefined(element)) {
        return false;
    }

    if (this.insertNode(this.createNode(element)) !== null) {
        this.nElements++;
        return true;
    }
    return false;
};

/**
 * Removes all of the elements from this tree.
 */
buckets.BSTree.prototype.clear = function() {
    this.root = null;
    this.nElements = 0;
};

/**
 * Returns true if this tree contains no elements.
 * @return {boolean} true if this tree contains no elements.
 */
buckets.BSTree.prototype.isEmpty = function() {
    return this.nElements === 0;
};

/**
 * Returns the number of elements in this tree.
 * @return {number} the number of elements in this tree.
 */
buckets.BSTree.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this tree contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this tree contains the specified element,
 * false otherwise.
 */
buckets.BSTree.prototype.contains = function(element) {
    if (buckets.isUndefined(element)) {
        return false;
    }
    return this.searchNode(this.root, element) !== null;
};

/**
 * Removes the specified element from this tree if it is present.
 * @return {boolean} true if this tree contained the specified element.
 */
buckets.BSTree.prototype.remove = function(element) {
    var node = this.searchNode(this.root, element);
    if (node === null) {
        return false;
    }
    this.removeNode(node);
    this.nElements--;
    return true;
};

/**
 * Executes the provided function once for each element present in this tree in 
 * in-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.inorderTraversal = function(callback) {
    this.inorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in pre-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.preorderTraversal = function(callback) {
    this.preorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in post-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.postorderTraversal = function(callback) {
    this.postorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in 
 * level-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.levelTraversal = function(callback) {
    this.levelTraversalAux(this.root, callback);
};

/**
 * Returns the minimum element of this tree.
 * @return {*} the minimum element of this tree or undefined if this tree is
 * is empty.
 */
buckets.BSTree.prototype.minimum = function() {
    if (this.isEmpty()) {
        return undefined;
    }
    return this.minimumAux(this.root).element;
};

/**
 * Returns the maximum element of this tree.
 * @return {*} the maximum element of this tree or undefined if this tree is
 * is empty.
 */
buckets.BSTree.prototype.maximum = function() {
    if (this.isEmpty()) {
        return undefined;
    }
    return this.maximumAux(this.root).element;
};

/**
 * Executes the provided function once for each element present in this tree in inorder.
 * Equivalent to inorderTraversal.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.BSTree.prototype.forEach = function(callback) {
    this.inorderTraversal(callback);
};

/**
 * Returns an array containing all of the elements in this tree in in-order.
 * @return {Array} an array containing all of the elements in this tree in in-order.
 */
buckets.BSTree.prototype.toArray = function() {
    var array = [];
    this.inorderTraversal(function(element) {
        array.push(element);
    });
    return array;
};

/**
 * Returns the height of this tree.
 * @return {number} the height of this tree or -1 if is empty.
 */
buckets.BSTree.prototype.height = function() {
    return this.heightAux(this.root);
};

/**
* @private
*/
buckets.BSTree.prototype.searchNode = function(node, element) {
    var cmp = null;
    while (node !== null && cmp !== 0) {
        cmp = this.compare(element, node.element);
        if (cmp < 0) {
            node = node.leftCh;
        } else if (cmp > 0) {
            node = node.rightCh;
        }
    }
    return node;
};


/**
* @private
*/
buckets.BSTree.prototype.transplant = function(n1, n2) {
    if (n1.parent === null) {
        this.root = n2;
    } else if (n1 === n1.parent.leftCh) {
        n1.parent.leftCh = n2;
    } else {
        n1.parent.rightCh = n2;
    }
    if (n2 !== null) {
        n2.parent = n1.parent;
    }
};


/**
* @private
*/
buckets.BSTree.prototype.removeNode = function(node) {
    if (node.leftCh === null) {
        this.transplant(node, node.rightCh);
    } else if (node.rightCh === null) {
        this.transplant(node, node.leftCh);
    } else {
        var y = this.minimumAux(node.rightCh);
        if (y.parent !== node) {
            this.transplant(y, y.rightCh);
            y.rightCh = node.rightCh;
            y.rightCh.parent = y;
        }
        this.transplant(node, y);
        y.leftCh = node.leftCh;
        y.leftCh.parent = y;
    }
};
/**
* @private
*/
buckets.BSTree.prototype.inorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    this.inorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
    if (signal.stop) {
        return;
    }
    this.inorderTraversalAux(node.rightCh, callback, signal);
};

/**
* @private
*/
buckets.BSTree.prototype.levelTraversalAux = function(node, callback) {
    var queue = new buckets.Queue();
    if (node !== null) {
        queue.enqueue(node);
    }
    while (!queue.isEmpty()) {
        node = queue.dequeue();
        if (callback(node.element) === false) {
            return;
        }
        if (node.leftCh !== null) {
            queue.enqueue(node.leftCh);
        }
        if (node.rightCh !== null) {
            queue.enqueue(node.rightCh);
        }
    }
};

/**
* @private
*/
buckets.BSTree.prototype.preorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
    if (signal.stop) {
        return;
    }
    this.preorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    this.preorderTraversalAux(node.rightCh, callback, signal);
};
/**
* @private
*/
buckets.BSTree.prototype.postorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    this.postorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    this.postorderTraversalAux(node.rightCh, callback, signal);
    if (signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
};

/**
* @private
*/
buckets.BSTree.prototype.minimumAux = function(node) {
    while (node.leftCh !== null) {
        node = node.leftCh;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.maximumAux = function(node) {
    while (node.rightCh !== null) {
        node = node.rightCh;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.successorNode = function(node) {
    if (node.rightCh !== null) {
        return this.minimumAux(node.rightCh);
    }
    var successor = node.parent;
    while (successor !== null && node === successor.rightCh) {
        node = successor;
        successor = node.parent;
    }
    return successor;
};

/**
* @private
*/
buckets.BSTree.prototype.heightAux = function(node) {
    if (node === null) {
        return - 1;
    }
    return Math.max(this.heightAux(node.leftCh), this.heightAux(node.rightCh)) + 1;
};

/*
* @private
*/
buckets.BSTree.prototype.insertNode = function(node) {

    var parent = null;
    var position = this.root;
    var cmp = null;
    while (position !== null) {
        cmp = this.compare(node.element, position.element);
        if (cmp === 0) {
            return null;
        } else if (cmp < 0) {
            parent = position;
            position = position.leftCh;
        } else {
            parent = position;
            position = position.rightCh;
        }
    }
    node.parent = parent;
    if (parent === null) {
        // tree is empty
        this.root = node;
    } else if (this.compare(node.element, parent.element) < 0) {
        parent.leftCh = node;
    } else {
        parent.rightCh = node;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.createNode = function(element) {
    return {
        element: element,
        leftCh: null,
        rightCh: null,
        parent: null
    };
};