/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
var tsu;
(function (tsu) {






    /**
    * An iterator for an array of items.
    */
    var ArrayIterator = (function () {
        /*
        * Construct a new ArrayIterator.
        *
        * @param array The array of items to iterate.
        * @param [index] The index at which to start iteration.
        */
        function ArrayIterator(array, index) {
            if (typeof index === "undefined") { index = 0; }
            this._array = array;
            this._index = Math.max(0, Math.min(index, array.length));
        }
        /**
        * Returns the next item from the iterator or undefined.
        */
        ArrayIterator.prototype.__next__ = function () {
            return this._array[this._index++];
        };

        /**
        * Returns this same iterator.
        */
        ArrayIterator.prototype.__iter__ = function () {
            return this;
        };
        return ArrayIterator;
    })();
    tsu.ArrayIterator = ArrayIterator;

    /**
    * A reverse iterator for an array of items.
    */
    var ReverseArrayIterator = (function () {
        /**
        * Construct a new ReverseArrayIterator.
        *
        * @param array The array of items to iterate.
        * @param [index] The index at which to start iteration.
        */
        function ReverseArrayIterator(array, index) {
            if (typeof index === "undefined") { index = array.length; }
            this._array = array;
            this._index = Math.max(0, Math.min(index, array.length));
        }
        /**
        * Returns the next item from the iterator or undefined.
        */
        ReverseArrayIterator.prototype.__next__ = function () {
            return this._array[--this._index];
        };

        /**
        * Returns this same iterator.
        */
        ReverseArrayIterator.prototype.__iter__ = function () {
            return this;
        };
        return ReverseArrayIterator;
    })();
    tsu.ReverseArrayIterator = ReverseArrayIterator;



    function iter(object) {
        if (object instanceof Array) {
            return new ArrayIterator(object);
        }
        return object.__iter__();
    }
    tsu.iter = iter;



    function reversed(object) {
        if (object instanceof Array) {
            return new ReverseArrayIterator(object);
        }
        return object.__reversed__();
    }
    tsu.reversed = reversed;

    /**
    * Returns the next value from an iterator, or undefined.
    */
    function next(iterator) {
        return iterator.__next__();
    }
    tsu.next = next;



    function asArray(object) {
        if (object instanceof Array) {
            return object.slice();
        }
        var value;
        var array = [];
        var it = object.__iter__();
        while ((value = it.__next__()) !== undefined) {
            array.push(value);
        }
        return array;
    }
    tsu.asArray = asArray;



    function forEach(object, callback) {
        if (object instanceof Array) {
            for (var i = 0, n = object.length; i < n; ++i) {
                if (callback(object[i]) === false) {
                    return;
                }
            }
        } else {
            var value;
            var it = object.__iter__();
            while ((value = it.__next__()) !== undefined) {
                if (callback(value) === false) {
                    return;
                }
            }
        }
    }
    tsu.forEach = forEach;



    function map(object, callback) {
        var result = [];
        if (object instanceof Array) {
            for (var i = 0, n = object.length; i < n; ++i) {
                result.push(callback(object[i]));
            }
        } else {
            var value;
            var it = object.__iter__();
            while ((value = it.__next__()) !== undefined) {
                result.push(callback(value));
            }
        }
        return result;
    }
    tsu.map = map;



    function filter(object, callback) {
        var value;
        var result = [];
        if (object instanceof Array) {
            for (var i = 0, n = object.length; i < n; ++i) {
                value = object[i];
                if (callback(value)) {
                    result.push(value);
                }
            }
        } else {
            var it = object.__iter__();
            while ((value = it.__next__()) !== undefined) {
                if (callback(value)) {
                    result.push(value);
                }
            }
        }
        return result;
    }
    tsu.filter = filter;
})(tsu || (tsu = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
var tsu;
(function (tsu) {


    /**
    * A class which defines a generic pair object.
    */
    var Pair = (function () {
        /**
        * Construct a new Pair object.
        *
        * @param first The first item of the pair.
        * @param second The second item of the pair.
        */
        function Pair(first, second) {
            this.first = first;
            this.second = second;
        }
        /**
        * Create a copy of the pair.
        */
        Pair.prototype.copy = function () {
            return new Pair(this.first, this.second);
        };
        return Pair;
    })();
    tsu.Pair = Pair;
})(tsu || (tsu = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
/// <reference path="iterator.ts"/>
/// <reference path="utility.ts"/>
var tsu;
(function (tsu) {
    /**
    * Perform a lower bound search on a sorted array.
    *
    * @param array The array of sorted items to search.
    * @param value The value to located in the array.
    * @param compare The value comparison function.
    * @returns The index of the first element in the array which
    *          compares greater than or equal to the given value.
    */
    function lowerBound(array, value, compare) {
        var begin = 0;
        var n = array.length;
        var half;
        var middle;
        while (n > 0) {
            half = n >> 1;
            middle = begin + half;
            if (compare(array[middle], value) < 0) {
                begin = middle + 1;
                n -= half + 1;
            } else {
                n = half;
            }
        }
        return begin;
    }
    tsu.lowerBound = lowerBound;

    /**
    * Perform a binary search on a sorted array.
    *
    * @param array The array of sorted items to search.
    * @param value The value to located in the array.
    * @param compare The value comparison function.
    * @returns The index of the found item, or -1.
    */
    function binarySearch(array, value, compare) {
        var index = lowerBound(array, value, compare);
        if (index === array.length) {
            return -1;
        }
        var item = array[index];
        if (compare(item, value) !== 0) {
            return -1;
        }
        return index;
    }
    tsu.binarySearch = binarySearch;

    /**
    * Perform a binary find on a sorted array.
    *
    * @param array The array of sorted items to search.
    * @param value The value to located in the array.
    * @param compare The value comparison function.
    * @returns The found item in the array, or undefined.
    */
    function binaryFind(array, value, compare) {
        var index = lowerBound(array, value, compare);
        if (index === array.length) {
            return undefined;
        }
        var item = array[index];
        if (compare(item, value) !== 0) {
            return undefined;
        }
        return item;
    }
    tsu.binaryFind = binaryFind;



    function asSet(items, compare) {
        var array = tsu.asArray(items);
        var n = array.length;
        if (n <= 1) {
            return array;
        }
        array.sort(compare);
        var result = [array[0]];
        for (var i = 1, j = 0; i < n; ++i) {
            var item = array[i];
            if (compare(result[j], item) !== 0) {
                result.push(item);
                ++j;
            }
        }
        return result;
    }
    tsu.asSet = asSet;

    /**
    * Test whether a two sorted arrays sets are disjoint.
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns true if the sets are disjoint, false otherwise.
    */
    function setIsDisjoint(first, second, compare) {
        var i = 0, j = 0;
        var len1 = first.length;
        var len2 = second.length;
        while (i < len1 && j < len2) {
            var v = compare(first[i], second[j]);
            if (v < 0) {
                ++i;
            } else if (v > 0) {
                ++j;
            } else {
                return false;
            }
        }
        return true;
    }
    tsu.setIsDisjoint = setIsDisjoint;

    /**
    * Test whether one sorted array set is the subset of another.
    *
    * @param first The potential subset.
    * @param second The potential superset.
    * @param compare The value comparison function.
    * @returns true if the first set is a subset of the second.
    */
    function setIsSubset(first, second, compare) {
        var len1 = first.length;
        var len2 = second.length;
        if (len1 > len2) {
            return false;
        }
        var i = 0, j = 0;
        while (i < len1 && j < len2) {
            var v = compare(first[i], second[j]);
            if (v < 0) {
                return false;
            } else if (v > 0) {
                ++j;
            } else {
                ++i;
                ++j;
            }
        }
        if (i < len1) {
            return false;
        }
        return true;
    }
    tsu.setIsSubset = setIsSubset;

    /**
    * Create the set union of two sorted set arrays.
    var j = 0;
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns The set union of the two arrays.
    */
    function setUnion(first, second, compare) {
        var i = 0, j = 0;
        var len1 = first.length;
        var len2 = second.length;
        var merged = [];
        while (i < len1 && j < len2) {
            var a = first[i];
            var b = second[j];
            var v = compare(a, b);
            if (v < 0) {
                merged.push(a);
                ++i;
            } else if (v > 0) {
                merged.push(b);
                ++j;
            } else {
                merged.push(a);
                ++i;
                ++j;
            }
        }
        while (i < len1) {
            merged.push(first[i]);
            ++i;
        }
        while (j < len2) {
            merged.push(second[j]);
            ++j;
        }
        return merged;
    }
    tsu.setUnion = setUnion;

    /**
    * Create a set intersection of two sorted set arrays.
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns The set intersection of the two arrays.
    */
    function setIntersection(first, second, compare) {
        var i = 0, j = 0;
        var len1 = first.length;
        var len2 = second.length;
        var merged = [];
        while (i < len1 && j < len2) {
            var a = first[i];
            var b = second[j];
            var v = compare(a, b);
            if (v < 0) {
                ++i;
            } else if (v > 0) {
                ++j;
            } else {
                merged.push(a);
                ++i;
                ++j;
            }
        }
        return merged;
    }
    tsu.setIntersection = setIntersection;

    /**
    * Create a set difference of two sorted set arrays.
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns The set difference of the two arrays.
    */
    function setDifference(first, second, compare) {
        var i = 0, j = 0;
        var len1 = first.length;
        var len2 = second.length;
        var merged = [];
        while (i < len1 && j < len2) {
            var a = first[i];
            var b = second[j];
            var v = compare(a, b);
            if (v < 0) {
                merged.push(a);
                ++i;
            } else if (v > 0) {
                ++j;
            } else {
                ++i;
                ++j;
            }
        }
        while (i < len1) {
            merged.push(first[i]);
            ++i;
        }
        return merged;
    }
    tsu.setDifference = setDifference;

    /**
    * Create a set symmetric difference of two sorted set arrays.
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns The set symmetric difference of the two arrays.
    */
    function setSymmetricDifference(first, second, compare) {
        var i = 0, j = 0;
        var len1 = first.length;
        var len2 = second.length;
        var merged = [];
        while (i < len1 && j < len2) {
            var a = first[i];
            var b = second[j];
            var v = compare(a, b);
            if (v < 0) {
                merged.push(a);
                ++i;
            } else if (v > 0) {
                merged.push(b);
                ++j;
            } else {
                ++i;
                ++j;
            }
        }
        while (i < len1) {
            merged.push(first[i]);
            ++i;
        }
        while (j < len2) {
            merged.push(second[j]);
            ++j;
        }
        return merged;
    }
    tsu.setSymmetricDifference = setSymmetricDifference;
})(tsu || (tsu = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
/// <reference path="iterator.ts"/>
var tsu;
(function (tsu) {
    /**
    * A base class for implementing array-based data structures.
    *
    * @class
    */
    var ArrayBase = (function () {
        function ArrayBase() {
            /*
            * The internal data array.
            *
            * @protected
            */
            this._array = [];
        }
        /**
        * Returns the number of items in the array.
        */
        ArrayBase.prototype.size = function () {
            return this._array.length;
        };

        /**
        * Returns true if the array is empty.
        */
        ArrayBase.prototype.empty = function () {
            return this._array.length === 0;
        };

        /**
        * Returns the item at the given array index.
        *
        * @param index The integer index of the desired item.
        */
        ArrayBase.prototype.itemAt = function (index) {
            return this._array[index];
        };

        /**
        * Removes and returns the item at the given index.
        *
        * @param index The integer index of the desired item.
        */
        ArrayBase.prototype.takeAt = function (index) {
            return this._array.splice(index, 1)[0];
        };

        /**
        * Clear the internal contents of array.
        */
        ArrayBase.prototype.clear = function () {
            this._array = [];
        };

        /**
        * Swap this array's contents with another array.
        *
        * @param other The array base to use for the swap.
        */
        ArrayBase.prototype.swap = function (other) {
            var array = this._array;
            this._array = other._array;
            other._array = array;
        };

        /**
        * Returns an iterator over the array of items.
        */
        ArrayBase.prototype.__iter__ = function () {
            return tsu.iter(this._array);
        };

        /**
        * Returns a reverse iterator over the array of items.
        */
        ArrayBase.prototype.__reversed__ = function () {
            return tsu.reversed(this._array);
        };
        return ArrayBase;
    })();
    tsu.ArrayBase = ArrayBase;
})(tsu || (tsu = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="algorithm.ts"/>
/// <reference path="array_base.ts"/>
/// <reference path="iterator.ts"/>
/// <reference path="utility.ts"/>
var tsu;
(function (tsu) {
    /**
    * A mapping container build on a sorted array.
    *
    * @class
    */
    var AssociativeArray = (function (_super) {
        __extends(AssociativeArray, _super);
        /**
        * Construct a new AssociativeArray.
        *
        * @param compare The key comparison function.
        */
        function AssociativeArray(compare) {
            _super.call(this);
            this._compare = compare;
            this._wrapped = wrapCompare(compare);
        }
        /**
        * Returns the key comparison function used by this array.
        */
        AssociativeArray.prototype.comparitor = function () {
            return this._compare;
        };

        /**
        * Return the array index of the given key, or -1.
        *
        * @param key The key to locate in the array.
        */
        AssociativeArray.prototype.indexOf = function (key) {
            return tsu.binarySearch(this._array, key, this._wrapped);
        };

        /**
        * Returns true if the key is in the array, false otherwise.
        *
        * @param key The key to locate in the array.
        */
        AssociativeArray.prototype.contains = function (key) {
            return tsu.binarySearch(this._array, key, this._wrapped) >= 0;
        };

        /**
        * Returns the pair associated with the given key, or undefined.
        *
        * @param key The key to locate in the array.
        */
        AssociativeArray.prototype.find = function (key) {
            return tsu.binaryFind(this._array, key, this._wrapped);
        };

        /**
        * Returns the pair associated with the key if it exists.
        *
        * If the key does not exist, a new pair will be created and
        * inserted using the value created by the given factory.
        *
        * @param key The key to locate in the array.
        * @param factory The function which creates the default value.
        */
        AssociativeArray.prototype.setDefault = function (key, factory) {
            var array = this._array;
            var index = tsu.lowerBound(array, key, this._wrapped);
            if (index === array.length) {
                var pair = new tsu.Pair(key, factory());
                array.push(pair);
                return pair;
            }
            var currPair = array[index];
            if (this._compare(currPair.first, key) !== 0) {
                var pair = new tsu.Pair(key, factory());
                array.splice(index, 0, pair);
                return pair;
            }
            return currPair;
        };

        /**
        * Insert the pair into the array and return the pair.
        *
        * This will overwrite any existing entry in the array.
        *
        * @param key The key portion of the pair.
        * @param value The value portion of the pair.
        */
        AssociativeArray.prototype.insert = function (key, value) {
            var array = this._array;
            var index = tsu.lowerBound(array, key, this._wrapped);
            if (index === array.length) {
                var pair = new tsu.Pair(key, value);
                array.push(pair);
                return pair;
            }
            var currPair = array[index];
            if (this._compare(currPair.first, key) !== 0) {
                var pair = new tsu.Pair(key, value);
                array.splice(index, 0, pair);
                return pair;
            }
            currPair.second = value;
            return currPair;
        };

        AssociativeArray.prototype.update = function (object) {
            var _this = this;
            if (object instanceof AssociativeArray) {
                var obj = object;
                this._array = merge(this._array, obj._array, this._compare);
            } else {
                tsu.forEach(object, function (pair) {
                    _this.insert(pair.first, pair.second);
                });
            }
        };

        /**
        * Removes and returns the pair for the given key, or undefined.
        *
        * @param key The key to remove from the map.
        */
        AssociativeArray.prototype.erase = function (key) {
            var array = this._array;
            var index = tsu.binarySearch(array, key, this._wrapped);
            if (index < 0) {
                return undefined;
            }
            return array.splice(index, 1)[0];
        };

        /**
        * Create a copy of this associative array.
        */
        AssociativeArray.prototype.copy = function () {
            var theCopy = new AssociativeArray(this._compare);
            var copyArray = theCopy._array;
            var thisArray = this._array;
            for (var i = 0, n = thisArray.length; i < n; ++i) {
                copyArray.push(thisArray[i].copy());
            }
            return theCopy;
        };
        return AssociativeArray;
    })(tsu.ArrayBase);
    tsu.AssociativeArray = AssociativeArray;

    /**
    * An internal which wraps a comparison key function.
    */
    function wrapCompare(cmp) {
        return function (pair, value) {
            return cmp(pair.first, value);
        };
    }

    /**
    * An internal function which merges two ordered pair arrays.
    */
    function merge(first, second, compare) {
        var i = 0, j = 0;
        var len1 = first.length;
        var len2 = second.length;
        var merged = [];
        while (i < len1 && j < len2) {
            var a = first[i];
            var b = second[j];
            var v = compare(a.first, b.first);
            if (v < 0) {
                merged.push(a.copy());
                ++i;
            } else if (v > 0) {
                merged.push(b.copy());
                ++j;
            } else {
                merged.push(b.copy());
                ++i;
                ++j;
            }
        }
        while (i < len1) {
            merged.push(first[i].copy());
            ++i;
        }
        while (j < len2) {
            merged.push(second[j].copy());
            ++j;
        }
        return merged;
    }
})(tsu || (tsu = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
/// <reference path="algorithm.ts"/>
/// <reference path="array_base.ts"/>
/// <reference path="iterator.ts"/>
/// <reference path="utility.ts"/>
var tsu;
(function (tsu) {
    /**
    * A set container built on a sorted array.
    *
    * @class
    */
    var UniqueArray = (function (_super) {
        __extends(UniqueArray, _super);
        /**
        * Construct a new UniqueArray.
        *
        * @param compare The item comparison function.
        */
        function UniqueArray(compare) {
            _super.call(this);
            this._compare = compare;
        }
        /**
        * Returns the comparison function for this array.
        */
        UniqueArray.prototype.comparitor = function () {
            return this._compare;
        };

        /**
        * Return the array index of the given item, or -1.
        *
        * @param item The item to locate in the array.
        */
        UniqueArray.prototype.indexOf = function (item) {
            return tsu.binarySearch(this._array, item, this._compare);
        };

        /**
        * Returns true if the item is in the array, false otherwise.
        *
        * @param item The item to locate in the array.
        */
        UniqueArray.prototype.contains = function (item) {
            return tsu.binarySearch(this._array, item, this._compare) >= 0;
        };

        /**
        * Insert an item into the array.
        *
        * Returns true if the item is new to the set, false otherwise.
        *
        * @param item The item to insert into the array.
        */
        UniqueArray.prototype.insert = function (item) {
            var array = this._array;
            var index = tsu.lowerBound(array, item, this._compare);
            if (index === array.length) {
                array.push(item);
                return true;
            }
            if (this._compare(array[index], item) !== 0) {
                array.splice(index, 0, item);
                return true;
            }
            return false;
        };

        /**
        * Remove an item from the array.
        *
        * Returns true if the item was removed, false otherwise.
        *
        * @param item The item to remove from the array.
        */
        UniqueArray.prototype.erase = function (item) {
            var array = this._array;
            var index = tsu.binarySearch(array, item, this._compare);
            if (index < 0) {
                return false;
            }
            array.splice(index, 1);
            return true;
        };

        /**
        * Create a copy of this unique array.
        */
        UniqueArray.prototype.copy = function () {
            var theCopy = new UniqueArray(this._compare);
            theCopy._array = this._array.slice();
            return theCopy;
        };

        UniqueArray.prototype.isDisjoint = function (object) {
            var cmp = this._compare;
            var other = toSet(object, cmp);
            return tsu.setIsDisjoint(this._array, other, cmp);
        };

        UniqueArray.prototype.isSubset = function (object) {
            var cmp = this._compare;
            var other = toSet(object, cmp);
            return tsu.setIsSubset(this._array, other, cmp);
        };

        UniqueArray.prototype.isSuperset = function (object) {
            var cmp = this._compare;
            var other = toSet(object, cmp);
            return tsu.setIsSubset(other, this._array, cmp);
        };

        UniqueArray.prototype.union = function (object) {
            var cmp = this._compare;
            var res = new UniqueArray(cmp);
            var other = toSet(object, cmp);
            res._array = tsu.setUnion(this._array, other, cmp);
            return res;
        };

        UniqueArray.prototype.intersection = function (object) {
            var cmp = this._compare;
            var res = new UniqueArray(cmp);
            var other = toSet(object, cmp);
            res._array = tsu.setIntersection(this._array, other, cmp);
            return res;
        };

        UniqueArray.prototype.difference = function (object) {
            var cmp = this._compare;
            var res = new UniqueArray(cmp);
            var other = toSet(object, cmp);
            res._array = tsu.setDifference(this._array, other, cmp);
            return res;
        };

        UniqueArray.prototype.symmetricDifference = function (object) {
            var cmp = this._compare;
            var res = new UniqueArray(cmp);
            var other = toSet(object, cmp);
            res._array = tsu.setSymmetricDifference(this._array, other, cmp);
            return res;
        };

        UniqueArray.prototype.unionUpdate = function (object) {
            var cmp = this._compare;
            var other = toSet(object, cmp);
            this._array = tsu.setUnion(this._array, other, cmp);
        };

        UniqueArray.prototype.intersectionUpdate = function (object) {
            var cmp = this._compare;
            var other = toSet(object, cmp);
            this._array = tsu.setIntersection(this._array, other, cmp);
        };

        UniqueArray.prototype.differenceUpdate = function (object) {
            var cmp = this._compare;
            var other = toSet(object, cmp);
            this._array = tsu.setDifference(this._array, other, cmp);
        };

        UniqueArray.prototype.symmetricDifferenceUpdate = function (object) {
            var cmp = this._compare;
            var other = toSet(object, cmp);
            this._array = tsu.setSymmetricDifference(this._array, other, cmp);
        };
        return UniqueArray;
    })(tsu.ArrayBase);
    tsu.UniqueArray = UniqueArray;



    function toSet(arg, cmp) {
        if (arg instanceof UniqueArray) {
            return arg._array;
        }
        return tsu.asSet(arg, cmp);
    }
})(tsu || (tsu = {}));

/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
/// <reference path="algorithm.ts"/>
/// <reference path="array_base.ts"/>
/// <reference path="associative_array.ts"/>
/// <reference path="iterator.ts"/>
/// <reference path="unique_array.ts"/>
/// <reference path="utility.ts"/>

/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
// <reference path="expression.ts">
// <reference path="strength.ts">
var kiwi;
(function (kiwi) {
    /**
    * An enum defining the linear constraint operators.
    */
    (function (Operator) {
        Operator[Operator["Le"] = 0] = "Le";
        Operator[Operator["Ge"] = 1] = "Ge";
        Operator[Operator["Eq"] = 2] = "Eq";
    })(kiwi.Operator || (kiwi.Operator = {}));
    var Operator = kiwi.Operator;

    /**
    * A linear constraint equation.
    *
    * A constraint equation is composed of an expression, an operator,
    * and a strength. The RHS of the equation is implicitly zero.
    *
    * @class
    */
    var Constraint = (function () {
        /**
        * Construct a new Constraint.
        *
        * @param expression The constraint expression.
        * @param operator The equation operator.
        * @param strength The strength of the constraint.
        */
        function Constraint(expression, operator, strength) {
            if (typeof strength === "undefined") { strength = kiwi.Strength.required; }
            this._id = CnId++;
            this._operator = operator;
            this._expression = expression;
            this._strength = kiwi.Strength.clip(strength);
        }
        /**
        * A static constraint comparison function.
        */
        Constraint.Compare = function (a, b) {
            return a.id() - b.id();
        };

        /**
        * Returns the unique id number of the constraint.
        */
        Constraint.prototype.id = function () {
            return this._id;
        };

        /**
        * Returns the expression of the constraint.
        */
        Constraint.prototype.expression = function () {
            return this._expression;
        };

        /**
        * Returns the relational operator of the constraint.
        */
        Constraint.prototype.op = function () {
            return this._operator;
        };

        /**
        * Returns the strength of the constraint.
        */
        Constraint.prototype.strength = function () {
            return this._strength;
        };
        return Constraint;
    })();
    kiwi.Constraint = Constraint;

    /**
    * The internal constraint id counter.
    */
    var CnId = 0;
})(kiwi || (kiwi = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
/// <reference path="../thirdparty/tsu.d.ts"/>
var kiwi;
(function (kiwi) {
    function createMap(compare) {
        return new tsu.AssociativeArray(compare);
    }
    kiwi.createMap = createMap;
})(kiwi || (kiwi = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
var kiwi;
(function (kiwi) {
    /**
    * The primary user constraint variable.
    *
    * @class
    */
    var Variable = (function () {
        /**
        * Construct a new Variable
        *
        * @param [name] The name to associated with the variable.
        */
        function Variable(name) {
            if (typeof name === "undefined") { name = ""; }
            this._value = 0.0;
            this._context = null;
            this._id = VarId++;
            this._name = name;
        }
        /**
        * A static variable comparison function.
        */
        Variable.Compare = function (a, b) {
            return a.id() - b.id();
        };

        /**
        * Returns the unique id number of the variable.
        */
        Variable.prototype.id = function () {
            return this._id;
        };

        /**
        * Returns the name of the variable.
        */
        Variable.prototype.name = function () {
            return this._name;
        };

        /**
        * Set the name of the variable.
        */
        Variable.prototype.setName = function (name) {
            this._name = name;
        };

        /**
        * Returns the user context object of the variable.
        */
        Variable.prototype.context = function () {
            return this._context;
        };

        /**
        * Set the user context object of the variable.
        */
        Variable.prototype.setContext = function (context) {
            this._context = context;
        };

        /**
        * Returns the value of the variable.
        */
        Variable.prototype.value = function () {
            return this._value;
        };

        /**
        * Set the value of the variable.
        */
        Variable.prototype.setValue = function (value) {
            this._value = value;
        };
        return Variable;
    })();
    kiwi.Variable = Variable;

    /**
    * The internal variable id counter.
    */
    var VarId = 0;
})(kiwi || (kiwi = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
/// <reference path="../thirdparty/tsu.d.ts"/>
/// <reference path="maptype.ts"/>
/// <reference path="variable.ts"/>
var kiwi;
(function (kiwi) {
    /**
    * An expression of variable terms and a constant.
    *
    * @class
    */
    var Expression = (function () {
        function Expression() {
            var parsed = parseArgs(arguments);
            this._terms = parsed.terms;
            this._constant = parsed.constant;
        }
        /**
        * Returns the mapping of terms in the expression.
        *
        * This *must* be treated as const.
        */
        Expression.prototype.terms = function () {
            return this._terms;
        };

        /**
        * Returns the constant of the expression.
        */
        Expression.prototype.constant = function () {
            return this._constant;
        };

        /**
        * Returns the computed value of the expression.
        */
        Expression.prototype.value = function () {
            var result = this._constant;
            tsu.forEach(this._terms, function (pair) {
                result += pair.first.value() * pair.second;
            });
            return result;
        };
        return Expression;
    })();
    kiwi.Expression = Expression;



    /**
    * An internal argument parsing function.
    */
    function parseArgs(args) {
        var constant = 0.0;
        var factory = function () {
            return 0.0;
        };
        var terms = kiwi.createMap(kiwi.Variable.Compare);
        for (var i = 0, n = args.length; i < n; ++i) {
            var item = args[i];
            if (typeof item === "number") {
                constant += item;
            } else if (item instanceof kiwi.Variable) {
                terms.setDefault(item, factory).second += 1.0;
            } else if (item instanceof Array) {
                if (item.length !== 2) {
                    throw new Error("array must have length 2");
                }
                var value = item[0];
                var variable = item[1];
                if (typeof value !== "number") {
                    throw new Error("array item 0 must be a number");
                }
                if (!(variable instanceof kiwi.Variable)) {
                    throw new Error("array item 1 must be a variable");
                }
                terms.setDefault(variable, factory).second += value;
            } else {
                throw new Error("invalid Expression argument: " + item);
            }
        }
        return { terms: terms, constant: constant };
    }
})(kiwi || (kiwi = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
var kiwi;
(function (kiwi) {
    (function (Strength) {
        /**
        * Create a new symbolic strength.
        */
        function create(a, b, c, w) {
            if (typeof w === "undefined") { w = 1.0; }
            var result = 0.0;
            result += Math.max(0.0, Math.min(1000.0, a * w)) * 1000000.0;
            result += Math.max(0.0, Math.min(1000.0, b * w)) * 1000.0;
            result += Math.max(0.0, Math.min(1000.0, c * w));
            return result;
        }
        Strength.create = create;

        /**
        * The 'required' symbolic strength.
        */
        Strength.required = create(1000.0, 1000.0, 1000.0);

        /**
        * The 'strong' symbolic strength.
        */
        Strength.strong = create(1.0, 0.0, 0.0);

        /**
        * The 'medium' symbolic strength.
        */
        Strength.medium = create(0.0, 1.0, 0.0);

        /**
        * The 'weak' symbolic strength.
        */
        Strength.weak = create(0.0, 0.0, 1.0);

        /**
        * Clip a symbolic strength to the allowed min and max.
        */
        function clip(value) {
            return Math.max(0.0, Math.min(Strength.required, value));
        }
        Strength.clip = clip;
    })(kiwi.Strength || (kiwi.Strength = {}));
    var Strength = kiwi.Strength;
})(kiwi || (kiwi = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
/// <reference path="../thirdparty/tsu.d.ts"/>
/// <reference path="constraint.ts"/>
/// <reference path="expression.ts"/>
/// <reference path="maptype.ts"/>
/// <reference path="strength.ts"/>
/// <reference path="variable.ts"/>
var kiwi;
(function (kiwi) {
    /**
    * The constraint solver class.
    *
    * @class
    */
    var Solver = (function () {
        /**
        * Construct a new Solver.
        */
        function Solver() {
            this._cnMap = createCnMap();
            this._rowMap = createRowMap();
            this._varMap = createVarMap();
            this._editMap = createEditMap();
            this._infeasibleRows = [];
            this._objective = new Row();
            this._artificial = null;
            this._idTick = 0;
        }
        /**
        * Add a constraint to the solver.
        */
        Solver.prototype.addConstraint = function (constraint) {
            var cnPair = this._cnMap.find(constraint);
            if (cnPair !== undefined) {
                throw new Error("duplicate constraint");
            }

            // Creating a row causes symbols to be reserved for the variables
            // in the constraint. If this method exits with an exception,
            // then its possible those variables will linger in the var map.
            // Since its likely that those variables will be used in other
            // constraints and since exceptional conditions are uncommon,
            // i'm not too worried about aggressive cleanup of the var map.
            var data = this._createRow(constraint);
            var row = data.row;
            var tag = data.tag;
            var subject = this._chooseSubject(row, tag);

            // If chooseSubject couldnt find a valid entering symbol, one
            // last option is available if the entire row is composed of
            // dummy variables. If the constant of the row is zero, then
            // this represents redundant constraints and the new dummy
            // marker can enter the basis. If the constant is non-zero,
            // then it represents an unsatisfiable constraint.
            if (subject.type() === 0 /* Invalid */ && row.allDummies()) {
                if (!nearZero(row.constant())) {
                    throw new Error("unsatifiable constraint");
                } else {
                    subject = tag.marker;
                }
            }

            // If an entering symbol still isn't found, then the row must
            // be added using an artificial variable. If that fails, then
            // the row represents an unsatisfiable constraint.
            if (subject.type() === 0 /* Invalid */) {
                if (!this._addWithArtificialVariable(row)) {
                    throw new Error("unsatisfiable constraint");
                }
            } else {
                row.solveFor(subject);
                this._substitute(subject, row);
                this._rowMap.insert(subject, row);
            }

            this._cnMap.insert(constraint, tag);

            // Optimizing after each constraint is added performs less
            // aggregate work due to a smaller average system size. It
            // also ensures the solver remains in a consistent state.
            this._optimize(this._objective);
        };

        /**
        * Remove a constraint from the solver.
        */
        Solver.prototype.removeConstraint = function (constraint) {
            var cnPair = this._cnMap.erase(constraint);
            if (cnPair === undefined) {
                throw new Error("unknown constraint");
            }

            // Remove the error effects from the objective function
            // *before* pivoting, or substitutions into the objective
            // will lead to incorrect solver results.
            this._removeConstraintEffects(constraint, cnPair.second);

            // If the marker is basic, simply drop the row. Otherwise,
            // pivot the marker into the basis and then drop the row.
            var marker = cnPair.second.marker;
            var rowPair = this._rowMap.erase(marker);
            if (rowPair === undefined) {
                var leaving = this._getMarkerLeavingSymbol(marker);
                if (leaving.type() === 0 /* Invalid */) {
                    throw new Error("failed to find leaving row");
                }
                rowPair = this._rowMap.erase(leaving);
                rowPair.second.solveForEx(leaving, marker);
                this._substitute(marker, rowPair.second);
            }

            // Optimizing after each constraint is removed ensures that the
            // solver remains consistent. It makes the solver api easier to
            // use at a small tradeoff for speed.
            this._optimize(this._objective);
        };

        /**
        * Test whether the solver contains the constraint.
        */
        Solver.prototype.hasConstraint = function (constraint) {
            return this._cnMap.contains(constraint);
        };

        /**
        * Add an edit variable to the solver.
        */
        Solver.prototype.addEditVariable = function (variable, strength) {
            var editPair = this._editMap.find(variable);
            if (editPair !== undefined) {
                throw new Error("duplicate edit variable");
            }
            strength = kiwi.Strength.clip(strength);
            if (strength === kiwi.Strength.required) {
                throw new Error("bad required strength");
            }
            var expr = new kiwi.Expression(variable);
            var cn = new kiwi.Constraint(expr, 2 /* Eq */, strength);
            this.addConstraint(cn);
            var tag = this._cnMap.find(cn).second;
            var info = { tag: tag, constraint: cn, constant: 0.0 };
            this._editMap.insert(variable, info);
        };

        /**
        * Remove an edit variable from the solver.
        */
        Solver.prototype.removeEditVariable = function (variable) {
            var editPair = this._editMap.erase(variable);
            if (editPair === undefined) {
                throw new Error("unknown edit variable");
            }
            this.removeConstraint(editPair.second.constraint);
        };

        /**
        * Test whether the solver contains the edit variable.
        */
        Solver.prototype.hasEditVariable = function (variable) {
            return this._editMap.contains(variable);
        };

        /**
        * Suggest the value of an edit variable.
        */
        Solver.prototype.suggestValue = function (variable, value) {
            var editPair = this._editMap.find(variable);
            if (editPair === undefined) {
                throw new Error("unknown edit variable");
            }

            var rows = this._rowMap;
            var info = editPair.second;
            var delta = value - info.constant;
            info.constant = value;

            // Check first if the positive error variable is basic.
            var marker = info.tag.marker;
            var rowPair = rows.find(marker);
            if (rowPair !== undefined) {
                if (rowPair.second.add(-delta) < 0.0) {
                    this._infeasibleRows.push(marker);
                }
                this._dualOptimize();
                return;
            }

            // Check next if the negative error variable is basic.
            var other = info.tag.other;
            var rowPair = rows.find(other);
            if (rowPair !== undefined) {
                if (rowPair.second.add(delta) < 0.0) {
                    this._infeasibleRows.push(other);
                }
                this._dualOptimize();
                return;
            }

            for (var i = 0, n = rows.size(); i < n; ++i) {
                var rowPair = rows.itemAt(i);
                var row = rowPair.second;
                var coeff = row.coefficientFor(marker);
                if (coeff !== 0.0 && row.add(delta * coeff) < 0.0 && rowPair.first.type() !== 1 /* External */) {
                    this._infeasibleRows.push(rowPair.first);
                }
            }
            this._dualOptimize();
        };

        /**
        * Update the values of the variables.
        */
        Solver.prototype.updateVariables = function () {
            var vars = this._varMap;
            var rows = this._rowMap;
            for (var i = 0, n = vars.size(); i < n; ++i) {
                var pair = vars.itemAt(i);
                var rowPair = rows.find(pair.second);
                if (rowPair !== undefined) {
                    pair.first.setValue(rowPair.second.constant());
                } else {
                    pair.first.setValue(0.0);
                }
            }
        };

        /**
        * Get the symbol for the given variable.
        *
        * If a symbol does not exist for the variable, one will be created.
        */
        Solver.prototype._getVarSymbol = function (variable) {
            var _this = this;
            var factory = function () {
                return _this._makeSymbol(1 /* External */);
            };
            return this._varMap.setDefault(variable, factory).second;
        };

        /**
        * Create a new Row object for the given constraint.
        *
        * The terms in the constraint will be converted to cells in the row.
        * Any term in the constraint with a coefficient of zero is ignored.
        * This method uses the `_getVarSymbol` method to get the symbol for
        * the variables added to the row. If the symbol for a given cell
        * variable is basic, the cell variable will be substituted with the
        * basic row.
        *
        * The necessary slack and error variables will be added to the row.
        * If the constant for the row is negative, the sign for the row
        * will be inverted so the constant becomes positive.
        *
        * Returns the created Row and the tag for tracking the constraint.
        */
        Solver.prototype._createRow = function (constraint) {
            var expr = constraint.expression();
            var row = new Row(expr.constant());

            // Substitute the current basic variables into the row.
            var terms = expr.terms();
            for (var i = 0, n = terms.size(); i < n; ++i) {
                var termPair = terms.itemAt(i);
                if (!nearZero(termPair.second)) {
                    var symbol = this._getVarSymbol(termPair.first);
                    var basicPair = this._rowMap.find(symbol);
                    if (basicPair !== undefined) {
                        row.insertRow(basicPair.second, termPair.second);
                    } else {
                        row.insertSymbol(symbol, termPair.second);
                    }
                }
            }

            // Add the necessary slack, error, and dummy variables.
            var objective = this._objective;
            var strength = constraint.strength();
            var tag = { marker: INVALID_SYMBOL, other: INVALID_SYMBOL };
            switch (constraint.op()) {
                case 0 /* Le */:
                case 1 /* Ge */: {
                    var coeff = constraint.op() === 0 /* Le */ ? 1.0 : -1.0;
                    var slack = this._makeSymbol(2 /* Slack */);
                    tag.marker = slack;
                    row.insertSymbol(slack, coeff);
                    if (strength < kiwi.Strength.required) {
                        var error = this._makeSymbol(3 /* Error */);
                        tag.other = error;
                        row.insertSymbol(error, -coeff);
                        objective.insertSymbol(error, strength);
                    }
                    break;
                }
                case 2 /* Eq */: {
                    if (strength < kiwi.Strength.required) {
                        var errplus = this._makeSymbol(3 /* Error */);
                        var errminus = this._makeSymbol(3 /* Error */);
                        tag.marker = errplus;
                        tag.other = errminus;
                        row.insertSymbol(errplus, -1.0); // v = eplus - eminus
                        row.insertSymbol(errminus, 1.0); // v - eplus + eminus = 0
                        objective.insertSymbol(errplus, strength);
                        objective.insertSymbol(errminus, strength);
                    } else {
                        var dummy = this._makeSymbol(4 /* Dummy */);
                        tag.marker = dummy;
                        row.insertSymbol(dummy);
                    }
                    break;
                }
            }

            // Ensure the row has a positive constant.
            if (row.constant() < 0.0) {
                row.reverseSign();
            }

            return { row: row, tag: tag };
        };

        /**
        * Choose the subject for solving for the row.
        *
        * This method will choose the best subject for using as the solve
        * target for the row. An invalid symbol will be returned if there
        * is no valid target.
        *
        * The symbols are chosen according to the following precedence:
        *
        * 1) The first symbol representing an external variable.
        * 2) A negative slack or error tag variable.
        *
        * If a subject cannot be found, an invalid symbol will be returned.
        */
        Solver.prototype._chooseSubject = function (row, tag) {
            var cells = row.cells();
            for (var i = 0, n = cells.size(); i < n; ++i) {
                var pair = cells.itemAt(i);
                if (pair.first.type() === 1 /* External */) {
                    return pair.first;
                }
            }
            var type = tag.marker.type();
            if (type === 2 /* Slack */ || type === 3 /* Error */) {
                if (row.coefficientFor(tag.marker) < 0.0) {
                    return tag.marker;
                }
            }
            type = tag.other.type();
            if (type === 2 /* Slack */ || type === 3 /* Error */) {
                if (row.coefficientFor(tag.other) < 0.0) {
                    return tag.other;
                }
            }
            return INVALID_SYMBOL;
        };

        /**
        * Add the row to the tableau using an artificial variable.
        *
        * This will return false if the constraint cannot be satisfied.
        */
        Solver.prototype._addWithArtificialVariable = function (row) {
            // Create and add the artificial variable to the tableau.
            var art = this._makeSymbol(2 /* Slack */);
            this._rowMap.insert(art, row.copy());
            this._artificial = row.copy();

            // Optimize the artificial objective. This is successful
            // only if the artificial objective is optimized to zero.
            this._optimize(this._artificial);
            var success = nearZero(this._artificial.constant());
            this._artificial = null;

            // If the artificial variable is basic, pivot the row so that
            // it becomes non-basic. If the row is constant, exit early.
            var pair = this._rowMap.erase(art);
            if (pair !== undefined) {
                var basicRow = pair.second;
                if (basicRow.isConstant()) {
                    return success;
                }
                var entering = this._anyPivotableSymbol(basicRow);
                if (entering.type() === 0 /* Invalid */) {
                    return false;
                }
                basicRow.solveForEx(art, entering);
                this._substitute(entering, basicRow);
                this._rowMap.insert(entering, basicRow);
            }

            // Remove the artificial variable from the tableau.
            var rows = this._rowMap;
            for (var i = 0, n = rows.size(); i < n; ++i) {
                rows.itemAt(i).second.removeSymbol(art);
            }
            this._objective.removeSymbol(art);
            return success;
        };

        /**
        * Substitute the parametric symbol with the given row.
        *
        * This method will substitute all instances of the parametric symbol
        * in the tableau and the objective function with the given row.
        */
        Solver.prototype._substitute = function (symbol, row) {
            var rows = this._rowMap;
            for (var i = 0, n = rows.size(); i < n; ++i) {
                var pair = rows.itemAt(i);
                pair.second.substitute(symbol, row);
                if (pair.second.constant() < 0.0 && pair.first.type() !== 1 /* External */) {
                    this._infeasibleRows.push(pair.first);
                }
            }
            this._objective.substitute(symbol, row);
            if (this._artificial) {
                this._artificial.substitute(symbol, row);
            }
        };

        /**
        * Optimize the system for the given objective function.
        *
        * This method performs iterations of Phase 2 of the simplex method
        * until the objective function reaches a minimum.
        */
        Solver.prototype._optimize = function (objective) {
            while (true) {
                var entering = this._getEnteringSymbol(objective);
                if (entering.type() === 0 /* Invalid */) {
                    return;
                }
                var leaving = this._getLeavingSymbol(entering);
                if (leaving.type() === 0 /* Invalid */) {
                    throw new Error("the objective is unbounded");
                }

                // pivot the entering symbol into the basis
                var row = this._rowMap.erase(leaving).second;
                row.solveForEx(leaving, entering);
                this._substitute(entering, row);
                this._rowMap.insert(entering, row);
            }
        };

        /**
        * Optimize the system using the dual of the simplex method.
        *
        * The current state of the system should be such that the objective
        * function is optimal, but not feasible. This method will perform
        * an iteration of the dual simplex method to make the solution both
        * optimal and feasible.
        */
        Solver.prototype._dualOptimize = function () {
            var rows = this._rowMap;
            var infeasible = this._infeasibleRows;
            while (infeasible.length !== 0) {
                var leaving = infeasible.pop();
                var pair = rows.find(leaving);
                if (pair !== undefined && pair.second.constant() < 0.0) {
                    var entering = this._getDualEnteringSymbol(pair.second);
                    if (entering.type() === 0 /* Invalid */) {
                        throw new Error("dual optimize failed");
                    }

                    // pivot the entering symbol into the basis
                    var row = pair.second;
                    rows.erase(leaving);
                    row.solveForEx(leaving, entering);
                    this._substitute(entering, row);
                    rows.insert(entering, row);
                }
            }
        };

        /**
        * Compute the entering variable for a pivot operation.
        *
        * This method will return first symbol in the objective function which
        * is non-dummy and has a coefficient less than zero. If no symbol meets
        * the criteria, it means the objective function is at a minimum, and an
        * invalid symbol is returned.
        */
        Solver.prototype._getEnteringSymbol = function (objective) {
            var cells = objective.cells();
            for (var i = 0, n = cells.size(); i < n; ++i) {
                var pair = cells.itemAt(i);
                var symbol = pair.first;
                if (pair.second < 0.0 && symbol.type() !== 4 /* Dummy */) {
                    return symbol;
                }
            }
            return INVALID_SYMBOL;
        };

        /**
        * Compute the entering symbol for the dual optimize operation.
        *
        * This method will return the symbol in the row which has a positive
        * coefficient and yields the minimum ratio for its respective symbol
        * in the objective function. The provided row *must* be infeasible.
        * If no symbol is found which meats the criteria, an invalid symbol
        * is returned.
        */
        Solver.prototype._getDualEnteringSymbol = function (row) {
            var ratio = Number.MAX_VALUE;
            var entering = INVALID_SYMBOL;
            var cells = row.cells();
            for (var i = 0, n = cells.size(); i < n; ++i) {
                var pair = cells.itemAt(i);
                var symbol = pair.first;
                var c = pair.second;
                if (c > 0.0 && symbol.type() !== 4 /* Dummy */) {
                    var coeff = this._objective.coefficientFor(symbol);
                    var r = coeff / c;
                    if (r < ratio) {
                        ratio = r;
                        entering = symbol;
                    }
                }
            }
            return entering;
        };

        /**
        * Compute the symbol for pivot exit row.
        *
        * This method will return the symbol for the exit row in the row
        * map. If no appropriate exit symbol is found, an invalid symbol
        * will be returned. This indicates that the objective function is
        * unbounded.
        */
        Solver.prototype._getLeavingSymbol = function (entering) {
            var ratio = Number.MAX_VALUE;
            var found = INVALID_SYMBOL;
            var rows = this._rowMap;
            for (var i = 0, n = rows.size(); i < n; ++i) {
                var pair = rows.itemAt(i);
                var symbol = pair.first;
                if (symbol.type() !== 1 /* External */) {
                    var row = pair.second;
                    var temp = row.coefficientFor(entering);
                    if (temp < 0.0) {
                        var temp_ratio = -row.constant() / temp;
                        if (temp_ratio < ratio) {
                            ratio = temp_ratio;
                            found = symbol;
                        }
                    }
                }
            }
            return found;
        };

        /**
        * Compute the leaving symbol for a marker variable.
        *
        * This method will return a symbol corresponding to a basic row
        * which holds the given marker variable. The row will be chosen
        * according to the following precedence:
        *
        * 1) The row with a restricted basic varible and a negative coefficient
        *    for the marker with the smallest ratio of -constant / coefficient.
        *
        * 2) The row with a restricted basic variable and the smallest ratio
        *    of constant / coefficient.
        *
        * 3) The last unrestricted row which contains the marker.
        *
        * If the marker does not exist in any row, an invalid symbol will be
        * returned. This indicates an internal solver error since the marker
        * *should* exist somewhere in the tableau.
        */
        Solver.prototype._getMarkerLeavingSymbol = function (marker) {
            var dmax = Number.MAX_VALUE;
            var r1 = dmax;
            var r2 = dmax;
            var invalid = INVALID_SYMBOL;
            var first = invalid;
            var second = invalid;
            var third = invalid;
            var rows = this._rowMap;
            for (var i = 0, n = rows.size(); i < n; ++i) {
                var pair = rows.itemAt(i);
                var row = pair.second;
                var c = row.coefficientFor(marker);
                if (c === 0.0) {
                    continue;
                }
                var symbol = pair.first;
                if (symbol.type() === 1 /* External */) {
                    third = symbol;
                } else if (c < 0.0) {
                    var r = -row.constant() / c;
                    if (r < r1) {
                        r1 = r;
                        first = symbol;
                    }
                } else {
                    var r = row.constant() / c;
                    if (r < r2) {
                        r2 = r;
                        second = symbol;
                    }
                }
            }
            if (first !== invalid) {
                return first;
            }
            if (second !== invalid) {
                return second;
            }
            return third;
        };

        /**
        * Remove the effects of a constraint on the objective function.
        */
        Solver.prototype._removeConstraintEffects = function (cn, tag) {
            if (tag.marker.type() === 3 /* Error */) {
                this._removeMarkerEffects(tag.marker, cn.strength());
            }
            if (tag.other.type() === 3 /* Error */) {
                this._removeMarkerEffects(tag.other, cn.strength());
            }
        };

        /**
        * Remove the effects of an error marker on the objective function.
        */
        Solver.prototype._removeMarkerEffects = function (marker, strength) {
            var pair = this._rowMap.find(marker);
            if (pair !== undefined) {
                this._objective.insertRow(pair.second, -strength);
            } else {
                this._objective.insertSymbol(marker, -strength);
            }
        };

        /**
        * Get the first Slack or Error symbol in the row.
        *
        * If no such symbol is present, an invalid symbol will be returned.
        */
        Solver.prototype._anyPivotableSymbol = function (row) {
            var cells = row.cells();
            for (var i = 0, n = cells.size(); i < n; ++i) {
                var pair = cells.itemAt(i);
                var type = pair.first.type();
                if (type === 2 /* Slack */ || type === 3 /* Error */) {
                    return pair.first;
                }
            }
            return INVALID_SYMBOL;
        };

        /**
        * Returns a new Symbol of the given type.
        */
        Solver.prototype._makeSymbol = function (type) {
            return new Symbol(type, this._idTick++);
        };
        return Solver;
    })();
    kiwi.Solver = Solver;

    /**
    * Test whether a value is approximately zero.
    */
    function nearZero(value) {
        var eps = 1.0e-8;
        return value < 0.0 ? -value < eps : value < eps;
    }







    /**
    * An internal function for creating a constraint map.
    */
    function createCnMap() {
        return kiwi.createMap(kiwi.Constraint.Compare);
    }

    /**
    * An internal function for creating a row map.
    */
    function createRowMap() {
        return kiwi.createMap(Symbol.Compare);
    }

    /**
    * An internal function for creating a variable map.
    */
    function createVarMap() {
        return kiwi.createMap(kiwi.Variable.Compare);
    }

    /**
    * An internal function for creating an edit map.
    */
    function createEditMap() {
        return kiwi.createMap(kiwi.Variable.Compare);
    }

    /**
    * An enum defining the available symbol types.
    */
    var SymbolType;
    (function (SymbolType) {
        SymbolType[SymbolType["Invalid"] = 0] = "Invalid";
        SymbolType[SymbolType["External"] = 1] = "External";
        SymbolType[SymbolType["Slack"] = 2] = "Slack";
        SymbolType[SymbolType["Error"] = 3] = "Error";
        SymbolType[SymbolType["Dummy"] = 4] = "Dummy";
    })(SymbolType || (SymbolType = {}));

    /**
    * An internal class representing a symbol in the solver.
    */
    var Symbol = (function () {
        /**
        * Construct a new Symbol
        *
        * @param [type] The type of the symbol.
        * @param [id] The unique id number of the symbol.
        */
        function Symbol(type, id) {
            this._id = id;
            this._type = type;
        }
        /**
        * The static Symbol comparison function.
        */
        Symbol.Compare = function (a, b) {
            return a.id() - b.id();
        };

        /**
        * Returns the unique id number of the symbol.
        */
        Symbol.prototype.id = function () {
            return this._id;
        };

        /**
        * Returns the type of the symbol.
        */
        Symbol.prototype.type = function () {
            return this._type;
        };
        return Symbol;
    })();

    /**
    * A static invalid symbol
    */
    var INVALID_SYMBOL = new Symbol(0 /* Invalid */, -1);

    /**
    * An internal row class used by the solver.
    */
    var Row = (function () {
        /**
        * Construct a new Row.
        */
        function Row(constant) {
            if (typeof constant === "undefined") { constant = 0.0; }
            this._cellMap = kiwi.createMap(Symbol.Compare);
            this._constant = constant;
        }
        /**
        * Returns the mapping of symbols to coefficients.
        */
        Row.prototype.cells = function () {
            return this._cellMap;
        };

        /**
        * Returns the constant for the row.
        */
        Row.prototype.constant = function () {
            return this._constant;
        };

        /**
        * Returns true if the row is a constant value.
        */
        Row.prototype.isConstant = function () {
            return this._cellMap.empty();
        };

        /**
        * Returns true if the Row has all dummy symbols.
        */
        Row.prototype.allDummies = function () {
            var cells = this._cellMap;
            for (var i = 0, n = cells.size(); i < n; ++i) {
                var pair = cells.itemAt(i);
                if (pair.first.type() !== 4 /* Dummy */) {
                    return false;
                }
            }
            return true;
        };

        /**
        * Create a copy of the row.
        */
        Row.prototype.copy = function () {
            var theCopy = new Row(this._constant);
            theCopy._cellMap = this._cellMap.copy();
            return theCopy;
        };

        /**
        * Add a constant value to the row constant.
        *
        * Returns the new value of the constant.
        */
        Row.prototype.add = function (value) {
            return this._constant += value;
        };

        /**
        * Insert the symbol into the row with the given coefficient.
        *
        * If the symbol already exists in the row, the coefficient
        * will be added to the existing coefficient. If the resulting
        * coefficient is zero, the symbol will be removed from the row.
        */
        Row.prototype.insertSymbol = function (symbol, coefficient) {
            if (typeof coefficient === "undefined") { coefficient = 1.0; }
            var pair = this._cellMap.setDefault(symbol, function () {
                return 0.0;
            });
            if (nearZero(pair.second += coefficient)) {
                this._cellMap.erase(symbol);
            }
        };

        /**
        * Insert a row into this row with a given coefficient.
        *
        * The constant and the cells of the other row will be
        * multiplied by the coefficient and added to this row. Any
        * cell with a resulting coefficient of zero will be removed
        * from the row.
        */
        Row.prototype.insertRow = function (other, coefficient) {
            if (typeof coefficient === "undefined") { coefficient = 1.0; }
            this._constant += other._constant * coefficient;
            var cells = other._cellMap;
            for (var i = 0, n = cells.size(); i < n; ++i) {
                var pair = cells.itemAt(i);
                this.insertSymbol(pair.first, pair.second * coefficient);
            }
        };

        /**
        * Remove a symbol from the row.
        */
        Row.prototype.removeSymbol = function (symbol) {
            this._cellMap.erase(symbol);
        };

        /**
        * Reverse the sign of the constant and cells in the row.
        */
        Row.prototype.reverseSign = function () {
            this._constant = -this._constant;
            var cells = this._cellMap;
            for (var i = 0, n = cells.size(); i < n; ++i) {
                var pair = cells.itemAt(i);
                pair.second = -pair.second;
            }
        };

        /**
        * Solve the row for the given symbol.
        *
        * This method assumes the row is of the form
        * a * x + b * y + c = 0 and (assuming solve for x) will modify
        * the row to represent the right hand side of
        * x = -b/a * y - c / a. The target symbol will be removed from
        * the row, and the constant and other cells will be multiplied
        * by the negative inverse of the target coefficient.
        *
        * The given symbol *must* exist in the row.
        */
        Row.prototype.solveFor = function (symbol) {
            var cells = this._cellMap;
            var pair = cells.erase(symbol);
            var coeff = -1.0 / pair.second;
            this._constant *= coeff;
            for (var i = 0, n = cells.size(); i < n; ++i) {
                cells.itemAt(i).second *= coeff;
            }
        };

        /**
        * Solve the row for the given symbols.
        *
        * This method assumes the row is of the form
        * x = b * y + c and will solve the row such that
        * y = x / b - c / b. The rhs symbol will be removed from the
        * row, the lhs added, and the result divided by the negative
        * inverse of the rhs coefficient.
        *
        * The lhs symbol *must not* exist in the row, and the rhs
        * symbol must* exist in the row.
        */
        Row.prototype.solveForEx = function (lhs, rhs) {
            this.insertSymbol(lhs, -1.0);
            this.solveFor(rhs);
        };

        /**
        * Returns the coefficient for the given symbol.
        */
        Row.prototype.coefficientFor = function (symbol) {
            var pair = this._cellMap.find(symbol);
            return pair !== undefined ? pair.second : 0.0;
        };

        /**
        * Substitute a symbol with the data from another row.
        *
        * Given a row of the form a * x + b and a substitution of the
        * form x = 3 * y + c the row will be updated to reflect the
        * expression 3 * a * y + a * c + b.
        *
        * If the symbol does not exist in the row, this is a no-op.
        */
        Row.prototype.substitute = function (symbol, row) {
            var pair = this._cellMap.erase(symbol);
            if (pair !== undefined) {
                this.insertRow(row, pair.second);
            }
        };
        return Row;
    })();
})(kiwi || (kiwi = {}));
/*-----------------------------------------------------------------------------
| Copyright (c) 2014, Nucleic Development Team.
|
| Distributed under the terms of the Modified BSD License.
|
| The full license is in the file COPYING.txt, distributed with this software.
|----------------------------------------------------------------------------*/
/// <reference path="constraint.ts"/>
/// <reference path="expression.ts"/>
/// <reference path="maptype.ts"/>
/// <reference path="solver.ts"/>
/// <reference path="strength.ts"/>
/// <reference path="variable.ts"/>

module.exports = kiwi
