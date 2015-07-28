"use strict";
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var collections;
    (function (collections) {
        var algorithm;
        (function (algorithm) {
            /**
             * Find the index of the first occurrence of a value in an array.
             *
             * @param array - The array of values to be searched.
             *
             * @param value - The value to locate in the array.
             *
             * @param fromIndex - The starting index of the search. If this value
             *   is negative, it is taken as an offset from the end of the array.
             *   If the adjusted value is still negative, it is clamped to `0`.
             *
             * @param wrap - Whether the search wraps around at the end of the array.
             *   If `true` and the end of the array is reached without finding the
             *   value, the search will wrap to the front of the array and continue
             *   until one before `fromIndex`.
             *
             * @returns The index of the first occurrence of `value` in `array`,
             *   or `-1` if `value` is not in `array`.
             *
             * #### Notes
             * Values are compared using the strict equality `===` operator.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = ['zero', 'one', 'two', 'three', 'two', 'one', 'zero'];
             * algo.indexOf(data, 'two');           // 2
             * algo.indexOf(data, 'two', 3);        // 4
             * algo.indexOf(data, 'two', -4);       // 4
             * algo.indexOf(data, 'two', 5);        // -1
             * algo.indexOf(data, 'two', 5, true);  // 2
             * ```
             *
             * **See also** [[lastIndexOf]] and [[findIndex]].
             */
            function indexOf(array, value, fromIndex, wrap) {
                if (fromIndex === void 0) { fromIndex = 0; }
                if (wrap === void 0) { wrap = false; }
                var len = array.length;
                if (len === 0) {
                    return -1;
                }
                fromIndex = Math.floor(fromIndex);
                if (fromIndex < 0) {
                    fromIndex = Math.max(0, fromIndex + len);
                }
                if (wrap) {
                    for (var i = 0; i < len; ++i) {
                        var j = (i + fromIndex) % len;
                        if (array[j] === value) {
                            return j;
                        }
                    }
                }
                else {
                    for (var i = fromIndex; i < len; ++i) {
                        if (array[i] === value) {
                            return i;
                        }
                    }
                }
                return -1;
            }
            algorithm.indexOf = indexOf;
            /**
             * Find the index of the last occurrence of a value in an array.
             *
             * @param array - The array of values to be searched.
             *
             * @param value - The value to locate in the array.
             *
             * @param fromIndex - The starting index of the search. If this value
             *   is negative, it is taken as an offset from the end of the array.
             *   If this value is positive, it is clamped to `array.length - 1`.
             *
             * @param wrap - Whether the search wraps around at the front of the
             *   array. If `true` and the front of the array is reached without
             *   finding the value, the search will wrap to the end of the array
             *   and continue until one after `fromIndex`.
             *
             * @returns The index of the last occurrence of `value` in `array`,
             *   or `-1` if `value` is not in `array`.
             *
             * #### Notes
             * Values are compared using the strict equality `===` operator.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = ['zero', 'one', 'two', 'three', 'two', 'one', 'zero'];
             * algo.lastIndexOf(data, 'two');           // 4
             * algo.lastIndexOf(data, 'two', 3);        // 2
             * algo.lastIndexOf(data, 'two', -4);       // 2
             * algo.lastIndexOf(data, 'two', 1);        // -1
             * algo.lastIndexOf(data, 'two', 1, true);  // 4
             * ```
             *
             * **See also** [[indexOf]] and [[findLastIndex]].
             */
            function lastIndexOf(array, value, fromIndex, wrap) {
                if (fromIndex === void 0) { fromIndex = -1; }
                if (wrap === void 0) { wrap = false; }
                var len = array.length;
                if (len === 0) {
                    return -1;
                }
                fromIndex = Math.floor(fromIndex);
                if (fromIndex < 0) {
                    fromIndex += len;
                }
                else if (fromIndex >= len) {
                    fromIndex = len - 1;
                }
                if (wrap) {
                    for (var i = len; i > 0; --i) {
                        var j = (((i + fromIndex) % len) + len) % len;
                        if (array[j] === value) {
                            return j;
                        }
                    }
                }
                else {
                    for (var i = fromIndex; i >= 0; --i) {
                        if (array[i] === value) {
                            return i;
                        }
                    }
                }
                return -1;
            }
            algorithm.lastIndexOf = lastIndexOf;
            /**
             * Find the index of the first value in an array which matches a predicate.
             *
             * @param array - The array of values to be searched.
             *
             * @param pred - The predicate function to apply to the values.
             *
             * @param fromIndex - The starting index of the search. If this value
             *   is negative, it is taken as an offset from the end of the array.
             *   If the adjusted value is still negative, it is clamped to `0`.
             *
             * @param wrap - Whether the search wraps around at the end of the array.
             *   If `true` and the end of the array is reached without finding the
             *   value, the search will wrap to the front of the array and continue
             *   until one before `fromIndex`.
             *
             * @returns The index of the first matching value, or `-1` if no value
             *   matches the predicate.
             *
             * #### Notes
             * The range of visited indices is set before the first invocation of
             * `pred`. It is not safe for `pred` to change the length of `array`.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * function isEven(value: number): boolean {
             *   return value % 2 === 0;
             * }
             *
             * var data = [1, 2, 3, 4, 3, 2, 1];
             * algo.findIndex(data, isEven);           // 1
             * algo.findIndex(data, isEven, 4);        // 5
             * algo.findIndex(data, isEven, -4);       // 3
             * algo.findIndex(data, isEven, 6);        // -1
             * algo.findIndex(data, isEven, 6, true);  // 1
             * ```
             *
             * **See also** [[findLastIndex]] and [[indexOf]].
             */
            function findIndex(array, pred, fromIndex, wrap) {
                if (fromIndex === void 0) { fromIndex = 0; }
                if (wrap === void 0) { wrap = false; }
                var len = array.length;
                if (len === 0) {
                    return -1;
                }
                fromIndex = Math.floor(fromIndex);
                if (fromIndex < 0) {
                    fromIndex = Math.max(0, fromIndex + len);
                }
                if (wrap) {
                    for (var i = 0; i < len; ++i) {
                        var j = (i + fromIndex) % len;
                        if (pred(array[j], j)) {
                            return j;
                        }
                    }
                }
                else {
                    for (var i = fromIndex; i < len; ++i) {
                        if (pred(array[i], i)) {
                            return i;
                        }
                    }
                }
                return -1;
            }
            algorithm.findIndex = findIndex;
            /**
             * Find the index of the last value in an array which matches a predicate.
             *
             * @param array - The array of values to be searched.
             *
             * @param pred - The predicate function to apply to the values.
             *
             * @param fromIndex - The starting index of the search. If this value
             *   is negative, it is taken as an offset from the end of the array.
             *   If this value is positive, it is clamped to `array.length - 1`.
             *
             * @param wrap - Whether the search wraps around at the front of the
             *   array. If `true` and the front of the array is reached without
             *   finding the value, the search will wrap to the end of the array
             *   and continue until one after `fromIndex`.
             *
             * @returns The index of the last matching value, or `-1` if no value
             *   matches the predicate.
             *
             * #### Notes
             * The range of visited indices is set before the first invocation of
             * `pred`. It is not safe for `pred` to change the length of `array`.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * function isEven(value: number): boolean {
             *   return value % 2 === 0;
             * }
             *
             * var data = [1, 2, 3, 4, 3, 2, 1];
             * algo.findLastIndex(data, isEven);           // 5
             * algo.findLastIndex(data, isEven, 4);        // 3
             * algo.findLastIndex(data, isEven, -5);       // 1
             * algo.findLastIndex(data, isEven, 0);        // -1
             * algo.findLastIndex(data, isEven, 0, true);  // 5
             * ```
             *
             * **See also** [[findIndex]] and [[lastIndexOf]].
             */
            function findLastIndex(array, pred, fromIndex, wrap) {
                if (fromIndex === void 0) { fromIndex = -1; }
                if (wrap === void 0) { wrap = false; }
                var len = array.length;
                if (len === 0) {
                    return -1;
                }
                fromIndex = Math.floor(fromIndex);
                if (fromIndex < 0) {
                    fromIndex += len;
                }
                else if (fromIndex >= len) {
                    fromIndex = len - 1;
                }
                if (wrap) {
                    for (var i = len; i > 0; --i) {
                        var j = (((i + fromIndex) % len) + len) % len;
                        if (pred(array[j], j)) {
                            return j;
                        }
                    }
                }
                else {
                    for (var i = fromIndex; i >= 0; --i) {
                        if (pred(array[i], i)) {
                            return i;
                        }
                    }
                }
                return -1;
            }
            algorithm.findLastIndex = findLastIndex;
            /**
             * Find the first value in an array which matches a predicate.
             *
             * @param array - The array of values to be searched.
             *
             * @param pred - The predicate function to apply to the values.
             *
             * @param fromIndex - The starting index of the search. If this value
             *   is negative, it is taken as an offset from the end of the array.
             *   If the adjusted value is still negative, it is clamped to `0`.
             *
             * @param wrap - Whether the search wraps around at the end of the array.
             *   If `true` and the end of the array is reached without finding the
             *   value, the search will wrap to the front of the array and continue
             *   until one before `fromIndex`.
             *
             * @returns The first matching value, or `undefined` if no value matches
             *   the predicate.
             *
             * #### Notes
             * The range of visited indices is set before the first invocation of
             * `pred`. It is not safe for `pred` to change the length of `array`.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * function isEven(value: number): boolean {
             *   return value % 2 === 0;
             * }
             *
             * var data = [1, 2, 3, 4, 3, 2, 1];
             * algo.find(data, isEven);           // 2
             * algo.find(data, isEven, 4);        // 2
             * algo.find(data, isEven, -5);       // 4
             * algo.find(data, isEven, 6);        // undefined
             * algo.find(data, isEven, 6, true);  // 2
             * ```
             *
             * **See also** [[findLast]] and [[binaryFind]].
             */
            function find(array, pred, fromIndex, wrap) {
                var i = findIndex(array, pred, fromIndex, wrap);
                return i !== -1 ? array[i] : void 0;
            }
            algorithm.find = find;
            /**
             * Find the last value in an array which matches a predicate.
             *
             * @param array - The array of values to be searched.
             *
             * @param pred - The predicate function to apply to the values.
             *
             * @param fromIndex - The starting index of the search. If this value
             *   is negative, it is taken as an offset from the end of the array.
             *   If this value is positive, it is clamped to `array.length - 1`.
             *
             * @param wrap - Whether the search wraps around at the front of the
             *   array. If `true` and the front of the array is reached without
             *   finding the value, the search will wrap to the end of the array
             *   and continue until one after `fromIndex`.
             *
             * @returns The last matching value, or `undefined` if no value matches
             *   the predicate.
             *
             * #### Notes
             * The range of visited indices is set before the first invocation of
             * `pred`. It is not safe for `pred` to change the length of `array`.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * function isEven(value: number): boolean {
             *   return value % 2 === 0;
             * }
             *
             * var data = [1, 2, 3, 4, 3, 2, 1];
             * algo.findLast(data, isEven);           // 2
             * algo.findLast(data, isEven, 4);        // 4
             * algo.findLast(data, isEven, -1);       // 2
             * algo.findLast(data, isEven, 0);        // undefined
             * algo.findLast(data, isEven, 0, true);  // 2
             * ```
             *
             * **See also** [[find]] and [[binaryFindLast]].
             */
            function findLast(array, pred, fromIndex, wrap) {
                var i = findLastIndex(array, pred, fromIndex, wrap);
                return i !== -1 ? array[i] : void 0;
            }
            algorithm.findLast = findLast;
            /**
             * Using a binary search, find the index of the first element in an
             * array which compares `>=` to a value.
             *
             * @param array - The array of values to be searched. It must be sorted
             *   in ascending order.
             *
             * @param value - The value to locate in the array.
             *
             * @param cmp - The comparator function to apply to the values.
             *
             * @returns The index of the first element in `array` which compares
             *   `>=` to `value`, or `array.length` if there is no such element.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * function numberCmp(a: number, b: number): number {
             *   return a - b;
             * }
             *
             * var data = [0, 3, 4, 7, 7, 9];
             * algo.lowerBound(data, 0, numberCmp);   // 0
             * algo.lowerBound(data, 6, numberCmp);   // 3
             * algo.lowerBound(data, 7, numberCmp);   // 3
             * algo.lowerBound(data, -1, numberCmp);  // 0
             * algo.lowerBound(data, 10, numberCmp);  // 6
             * ```
             *
             * **See also** [[upperBound]] and [[binaryFindIndex]].
             */
            function lowerBound(array, value, cmp) {
                var begin = 0;
                var half;
                var middle;
                var n = array.length;
                while (n > 0) {
                    half = n >> 1;
                    middle = begin + half;
                    if (cmp(array[middle], value) < 0) {
                        begin = middle + 1;
                        n -= half + 1;
                    }
                    else {
                        n = half;
                    }
                }
                return begin;
            }
            algorithm.lowerBound = lowerBound;
            /**
             * Using a binary search, find the index of the first element in an
             * array which compares `>` than a value.
             *
             * @param array - The array of values to be searched. It must be sorted
             *   in ascending order.
             *
             * @param value - The value to locate in the array.
             *
             * @param cmp - The comparator function to apply to the values.
             *
             * @returns The index of the first element in `array` which compares
             *   `>` than `value`, or `array.length` if there is no such element.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * function numberCmp(a: number, b: number): number {
             *   return a - b;
             * }
             *
             * var data = [0, 3, 4, 7, 7, 9];
             * algo.upperBound(data, 0, numberCmp);   // 1
             * algo.upperBound(data, 6, numberCmp);   // 3
             * algo.upperBound(data, 7, numberCmp);   // 5
             * algo.upperBound(data, -1, numberCmp);  // 0
             * algo.upperBound(data, 10, numberCmp);  // 6
             * ```
             *
             * **See also** [[lowerBound]] and [[binaryFindLastIndex]].
             */
            function upperBound(array, value, cmp) {
                var begin = 0;
                var half;
                var middle;
                var n = array.length;
                while (n > 0) {
                    half = n >> 1;
                    middle = begin + half;
                    if (cmp(array[middle], value) > 0) {
                        n = half;
                    }
                    else {
                        begin = middle + 1;
                        n -= half + 1;
                    }
                }
                return begin;
            }
            algorithm.upperBound = upperBound;
            /**
             * Using a binary search, find the index of the first element in an
             * array which compares `==` to a value.
             *
             * @param array - The array of values to be searched. It must be sorted
             *   in ascending order.
             *
             * @param value - The value to locate in the array.
             *
             * @param cmp - The comparator function to apply to the values.
             *
             * @returns The index of the first element in `array` which compares
             *   `==` to `value`, or `-1` if there is no such element.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * function numberCmp(a: number, b: number): number {
             *   return a - b;
             * }
             *
             * var data = [0, 3, 4, 7, 7, 9];
             * algo.binaryFindIndex(data, 7, numberCmp);  // 3
             * algo.binaryFindIndex(data, 6, numberCmp);  // -1
             * ```
             *
             * **See also** [[binaryFindLastIndex]] and [[lowerBound]].
             */
            function binaryFindIndex(array, value, cmp) {
                var i = lowerBound(array, value, cmp);
                if (i === array.length) {
                    return -1;
                }
                if (cmp(array[i], value) === 0) {
                    return i;
                }
                return -1;
            }
            algorithm.binaryFindIndex = binaryFindIndex;
            /**
             * Using a binary search, find the index of the last element in an
             * array which compares `==` to a value.
             *
             * @param array - The array of values to be searched. It must be sorted
             *   in ascending order.
             *
             * @param value - The value to locate in the array.
             *
             * @param cmp - The comparator function to apply to the values.
             *
             * @returns The index of the last element in `array` which compares
             *   `==` to `value`, or `-1` if there is no such element.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * function numberCmp(a: number, b: number): number {
             *   return a - b;
             * }
             *
             * var data = [0, 3, 4, 7, 7, 9];
             * algo.binaryFindLastIndex(data, 7, numberCmp);  // 4
             * algo.binaryFindLastIndex(data, 6, numberCmp);  // -1
             * ```
             *
             * **See also** [[binaryFindIndex]] and [[upperBound]].
             */
            function binaryFindLastIndex(array, value, cmp) {
                var i = upperBound(array, value, cmp);
                if (i === 0) {
                    return -1;
                }
                if (cmp(array[i - 1], value) === 0) {
                    return i - 1;
                }
                return -1;
            }
            algorithm.binaryFindLastIndex = binaryFindLastIndex;
            /**
             * Using a binary search, find the first element in an array which
             * compares `==` to a value.
             *
             * @param array - The array of values to be searched. It must be sorted
             *   in ascending order.
             *
             * @param value - The value to locate in the array.
             *
             * @param cmp - The comparator function to apply to the values.
             *
             * @returns The first element in `array` which compares `==` to
             *   `value`, or `undefined` if there is no such element.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * interface IPair {
             *   rank: number;
             *   value: string;
             * }
             *
             * var data: IPair[] = [
             *   { rank: 0, value: 'zero' },
             *   { rank: 3, value: 'three' },
             *   { rank: 7, value: 'seven-A' },
             *   { rank: 7, value: 'seven-B' },
             *   { rank: 9, value: 'nine' },
             * ];
             *
             * function rankCmp(pair: IPair, rank: number): number {
             *   return pair.rank - rank;
             * }
             *
             * algo.binaryFind(data, 7, rankCmp);  // { rank: 7, value: 'seven-A' }
             * algo.binaryFind(data, 8, rankCmp);  // undefined
             * ```
             *
             * **See also** [[binaryFindLast]] and [[find]].
             */
            function binaryFind(array, value, cmp) {
                var i = binaryFindIndex(array, value, cmp);
                return i !== -1 ? array[i] : void 0;
            }
            algorithm.binaryFind = binaryFind;
            /**
             * Using a binary search, find the last element in an array which
             * compares `==` to a value.
             *
             * @param array - The array of values to be searched. It must be sorted
             *   in ascending order.
             *
             * @param value - The value to locate in the array.
             *
             * @param cmp - The comparator function to apply to the values.
             *
             * @returns The last element in `array` which compares `==` to
             *   `value`, or `undefined` if there is no such element.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * interface IPair {
             *   rank: number;
             *   value: string;
             * }
             *
             * var data: IPair[] = [
             *   { rank: 0, value: 'zero' },
             *   { rank: 3, value: 'three' },
             *   { rank: 7, value: 'seven-A' },
             *   { rank: 7, value: 'seven-B' },
             *   { rank: 9, value: 'nine' },
             * ];
             *
             * function rankCmp(pair: IPair, rank: number): number {
             *   return pair.rank - rank;
             * }
             *
             * algo.binaryFindLast(data, 7, rankCmp);  // { rank: 7, value: 'seven-B' }
             * algo.binaryFindLast(data, 8, rankCmp);  // undefined
             * ```
             *
             * **See also** [[binaryFind]] and [[findLast]].
             */
            function binaryFindLast(array, value, cmp) {
                var i = binaryFindLastIndex(array, value, cmp);
                return i !== -1 ? array[i] : void 0;
            }
            algorithm.binaryFindLast = binaryFindLast;
            /**
             * Create a shallow copy of an array.
             *
             * @param array - The array of values to copy.
             *
             * @returns A shallow copy of `array`.
             *
             * #### Notes
             * The result array is pre-allocated, which is typically the fastest
             * option for arrays `<` 100k elements. Use this function when copy
             * performance of small arrays is critical.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = [0, 1, 2, 3, 4];
             * algo.copy(data);  // [0, 1, 2, 3, 4];
             * ```
             */
            function copy(array) {
                var n = array.length;
                var result = new Array(n);
                for (var i = 0; i < n; ++i) {
                    result[i] = array[i];
                }
                return result;
            }
            algorithm.copy = copy;
            /**
             * Insert an element into an array at a specified index.
             *
             * @param array - The array of values to modify.
             *
             * @param index - The index at which to insert the value. If this value
             *   is negative, it is taken as an offset from the end of the array. If
             *   the adjusted value is still negative, it is clamped to `0`. If this
             *   value is positive, it is clamped to `array.length`.
             *
             * @param value - The value to insert into the array.
             *
             * @returns The index at which the value was inserted.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = [0, 1, 2, 3, 4];
             * algo.insert(data, 0, 12);  // 0
             * algo.insert(data, 3, 42);  // 3
             * algo.insert(data, 9, 19);  // 7
             * algo.insert(data, -9, 9);  // 0
             * algo.insert(data, -2, 8);  // 7
             * console.log(data);         // [9, 12, 0, 1, 42, 2, 3, 8, 4, 19]
             * ```
             *
             * **See also** [[removeAt]] and [[remove]].
             */
            function insert(array, index, value) {
                index = Math.floor(index);
                var len = array.length;
                if (index < 0) {
                    index = Math.max(0, index + len);
                }
                else if (index > len) {
                    index = len;
                }
                for (var i = len; i > index; --i) {
                    array[i] = array[i - 1];
                }
                array[index] = value;
                return index;
            }
            algorithm.insert = insert;
            /**
             * Move an element in an array from one index to another.
             *
             * @param array - The array of values to modify.
             *
             * @param fromIndex - The index of the element to move. If this value
             *   is negative, it is taken as an offset from the end of the array.
             *   If the adjusted value is not a valid index, the array will not
             *   be modified and `-1` will be returned.
             *
             * @param toIndex - The target index of the element. If this value is
             *   negative, it is taken as an offset from the end of the array. If
             *   the adjusted value is still negative, it is clamped to `0`. If
             *   this value is positive, it is clamped to `array.length - 1`.
             *
             * @returns The index to which the element was moved, or `-1` if
             *   `fromIndex` is invalid.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = [0, 1, 2, 3, 4];
             * algo.move(data, 1, 2);   // 2
             * algo.move(data, -1, 0);  // 0
             * algo.move(data, 3, -4);  // 1
             * algo.move(data, 10, 0);  // -1
             * console.log(data);       // [4, 1, 0, 2, 3]
             * ```
             */
            function move(array, fromIndex, toIndex) {
                fromIndex = Math.floor(fromIndex);
                var len = array.length;
                if (fromIndex < 0) {
                    fromIndex += len;
                }
                if (fromIndex < 0 || fromIndex >= len) {
                    return -1;
                }
                toIndex = Math.floor(toIndex);
                if (toIndex < 0) {
                    toIndex = Math.max(0, toIndex + len);
                }
                else if (toIndex >= len) {
                    toIndex = len - 1;
                }
                if (fromIndex === toIndex) {
                    return toIndex;
                }
                var value = array[fromIndex];
                if (fromIndex > toIndex) {
                    for (var i = fromIndex; i > toIndex; --i) {
                        array[i] = array[i - 1];
                    }
                }
                else {
                    for (var i = fromIndex; i < toIndex; ++i) {
                        array[i] = array[i + 1];
                    }
                }
                array[toIndex] = value;
                return toIndex;
            }
            algorithm.move = move;
            /**
             * Remove an element from an array at a specified index.
             *
             * @param array - The array of values to modify.
             *
             * @param index - The index of the element to remove. If this value
             *   is negative, it is taken as an offset from the end of the array.
             *   If the adjusted value is not a valid index, the array will not
             *   be modified and `undefined` will be returned.
             *
             * @returns The element which was removed from `array`, or `undefined`
             *   if `index` is invalid.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = [0, 1, 2, 3, 4];
             * algo.removeAt(data, 1);   // 1
             * algo.removeAt(data, -2);  // 3
             * algo.removeAt(data, 10);  // undefined
             * console.log(data);        // [0, 2, 4]
             * ```
             *
             * **See also** [[remove]] and [[insert]].
             */
            function removeAt(array, index) {
                index = Math.floor(index);
                var len = array.length;
                if (index < 0) {
                    index += len;
                }
                if (index < 0 || index >= len) {
                    return void 0;
                }
                var value = array[index];
                for (var i = index + 1; i < len; ++i) {
                    array[i - 1] = array[i];
                }
                array.pop();
                return value;
            }
            algorithm.removeAt = removeAt;
            /**
             * Remove the first occurrence of a value from an array.
             *
             * @param array - The array of values to modify.
             *
             * @param value - The value to remove from the array.
             *
             * @returns The index where `value` was located, or `-1` if `value`
             *   is not in `array`.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = [0, 1, 2, 3, 4];
             * algo.remove(data, 1);  // 1
             * algo.remove(data, 3);  // 2
             * algo.remove(data, 7);  // -1
             * console.log(data);     // [0, 2, 4]
             * ```
             *
             * **See also** [[removeAt]] and [[insert]].
             */
            function remove(array, value) {
                var i = indexOf(array, value);
                if (i !== -1)
                    removeAt(array, i);
                return i;
            }
            algorithm.remove = remove;
            /**
             * Reverse an array in-place subject to an optional range.
             *
             * @param array - The array to reverse.
             *
             * @param fromIndex - The index of the first element of the range. If
             *   this value is negative, it is taken as an offset from the end of
             *   the array. The value is clamped to the range `[0, length - 1]`.
             *   The default is `0`.
             *
             * @param fromIndex - The index of the last element of the range. If
             *   this value is negative, it is taken as an offset from the end of
             *   the array. The value is clamped to the range `[0, length - 1]`.
             *   The default is `length`.
             *
             * @returns A reference to the original array.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = [0, 1, 2, 3, 4];
             * algo.reverse(data, 1, 3);    // [0, 3, 2, 1, 4]
             * algo.reverse(data, 3);       // [0, 3, 2, 4, 1]
             * algo.reverse(data);          // [1, 4, 2, 3, 0]
             * algo.reverse(data, -3);      // [1, 4, 0, 3, 2]
             * algo.reverse(data, -5, -2);  // [3, 0, 4, 1, 2]
             * ```
             */
            function reverse(array, fromIndex, toIndex) {
                if (fromIndex === void 0) { fromIndex = 0; }
                if (toIndex === void 0) { toIndex = array.length; }
                var len = array.length;
                if (len <= 1) {
                    return array;
                }
                fromIndex = Math.floor(fromIndex);
                if (fromIndex < 0) {
                    fromIndex = Math.max(0, fromIndex + len);
                }
                else if (fromIndex >= len) {
                    fromIndex = len - 1;
                }
                toIndex = Math.floor(toIndex);
                if (toIndex < 0) {
                    toIndex = Math.max(0, toIndex + len);
                }
                else if (toIndex >= len) {
                    toIndex = len - 1;
                }
                while (fromIndex < toIndex) {
                    var temp = array[fromIndex];
                    array[fromIndex] = array[toIndex];
                    array[toIndex] = temp;
                    fromIndex++;
                    toIndex--;
                }
                return array;
            }
            algorithm.reverse = reverse;
            /**
             * Rotate the elements an array by a positive or negative delta.
             *
             * @param array - The array to rotate.
             *
             * @param delta - The amount of rotation to apply to the elements. A
             *   positive delta will shift elements to the left. A negative delta
             *   will shift elements to the right.
             *
             * @returns A reference to the original array.
             *
             * #### Notes
             * This executes in `O(n)` time and `O(1)` space.
             *
             * #### Example
             * ```typescript
             * import algo = phosphor.collections.algorithm;
             *
             * var data = [0, 1, 2, 3, 4];
             * algo.rotate(data, 2);    // [2, 3, 4, 0, 1]
             * algo.rotate(data, -2);   // [0, 1, 2, 3, 4]
             * algo.rotate(data, 10);   // [0, 1, 2, 3, 4]
             * algo.rotate(data, 9);    // [4, 0, 1, 2, 3]
             * ```
             */
            function rotate(array, delta) {
                var len = array.length;
                if (len <= 1) {
                    return array;
                }
                delta = Math.floor(delta);
                if (delta > 0) {
                    delta = delta % len;
                }
                else if (delta < 0) {
                    delta = ((delta % len) + len) % len;
                }
                if (delta === 0) {
                    return array;
                }
                reverse(array, 0, delta - 1);
                reverse(array, delta, len - 1);
                reverse(array, 0, len - 1);
                return array;
            }
            algorithm.rotate = rotate;
        })(algorithm = collections.algorithm || (collections.algorithm = {}));
    })(collections = phosphor.collections || (phosphor.collections = {}));
})(phosphor || (phosphor = {})); // module phosphor.collections.algorithm

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var collections;
    (function (collections) {
        /**
         * A circular buffer with a fixed maximum size.
         *
         * A circular buffer is a buffer with constant time access to its
         * elements and constant times inserts and deletes from the front
         * and back of the buffer. When the buffer reaches its maximum
         * size, newly added elements will overwrite existing elements.
         */
        var CircularBuffer = (function () {
            /**
             * Construct a new circular buffer.
             */
            function CircularBuffer(maxSize, items) {
                var _this = this;
                this._size = 0;
                this._offset = 0;
                this._array = new Array(Math.max(1, maxSize));
                if (items)
                    items.forEach(function (it) { _this.pushBack(it); });
            }
            Object.defineProperty(CircularBuffer.prototype, "maxSize", {
                /**
                 * The maximum size of the buffer.
                 */
                get: function () {
                    return this._array.length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CircularBuffer.prototype, "size", {
                /**
                 * The number of elements in the buffer.
                 */
                get: function () {
                    return this._size;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CircularBuffer.prototype, "empty", {
                /**
                 * True if the buffer has elements, false otherwise.
                 */
                get: function () {
                    return this._size === 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CircularBuffer.prototype, "front", {
                /**
                 * The value at the front of the buffer.
                 */
                get: function () {
                    return this._size !== 0 ? this._get(0) : void 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CircularBuffer.prototype, "back", {
                /**
                 * The value at the back of the buffer.
                 */
                get: function () {
                    return this._size !== 0 ? this._get(this._size - 1) : void 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the value at the given index.
             *
             * Returns `undefined` if the index is out of range.
             */
            CircularBuffer.prototype.get = function (index) {
                if (index < 0 || index >= this._size) {
                    return void 0;
                }
                return this._get(index);
            };
            /**
             * Set the value at the given index.
             *
             * Returns false if the index is out of range.
             */
            CircularBuffer.prototype.set = function (index, value) {
                if (index < 0 || index >= this._size) {
                    return false;
                }
                this._set(index, value);
                return true;
            };
            /**
             * Push a value onto the back of the buffer.
             *
             * If the buffer is full, the front element will be overwritten.
             */
            CircularBuffer.prototype.pushBack = function (value) {
                this._set(this._size, value);
                if (this._size === this._array.length) {
                    this._incr();
                }
                else {
                    this._size++;
                }
            };
            /**
             * Push a value onto the front of the buffer.
             *
             * If the buffer is full, the back element will be overwritten.
             */
            CircularBuffer.prototype.pushFront = function (value) {
                this._decr();
                this._set(0, value);
                if (this._size < this._array.length) {
                    this._size++;
                }
            };
            /**
             * Pop and return the value at the back of the buffer.
             */
            CircularBuffer.prototype.popBack = function () {
                if (this._size === 0) {
                    return void 0;
                }
                return this._rem(--this._size);
            };
            /**
             * Pop and return the value at the front of the buffer.
             */
            CircularBuffer.prototype.popFront = function () {
                if (this._size === 0) {
                    return void 0;
                }
                var value = this._rem(0);
                this._incr();
                this._size--;
                return value;
            };
            /**
             * Remove all values from the buffer.
             */
            CircularBuffer.prototype.clear = function () {
                for (var i = 0, n = this._size; i < n; ++i) {
                    this._set(i, void 0);
                }
                this._size = 0;
                this._offset = 0;
            };
            /**
             * Create an array from the values in the buffer.
             */
            CircularBuffer.prototype.toArray = function () {
                var result = new Array(this._size);
                for (var i = 0, n = this._size; i < n; ++i) {
                    result[i] = this._get(i);
                }
                return result;
            };
            /**
             * Returns true if any value in the buffer passes the given test.
             */
            CircularBuffer.prototype.some = function (pred) {
                for (var i = 0; i < this._size; ++i) {
                    if (pred(this._get(i), i))
                        return true;
                }
                return false;
            };
            /**
             * Returns true if all values in the buffer pass the given test.
             */
            CircularBuffer.prototype.every = function (pred) {
                for (var i = 0; i < this._size; ++i) {
                    if (!pred(this._get(i), i))
                        return false;
                }
                return true;
            };
            /**
             * Create an array of the values which pass the given test.
             */
            CircularBuffer.prototype.filter = function (pred) {
                var result;
                for (var i = 0; i < this._size; ++i) {
                    var value = this._get(i);
                    if (pred(value, i))
                        result.push(value);
                }
                return result;
            };
            /**
             * Create an array of callback results for each value in the buffer.
             */
            CircularBuffer.prototype.map = function (callback) {
                var result = new Array(this._size);
                for (var i = 0; i < this._size; ++i) {
                    result[i] = callback(this._get(i), i);
                }
                return result;
            };
            /**
             * Execute a callback for each element in buffer.
             *
             * Iteration will terminate if the callbacks returns a value other
             * than `undefined`. That value will be returned from this method.
             */
            CircularBuffer.prototype.forEach = function (callback) {
                for (var i = 0; i < this._size; ++i) {
                    var result = callback(this._get(i), i);
                    if (result !== void 0)
                        return result;
                }
                return void 0;
            };
            /**
             * Get the value for the apparent index.
             *
             * The index is assumed to be in-range.
             */
            CircularBuffer.prototype._get = function (index) {
                return this._array[(index + this._offset) % this._array.length];
            };
            /**
             * Set the value for the apparent index.
             *
             * The index is assumed to be in-range.
             */
            CircularBuffer.prototype._set = function (index, value) {
                this._array[(index + this._offset) % this._array.length] = value;
            };
            /**
             * Clear and return the value at the apparent index.
             *
             * The index is assumed to be in-range.
             */
            CircularBuffer.prototype._rem = function (index) {
                var i = (index + this._offset) % this._array.length;
                var value = this._array[i];
                this._array[i] = void 0;
                return value;
            };
            /**
             * Increment the offset by one.
             */
            CircularBuffer.prototype._incr = function () {
                if (this._offset === this._array.length - 1) {
                    this._offset = 0;
                }
                else {
                    this._offset++;
                }
            };
            /**
             * Decrement the offset by one.
             */
            CircularBuffer.prototype._decr = function () {
                if (this._offset === 0) {
                    this._offset = this._array.length - 1;
                }
                else {
                    this._offset--;
                }
            };
            return CircularBuffer;
        })();
        collections.CircularBuffer = CircularBuffer;
    })(collections = phosphor.collections || (phosphor.collections = {}));
})(phosphor || (phosphor = {})); // module phosphor.collections



/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var collections;
    (function (collections) {
        /**
         * A canonical singly linked FIFO queue.
         */
        var Queue = (function () {
            /**
             * Construct a new queue.
             */
            function Queue(items) {
                var _this = this;
                this._size = 0;
                this._front = null;
                this._back = null;
                if (items)
                    items.forEach(function (it) { _this.pushBack(it); });
            }
            Object.defineProperty(Queue.prototype, "size", {
                /**
                 * The number of elements in the queue.
                 */
                get: function () {
                    return this._size;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Queue.prototype, "empty", {
                /**
                 * True if the queue has elements, false otherwise.
                 */
                get: function () {
                    return this._size === 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Queue.prototype, "front", {
                /**
                 * The value at the front of the queue.
                 */
                get: function () {
                    return this._front !== null ? this._front.value : void 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Queue.prototype, "back", {
                /**
                 * The value at the back of the queue.
                 */
                get: function () {
                    return this._back !== null ? this._back.value : void 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Push a value onto the back of the queue.
             */
            Queue.prototype.pushBack = function (value) {
                var link = { next: null, value: value };
                if (this._back === null) {
                    this._front = link;
                    this._back = link;
                }
                else {
                    this._back.next = link;
                    this._back = link;
                }
                this._size++;
            };
            /**
             * Pop and return the value at the front of the queue.
             */
            Queue.prototype.popFront = function () {
                var link = this._front;
                if (link === null) {
                    return void 0;
                }
                if (link.next === null) {
                    this._front = null;
                    this._back = null;
                }
                else {
                    this._front = link.next;
                }
                this._size--;
                return link.value;
            };
            /**
             * Remove all values from the queue.
             */
            Queue.prototype.clear = function () {
                this._size = 0;
                this._front = null;
                this._back = null;
            };
            /**
             * Create an array from the values in the queue.
             */
            Queue.prototype.toArray = function () {
                var result = new Array(this._size);
                for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
                    result[i] = link.value;
                }
                return result;
            };
            /**
             * Returns true if any value in the queue passes the given test.
             */
            Queue.prototype.some = function (pred) {
                for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
                    if (pred(link.value, i))
                        return true;
                }
                return false;
            };
            /**
             * Returns true if all values in the queue pass the given test.
             */
            Queue.prototype.every = function (pred) {
                for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
                    if (!pred(link.value, i))
                        return false;
                }
                return true;
            };
            /**
             * Create an array of the values which pass the given test.
             */
            Queue.prototype.filter = function (pred) {
                var result;
                for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
                    var value = link.value;
                    if (pred(value, i))
                        result.push(value);
                }
                return result;
            };
            /**
             * Create an array of callback results for each value in the queue.
             */
            Queue.prototype.map = function (callback) {
                var result = new Array(this._size);
                for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
                    result[i] = callback(link.value, i);
                }
                return result;
            };
            /**
             * Execute a callback for each element in queue.
             *
             * Iteration will terminate if the callbacks returns a value other
             * than `undefined`. That value will be returned from this method.
             */
            Queue.prototype.forEach = function (callback) {
                for (var i = 0, link = this._front; link !== null; link = link.next, ++i) {
                    var result = callback(link.value, i);
                    if (result !== void 0)
                        return result;
                }
                return void 0;
            };
            return Queue;
        })();
        collections.Queue = Queue;
    })(collections = phosphor.collections || (phosphor.collections = {}));
})(phosphor || (phosphor = {})); // module phosphor.collections

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var collections;
    (function (collections) {
        /**
         * An object which manages a collection of variable sized sections.
         *
         * A section list is commonly used to manage row heights in virtually
         * scrolling list controls. In such a control, most rows are uniform
         * height while a handful of rows are variable sized.
         *
         * A section list has guaranteed `O(log(n))` worst-case performance for
         * most operations, where `n` is the number of variable sized sections.
         */
        var SectionList = (function () {
            function SectionList() {
                this._root = null;
            }
            Object.defineProperty(SectionList.prototype, "count", {
                /**
                 * Get the total number of sections in the list.
                 *
                 * #### Notes
                 * This operation has `O(1)` complexity.
                 */
                get: function () {
                    return this._root !== null ? this._root.count : 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SectionList.prototype, "size", {
                /**
                 * Get the total size of all sections in the list.
                 *
                 * #### Notes
                 * This operation has `O(1)` complexity.
                 */
                get: function () {
                    return this._root !== null ? this._root.size : 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Find the index of the section which covers the given offset.
             *
             * @param offset - The positive offset position of interest.
             *
             * @returns The index of the section which covers the given offset,
             *   or `-1` if the offset is out of range.
             *
             * #### Notes
             * This operation has `O(log(n))` complexity.
             */
            SectionList.prototype.indexOf = function (offset) {
                if (this._root === null || offset < 0 || offset >= this._root.size) {
                    return -1;
                }
                return indexOf(this._root, offset);
            };
            /**
             * Find the offset position of the section at the given index.
             *
             * @param index - The index of the section of interest. If this value
             *   is negative, it is taken as an offset from the end of the list.
             *
             * @returns The offset position of the section at the given index, or
             *   `-1` if the index is out of range.
             *
             * #### Notes
             * This operation has `O(log(n))` complexity.
             */
            SectionList.prototype.offsetOf = function (index) {
                index = toQueryIndex(this._root, index);
                if (index < 0) {
                    return -1;
                }
                return offsetOf(this._root, index);
            };
            /**
             * Find the size of the section at the given index.
             *
             * @param index - The index of the section of interest. If this value
             *   is negative, it is taken as an offset from the end of the list.
             *
             * @returns The size of the section at the given index, or `-1` if
             *   the index is out of range.
             *
             * #### Notes
             * This operation has `O(log(n))` complexity.
             */
            SectionList.prototype.sizeOf = function (index) {
                index = toQueryIndex(this._root, index);
                if (index < 0) {
                    return -1;
                }
                return sizeOf(this._root, index);
            };
            /**
             * Insert new sections into the list.
             *
             * @param index - The index at which to insert the first section. If
             *   this value is negative, it is taken as an offset from the end of
             *   the list. The value is clamped to the range `[0, list.count]`.
             *
             * @param count - The number of sections to insert. If this value is
             *   `<= 0`, this method is a no-op.
             *
             * @param size - The size of each section. This value is clamped to
             *   the range `[0, Infinity]`.
             *
             * #### Notes
             * This operation has `O(log(n))` complexity.
             */
            SectionList.prototype.insert = function (index, count, size) {
                var d = toInsertData(this._root, index, count);
                if (d === null) {
                    return;
                }
                if (d.index < 0) {
                    this._root = createLeaf(d.count, d.count * Math.max(0, size));
                }
                else {
                    this._root = insert(this._root, d.index, d.count, Math.max(0, size));
                }
            };
            /**
             * Remove existing sections from the list.
             *
             * @param index - The index of the first section to remove. If this
             *   value is negative, it is taken as an offset from the end of the
             *   list.
             *
             * @param count - The number of sections to remove. If this value is
             *   `<= 0`, this method is a no-op. If any of the sections are out
             *   of range, they will be ignored.
             *
             * #### Notes
             * This operation has `O(log(n))` complexity.
             */
            SectionList.prototype.remove = function (index, count) {
                var d = toRemoveData(this._root, index, count);
                if (d === null) {
                    return;
                }
                this._root = remove(this._root, d.index, d.count);
            };
            /**
             * Resize existing sections in the list.
             *
             * @param index - The index of the first section to resize. If this
             *   value is negative, it is taken as an offset from the end of the
             *   list.
             *
             * @param count - The number of sections to resize. If this value is
             *   `<= 0`, this method is a no-op. If any of the sections are out
             *   of range, they will be ignored.
             *
             * @param size - The new size of each section. This value is clamped
             *   to the range `[0, Infinity]`.
             */
            SectionList.prototype.resize = function (index, count, size) {
                var d = toRemoveData(this._root, index, count);
                if (d === null) {
                    return;
                }
                this._root = remove(this._root, d.index, d.count);
                if (this._root === null) {
                    this._root = createLeaf(d.count, d.count * Math.max(0, size));
                }
                else {
                    this._root = insert(this._root, d.index, d.count, Math.max(0, size));
                }
            };
            return SectionList;
        })();
        collections.SectionList = SectionList;
        /**
         * Compute the adjusted query index for the given span and index.
         *
         * If the span is `null`, this returns `-1`. If the index is negative,
         * it is offset from the end of the span. If the adjusted index is out
         * of range, this returns `-1`.
         */
        function toQueryIndex(span, index) {
            if (span === null) {
                return -1;
            }
            index = Math.floor(index);
            if (index >= span.count) {
                return -1;
            }
            if (index < 0) {
                index += span.count;
                if (index < 0) {
                    return -1;
                }
            }
            return index;
        }
        /**
         * Compute the adjusted insert parameters for the given span.
         *
         * If the count is `<= 0`, this returns `null`. If the span is `null`,
         * the adjusted index will be `-1`. Otherwise, the index is clamped to
         * the range `[0, span.count]`.
         */
        function toInsertData(span, index, count) {
            count = Math.floor(count);
            if (count <= 0) {
                return null;
            }
            if (span === null) {
                return { index: -1, count: count };
            }
            index = Math.floor(index);
            if (index < 0) {
                index = Math.max(0, index + span.count);
            }
            else {
                index = Math.min(index, span.count);
            }
            return { index: index, count: count };
        }
        /**
         * Compute the adjusted remove parameters for the given span.
         *
         * If the span is `null` or the count is `<= 0`, this returns `null`. If
         * the index is negative, it is offset from the end of the span. If the
         * adjusted index and count are fully out of range, this returns `null`.
         * Otherwise, the index and count are clipped to be fully in range.
         */
        function toRemoveData(span, index, count) {
            if (span === null) {
                return null;
            }
            count = Math.floor(count);
            if (count <= 0) {
                return null;
            }
            index = Math.floor(index);
            if (index >= span.count) {
                return null;
            }
            if (index < 0) {
                index += span.count;
                if (index < 0) {
                    count += index;
                    if (count <= 0) {
                        return null;
                    }
                    index = 0;
                }
            }
            return { index: index, count: Math.min(count, span.count - index) };
        }
        /**
         * Create a new leaf span with the given count and total size.
         */
        function createLeaf(count, size) {
            return { count: count, size: size, level: 0, left: null, right: null };
        }
        /**
         * Create a new branch span from the given left and right children.
         */
        function createBranch(left, right) {
            var count = left.count + right.count;
            var size = left.size + right.size;
            var level = Math.max(left.level, right.level) + 1;
            return { count: count, size: size, level: level, left: left, right: right };
        }
        /**
         * Update a span to be branch with the given left and right children.
         *
         * This returns the updated span as a convenience.
         */
        function updateBranch(span, left, right) {
            span.count = left.count + right.count;
            span.size = left.size + right.size;
            span.level = Math.max(left.level, right.level) + 1;
            span.left = left;
            span.right = right;
            return span;
        }
        /**
         * Find the index of the section which covers the given offset.
         *
         * The offset must be within range of the given span.
         */
        function indexOf(span, offset) {
            var index = 0;
            while (span.level !== 0) {
                var left = span.left;
                if (offset < left.size) {
                    span = left;
                }
                else {
                    span = span.right;
                    index += left.count;
                    offset -= left.size;
                }
            }
            return index + Math.floor(offset * span.count / span.size);
        }
        /**
         * Find the offset of the section at the given index.
         *
         * The index must be an integer and within range of the given span.
         */
        function offsetOf(span, index) {
            var offset = 0;
            while (span.level !== 0) {
                var left = span.left;
                if (index < left.count) {
                    span = left;
                }
                else {
                    span = span.right;
                    index -= left.count;
                    offset += left.size;
                }
            }
            return offset + index * span.size / span.count;
        }
        /**
         * Find the size of the section at the given index.
         *
         * The index must be an integer and within range of the given span.
         */
        function sizeOf(span, index) {
            while (span.level !== 0) {
                var left = span.left;
                if (index < left.count) {
                    span = left;
                }
                else {
                    span = span.right;
                    index -= left.count;
                }
            }
            return span.size / span.count;
        }
        /**
         * Insert new sections into the given subtree.
         *
         * The index must be an integer within range of the span, and the
         * count must be an integer greater than zero.
         *
         * The return value is the span which should take the place of the
         * original span in the tree. Due to tree rebalancing, this may or
         * may not be the same as the original span.
         */
        function insert(span, index, count, size) {
            // If the span is a leaf, the insert target has been found. There are
            // four possibilities for the insert: extend, before, after, and split.
            if (span.level === 0) {
                // If the size of each new section is the same as the current size,
                // the existing span can be extended by simply adding the sections.
                if (size === span.size / span.count) {
                    span.count += count;
                    span.size += count * size;
                    return span;
                }
                // If the index is zero, the new span goes before the current span,
                // which requires a new branch node to be added to the tree.
                if (index === 0) {
                    return createBranch(createLeaf(count, count * size), span);
                }
                // If the index is greater than the span count, the new span goes
                // after the current span, which also requires a new branch node.
                if (index >= span.count) {
                    return createBranch(span, createLeaf(count, count * size));
                }
                // Otherwise, the current span must be split and the new span
                // added to the middle. This requires several new nodes.
                var rest = span.count - index;
                var each = span.size / span.count;
                var subLeft = createLeaf(count, count * size);
                var subRight = createLeaf(rest, rest * each);
                var newLeft = createLeaf(index, index * each);
                var newRight = createBranch(subLeft, subRight);
                return updateBranch(span, newLeft, newRight);
            }
            // Otherwise, recurse down the appropriate branch.
            if (index < span.left.count) {
                span.left = insert(span.left, index, count, size);
            }
            else {
                span.right = insert(span.right, index - span.left.count, count, size);
            }
            // Always rebalance the branch after an insert.
            return rebalance(span);
        }
        /**
         * Remove a number of sections from the given subtree.
         *
         * The index must be an integer within range of the span, the
         * count must be an integer greater than zero, and the relation
         * `index + count <= span.count` must hold.
         *
         * The return value is the span which should take the place of the
         * original span in the tree. Due to tree rebalancing, this may or
         * may not be the same as the original span. It may also be null.
         */
        function remove(span, index, count) {
            // If the range covers the entire span, there is no need to do
            // any extra checking, since the whole subtree can be removed.
            if (count === span.count) {
                return null;
            }
            // If the span is a leaf, then sections are removed starting at
            // the index. The span's size is updated to reflect its new count.
            if (span.level === 0) {
                var rest = span.count - count;
                var each = span.size / span.count;
                span.size = rest * each;
                span.count = rest;
                return span;
            }
            // Otherwise, remove the sections from the children of the branch
            // recursively. The range will either cross both of the children
            // or be contained completely by one of them.
            if (index < span.left.count && index + count > span.left.count) {
                var tail = span.left.count - index;
                span.left = remove(span.left, index, tail);
                span.right = remove(span.right, 0, count - tail);
            }
            else if (index < span.left.count) {
                span.left = remove(span.left, index, count);
            }
            else {
                span.right = remove(span.right, index - span.left.count, count);
            }
            // After the remove, either child may be null, but not both, since
            // the first clause of this method handles the case where the range
            // covers the entire span. If one child was deleted, the remaining
            // child is hoisted to become the current span.
            if (span.left === null) {
                span = span.right;
            }
            else if (span.right === null) {
                span = span.left;
            }
            // If the span is still a branch, it must be rebalanced. If the range
            // was large, it's possible that the span's balance factor exceeds the
            // [-2, 2] threshold, and will require multiple passes to rebalance.
            if (span.level > 0) {
                do {
                    span = rebalance(span);
                } while (Math.abs(span.left.level - span.right.level) > 1);
            }
            return span;
        }
        /**
         * Rebalance a span so that it maintains the AVL balance invariant.
         *
         * The given span must be a branch. If the span is already balanced,
         * no rotations will be made. The branch data is always updated to
         * be current based on the current children.
         *
         * This assumes the balance factor for the span will be within the
         * range of [-2, 2]. If the balance factor is outside this range,
         * the branch will need to be rebalanced multiple times in order
         * to maintain the AVL balance invariant.
         *
         * The return value is the span which should take the place of the
         * original span in the tree, and may or may not be a different span.
         *
         * Four unbalanced conditions are possible:
         *
         * Left-Left
         * -------------------------------------
         *        span                span
         *        /  \                /  \
         *       /    \              /    \
         *      1      D            2      1
         *     / \          =>     / \    / \
         *    /   \               A   B  C   D
         *   2     C
         *  / \
         * A   B
         *
         * Left-Right
         * -------------------------------------
         *     span                span
         *     /  \                /  \
         *    /    \              /    \
         *   1      D            1      2
         *  / \          =>     / \    / \
         * A   \               A   B  C   D
         *      2
         *     / \
         *    B   C
         *
         * Right-Right
         * -------------------------------------
         *   span                     span
         *   /  \                     /  \
         *  /    \                   /    \
         * A      1                 1      2
         *       / \        =>     / \    / \
         *      /   \             A   B  C   D
         *     B     2
         *          / \
         *         C   D
         *
         * Right-Left
         * -------------------------------------
         *   span                   span
         *   /  \                   /  \
         *  /    \                 /    \
         * A      1               2      1
         *       / \      =>     / \    / \
         *      /   \           A   B  C   D
         *     2     D
         *    / \
         *   B   C
         */
        function rebalance(span) {
            var left = span.left;
            var right = span.right;
            var balance = left.level - right.level;
            if (balance > 1) {
                var subLeft = left.left;
                var subRight = left.right;
                if (subLeft.level > subRight.level) {
                    // Left-Left
                    span.left = subLeft;
                    span.right = updateBranch(left, subRight, right);
                }
                else {
                    // Left-Right
                    span.left = updateBranch(left, subLeft, subRight.left);
                    span.right = updateBranch(subRight, subRight.right, right);
                }
            }
            else if (balance < -1) {
                var subLeft = right.left;
                var subRight = right.right;
                if (subRight.level > subLeft.level) {
                    // Right-Right
                    span.right = subRight;
                    span.left = updateBranch(right, left, subLeft);
                }
                else {
                    // Right-Left
                    span.right = updateBranch(right, subLeft.right, subRight);
                    span.left = updateBranch(subLeft, left, subLeft.left);
                }
            }
            return updateBranch(span, span.left, span.right);
        }
    })(collections = phosphor.collections || (phosphor.collections = {}));
})(phosphor || (phosphor = {})); // module phosphor.collections

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * Create a box sizing object for the given node.
         *
         * The values of the returned object are read only.
         */
        function createBoxSizing(node) {
            var proto = boxSizingProto;
            var style = window.getComputedStyle(node);
            var mw = parseInt(style.minWidth, 10) || proto._mw;
            var mh = parseInt(style.minHeight, 10) || proto._mh;
            var xw = parseInt(style.maxWidth, 10) || proto._xw;
            var xh = parseInt(style.maxHeight, 10) || proto._xh;
            var bt = parseInt(style.borderTopWidth, 10) || proto._bt;
            var bl = parseInt(style.borderLeftWidth, 10) || proto._bl;
            var br = parseInt(style.borderRightWidth, 10) || proto._br;
            var bb = parseInt(style.borderBottomWidth, 10) || proto._bb;
            var pt = parseInt(style.paddingTop, 10) || proto._pt;
            var pl = parseInt(style.paddingLeft, 10) || proto._pl;
            var pr = parseInt(style.paddingRight, 10) || proto._pr;
            var pb = parseInt(style.paddingBottom, 10) || proto._pb;
            var box = Object.create(proto);
            if (mw !== proto._mw)
                box._mw = mw;
            if (mh !== proto._mh)
                box._mh = mh;
            if (xw !== proto._xw)
                box._xw = xw;
            if (xh !== proto._xh)
                box._xh = xh;
            if (bt !== proto._bt)
                box._bt = bt;
            if (bl !== proto._bl)
                box._bl = bl;
            if (br !== proto._br)
                box._br = br;
            if (bb !== proto._bb)
                box._bb = bb;
            if (pt !== proto._pt)
                box._pt = pt;
            if (pl !== proto._pl)
                box._pl = pl;
            if (pr !== proto._pr)
                box._pr = pr;
            if (pb !== proto._pb)
                box._pb = pb;
            return box;
        }
        utility.createBoxSizing = createBoxSizing;
        /**
         * The box sizing prototype object used by `createBoxSizing`.
         */
        var boxSizingProto = {
            get minWidth() { return this._mw; },
            get minHeight() { return this._mh; },
            get maxWidth() { return this._xw; },
            get maxHeight() { return this._xh; },
            get borderTop() { return this._bt; },
            get borderLeft() { return this._bl; },
            get borderRight() { return this._br; },
            get borderBottom() { return this._bb; },
            get paddingTop() { return this._pt; },
            get paddingLeft() { return this._pl; },
            get paddingRight() { return this._pr; },
            get paddingBottom() { return this._pb; },
            get verticalSum() { return this._bt + this._bb + this._pt + this._pb; },
            get horizontalSum() { return this._bl + this._br + this._pl + this._pr; },
            _mw: 0, _mh: 0, _xw: Infinity, _xh: Infinity,
            _bt: 0, _bl: 0, _br: 0, _bb: 0,
            _pt: 0, _pl: 0, _pr: 0, _pb: 0,
        };
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * The class name added to the document body on cursor override.
         */
        var CURSOR_CLASS = 'p-mod-cursor-override';
        /**
         * The token object for the current override.
         */
        var overrideToken = null;
        /**
         * Override the cursor for the entire document.
         *
         * Returns an IDisposable which will clear the override.
         */
        function overrideCursor(cursor) {
            var token = overrideToken = {};
            var body = document.body;
            body.style.cursor = cursor;
            body.classList.add(CURSOR_CLASS);
            return new utility.Disposable(function () {
                if (token === overrideToken) {
                    overrideToken = null;
                    body.style.cursor = '';
                    body.classList.remove(CURSOR_CLASS);
                }
            });
        }
        utility.overrideCursor = overrideCursor;
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * A concrete implementation of IDisposable.
         *
         * This will invoke a user provided callback when it is disposed.
         */
        var Disposable = (function () {
            /**
             * Construct a new disposable.
             */
            function Disposable(callback) {
                this._callback = callback;
            }
            /**
             * Dispose the object and invoke the user provided callback.
             */
            Disposable.prototype.dispose = function () {
                var callback = this._callback;
                this._callback = null;
                if (callback)
                    callback();
            };
            return Disposable;
        })();
        utility.Disposable = Disposable;
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * A singleton frozen empty object.
         */
        utility.emptyObject = Object.freeze({});
        /**
         * A singleton frozen empty array.
         */
        utility.emptyArray = Object.freeze([]);
        /**
         * A singleton empty no-op function.
         */
        utility.emptyFunction = function () { };
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * Test whether a client position lies within a node.
         */
        function hitTest(node, x, y) {
            var rect = node.getBoundingClientRect();
            return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
        }
        utility.hitTest = hitTest;
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * A generic pair of values.
         */
        var Pair = (function () {
            /**
             * Construct a new pair.
             */
            function Pair(first, second) {
                this.first = first;
                this.second = second;
            }
            return Pair;
        })();
        utility.Pair = Pair;
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * The position of a two dimensional object.
         */
        var Point = (function () {
            /**
             * Construct a new point.
             */
            function Point(x, y) {
                this._x = x;
                this._y = y;
            }
            Object.defineProperty(Point.prototype, "x", {
                /**
                 * The X coordinate of the point.
                 */
                get: function () {
                    return this._x;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Point.prototype, "y", {
                /**
                 * The Y coordinate of the point.
                 */
                get: function () {
                    return this._y;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Test whether the point is equivalent to another.
             */
            Point.prototype.equals = function (other) {
                return this._x === other._x && this._y === other._y;
            };
            /**
             * A static zero point.
             */
            Point.Zero = new Point(0, 0);
            /**
             * A static infinite point.
             */
            Point.Infinite = new Point(Infinity, Infinity);
            return Point;
        })();
        utility.Point = Point;
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * The position and size of a 2-dimensional object.
         */
        var Rect = (function () {
            /**
             * Construct a new rect.
             */
            function Rect(x, y, width, height) {
                this._x = x;
                this._y = y;
                this._width = width;
                this._height = height;
            }
            Object.defineProperty(Rect.prototype, "x", {
                /**
                 * The X coordinate of the rect.
                 *
                 * This is equivalent to `left`.
                 */
                get: function () {
                    return this._x;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "y", {
                /**
                 * The Y coordinate of the rect.
                 *
                 * This is equivalent to `top`.
                 */
                get: function () {
                    return this._y;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "width", {
                /**
                 * The width of the rect.
                 */
                get: function () {
                    return this._width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "height", {
                /**
                 * The height of the rect.
                 */
                get: function () {
                    return this._height;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "pos", {
                /**
                 * The position of the rect.
                 *
                 * This is equivalent to `topLeft`.
                 */
                get: function () {
                    return new utility.Point(this._x, this._y);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "size", {
                /**
                 * The size of the rect.
                 */
                get: function () {
                    return new utility.Size(this._width, this._height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "top", {
                /**
                 * The top edge of the rect.
                 *
                 * This is equivalent to `y`.
                 */
                get: function () {
                    return this._y;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "left", {
                /**
                 * The left edge of the rect.
                 *
                 * This is equivalent to `x`.
                 */
                get: function () {
                    return this._x;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "right", {
                /**
                 * The right edge of the rect.
                 *
                 * This is equivalent to `x + width`.
                 */
                get: function () {
                    return this._x + this._width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "bottom", {
                /**
                 * The bottom edge of the rect.
                 *
                 * This is equivalent to `y + height`.
                 */
                get: function () {
                    return this._y + this._height;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "topLeft", {
                /**
                 * The position of the top left corner of the rect.
                 *
                 * This is equivalent to `pos`.
                 */
                get: function () {
                    return new utility.Point(this._x, this._y);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "topRight", {
                /**
                 * The position of the top right corner of the rect.
                 */
                get: function () {
                    return new utility.Point(this._x + this._width, this._y);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "bottomLeft", {
                /**
                 * The position bottom left corner of the rect.
                 */
                get: function () {
                    return new utility.Point(this._x, this._y + this._height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Rect.prototype, "bottomRight", {
                /**
                 * The position bottom right corner of the rect.
                 */
                get: function () {
                    return new utility.Point(this._x + this._width, this._y + this._height);
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Test whether the rect is equivalent to another.
             */
            Rect.prototype.equals = function (other) {
                return (this._x === other._x &&
                    this._y === other._y &&
                    this._width === other._width &&
                    this._height === other._height);
            };
            return Rect;
        })();
        utility.Rect = Rect;
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * The size of a 2-dimensional object.
         */
        var Size = (function () {
            /**
             * Construct a new size.
             */
            function Size(width, height) {
                this._width = width;
                this._height = height;
            }
            Object.defineProperty(Size.prototype, "width", {
                /**
                 * The width of the size.
                 */
                get: function () {
                    return this._width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Size.prototype, "height", {
                /**
                 * The height of the size.
                 */
                get: function () {
                    return this._height;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Test whether the size is equivalent to another.
             */
            Size.prototype.equals = function (other) {
                return this._width === other._width && this._height === other._height;
            };
            /**
             * A static zero size.
             */
            Size.Zero = new Size(0, 0);
            /**
             * A static infinite size.
             */
            Size.Infinite = new Size(Infinity, Infinity);
            return Size;
        })();
        utility.Size = Size;
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var utility;
    (function (utility) {
        /**
         * Get the currently visible viewport rect in page coordinates.
         */
        function clientViewportRect() {
            var elem = document.documentElement;
            var x = window.pageXOffset;
            var y = window.pageYOffset;
            var w = x + elem.clientWidth;
            var h = y + elem.clientHeight;
            return new utility.Rect(x, y, w, h);
        }
        utility.clientViewportRect = clientViewportRect;
    })(utility = phosphor.utility || (phosphor.utility = {}));
})(phosphor || (phosphor = {})); // module phosphor.utility







/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var core;
    (function (core) {
        /**
         * A concrete implementation of IMessage.
         *
         * This may be subclassed to create complex message types.
         */
        var Message = (function () {
            /**
             * Construct a new message.
             */
            function Message(type) {
                this._type = type;
            }
            Object.defineProperty(Message.prototype, "type", {
                /**
                 * The type of the message.
                 */
                get: function () {
                    return this._type;
                },
                enumerable: true,
                configurable: true
            });
            return Message;
        })();
        core.Message = Message;
    })(core = phosphor.core || (phosphor.core = {}));
})(phosphor || (phosphor = {})); // module phosphor.core

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var core;
    (function (core) {
        var Queue = phosphor.collections.Queue;
        /**
         * Send a message to the message handler to process immediately.
         */
        function sendMessage(handler, msg) {
            getDispatcher(handler).sendMessage(msg);
        }
        core.sendMessage = sendMessage;
        /**
         * Post a message to the message handler to process in the future.
         */
        function postMessage(handler, msg) {
            getDispatcher(handler).postMessage(msg);
        }
        core.postMessage = postMessage;
        /**
         * Test whether the message handler has pending messages.
         */
        function hasPendingMessages(handler) {
            return getDispatcher(handler).hasPendingMessages();
        }
        core.hasPendingMessages = hasPendingMessages;
        /**
         * Send the first pending message to the message handler.
         */
        function sendPendingMessage(handler) {
            getDispatcher(handler).sendPendingMessage();
        }
        core.sendPendingMessage = sendPendingMessage;
        /**
         * Install a message filter for a message handler.
         *
         * A message filter is invoked before the message handler processes
         * the message. If the filter returns true from its `filterMessage`
         * method, processing of the message will stop immediately and no
         * other filters or the message handler will be invoked.
         *
         * The most recently installed filter is executed first.
         */
        function installMessageFilter(handler, filter) {
            getDispatcher(handler).installMessageFilter(filter);
        }
        core.installMessageFilter = installMessageFilter;
        /**
         * Remove a message filter added for a message handler.
         *
         * It is safe to call this function while the filter is executing.
         *
         * If the filter is not installed, this is a no-op.
         */
        function removeMessageFilter(handler, filter) {
            getDispatcher(handler).removeMessageFilter(filter);
        }
        core.removeMessageFilter = removeMessageFilter;
        /**
         * Clear all message data associated with the message handler.
         *
         * This removes all pending messages and filters for the handler.
         */
        function clearMessageData(handler) {
            var dispatcher = dispatcherMap.get(handler);
            if (dispatcher !== void 0) {
                dispatcherMap.delete(handler);
                dispatcher.clearPendingMessages();
                dispatcher.clearMessageFilters();
            }
        }
        core.clearMessageData = clearMessageData;
        /**
         * The internal mapping of message handler to message dispatcher.
         */
        var dispatcherMap = new WeakMap();
        /**
         * The internal queue of posted message dispatchers.
         */
        var dispatchQueue = new Queue();
        /**
         * The internal animation frame id for the message loop wake up call.
         */
        var frameId = 0;
        /**
         * A local reference to `requestAnimationFrame`.
         */
        var raf = requestAnimationFrame;
        /**
         * Get or create the message dispatcher for an message handler.
         */
        function getDispatcher(handler) {
            var dispatcher = dispatcherMap.get(handler);
            if (dispatcher === void 0) {
                dispatcher = new MessageDispatcher(handler);
                dispatcherMap.set(handler, dispatcher);
            }
            return dispatcher;
        }
        /**
         * Wake up the message loop to process any pending dispatchers.
         *
         * This is a no-op if a wake up is not needed or is already pending.
         */
        function wakeUpMessageLoop() {
            if (frameId === 0 && !dispatchQueue.empty) {
                frameId = raf(runMessageLoop);
            }
        }
        /**
         * Run an iteration of the message loop.
         *
         * This will process all pending dispatchers in the queue. Dispatchers
         * which are added to the queue while the message loop is running will
         * be processed on the next message loop cycle.
         */
        function runMessageLoop() {
            // Clear the frame id so the next wake up call can be scheduled.
            frameId = 0;
            // If the queue is empty, there is nothing else to do.
            if (dispatchQueue.empty) {
                return;
            }
            // Add a null sentinel value to the end of the queue. The queue
            // will only be processed up to the first null value. This means
            // that messages posted during this cycle will execute on the next
            // cycle of the loop. If the last value in the array is null, it
            // means that an exception was thrown by a message handler and the
            // loop had to be restarted.
            if (dispatchQueue.back !== null) {
                dispatchQueue.pushBack(null);
            }
            // The message dispatch loop. If the dispatcher is the null sentinel,
            // the processing of the current block of messages is complete and
            // another loop is scheduled. Otherwise, the pending message is
            // dispatched to the message handler.
            while (!dispatchQueue.empty) {
                var dispatcher = dispatchQueue.popFront();
                if (dispatcher === null) {
                    wakeUpMessageLoop();
                    return;
                }
                dispatchMessage(dispatcher);
            }
        }
        /**
         * Safely process the pending handler message.
         *
         * If the message handler throws an exception, the message loop will
         * be restarted and the exception will be rethrown.
         */
        function dispatchMessage(dispatcher) {
            try {
                dispatcher.sendPendingMessage();
            }
            catch (ex) {
                wakeUpMessageLoop();
                throw ex;
            }
        }
        /**
         * A thin wrapper around a message filter.
         */
        var FilterWrapper = (function () {
            /**
             * construct a new filter wrapper.
             */
            function FilterWrapper(filter) {
                this._filter = filter;
            }
            /**
             * Clear the contents of the wrapper.
             */
            FilterWrapper.prototype.clear = function () {
                this._filter = null;
            };
            /**
             * Test whether the wrapper is equivalent to the given filter.
             */
            FilterWrapper.prototype.equals = function (filter) {
                return this._filter === filter;
            };
            /**
             * Invoke the filter with the given handler and message.
             *
             * Returns true if the message should be filtered, false otherwise.
             */
            FilterWrapper.prototype.invoke = function (handler, msg) {
                return this._filter ? this._filter.filterMessage(handler, msg) : false;
            };
            return FilterWrapper;
        })();
        /**
         * An object which manages message dispatch for a message handler.
         */
        var MessageDispatcher = (function () {
            /**
             * Construct a new message dispatcher.
             */
            function MessageDispatcher(handler) {
                this._messages = null;
                this._filters = null;
                this._handler = handler;
            }
            /**
             * Send an message to the message handler to process immediately.
             *
             * The message will first be sent through the installed filters.
             * If the message is filtered, it will not be sent to the handler.
             */
            MessageDispatcher.prototype.sendMessage = function (msg) {
                if (!this._filterMessage(msg)) {
                    this._handler.processMessage(msg);
                }
            };
            /**
             * Post a message to the message handler to process in the future.
             *
             * The message will first be compressed if possible. If the message
             * cannot be compressed, it will be added to the message queue.
             */
            MessageDispatcher.prototype.postMessage = function (msg) {
                if (!this._compressMessage(msg)) {
                    this._enqueueMessage(msg);
                }
            };
            /**
             * Test whether the message handler has pending messages.
             */
            MessageDispatcher.prototype.hasPendingMessages = function () {
                return this._messages !== null && !this._messages.empty;
            };
            /**
             * Send the first pending message to the message handler.
             */
            MessageDispatcher.prototype.sendPendingMessage = function () {
                if (this._messages !== null && !this._messages.empty) {
                    this.sendMessage(this._messages.popFront());
                }
            };
            /**
             * Clear the pending messages for the message handler.
             */
            MessageDispatcher.prototype.clearPendingMessages = function () {
                if (this._messages !== null) {
                    this._messages.clear();
                    this._messages = null;
                }
            };
            /**
             * Install an message filter for the message handler.
             */
            MessageDispatcher.prototype.installMessageFilter = function (filter) {
                var wrapper = new FilterWrapper(filter);
                var current = this._filters;
                if (current === null) {
                    this._filters = wrapper;
                }
                else if (current instanceof FilterWrapper) {
                    this._filters = [current, wrapper];
                }
                else {
                    current.push(wrapper);
                }
            };
            /**
             * Remove an message filter installed for the message handler.
             */
            MessageDispatcher.prototype.removeMessageFilter = function (filter) {
                var current = this._filters;
                if (current === null) {
                    return;
                }
                if (current instanceof FilterWrapper) {
                    if (current.equals(filter)) {
                        current.clear();
                        this._filters = null;
                    }
                }
                else {
                    var rest = [];
                    var array = current;
                    for (var i = 0, n = array.length; i < n; ++i) {
                        var wrapper = array[i];
                        if (wrapper.equals(filter)) {
                            wrapper.clear();
                        }
                        else {
                            rest.push(wrapper);
                        }
                    }
                    if (rest.length === 0) {
                        this._filters = null;
                    }
                    else if (rest.length === 1) {
                        this._filters = rest[0];
                    }
                    else {
                        this._filters = rest;
                    }
                }
            };
            /**
             * Remove all message filters installed for the message handler.
             */
            MessageDispatcher.prototype.clearMessageFilters = function () {
                var current = this._filters;
                if (current === null) {
                    return;
                }
                this._filters = null;
                if (current instanceof FilterWrapper) {
                    current.clear();
                }
                else {
                    var array = current;
                    for (var i = 0, n = array.length; i < n; ++i) {
                        array[i].clear();
                    }
                }
            };
            /**
             * Compress an message posted to the message handler, if possible.
             *
             * Returns true if the message was compressed, or false if the
             * message should be posted to the message queue as normal.
             */
            MessageDispatcher.prototype._compressMessage = function (msg) {
                if (this._handler.compressMessage === void 0) {
                    return false;
                }
                if (this._messages === null || this._messages.empty) {
                    return false;
                }
                return this._handler.compressMessage(msg, this._messages);
            };
            /**
             * Send an message through the installed message filters.
             *
             * Returns true if the message should be filtered, false otherwise.
             */
            MessageDispatcher.prototype._filterMessage = function (msg) {
                var current = this._filters;
                if (current === null) {
                    return false;
                }
                if (current instanceof FilterWrapper) {
                    return current.invoke(this._handler, msg);
                }
                var handler = this._handler;
                var array = current;
                for (var i = array.length - 1; i >= 0; --i) {
                    if (array[i].invoke(handler, msg)) {
                        return true;
                    }
                }
                return false;
            };
            /**
             * Add a message to the message queue and wake up the message loop.
             */
            MessageDispatcher.prototype._enqueueMessage = function (msg) {
                if (this._messages === null) {
                    this._messages = new Queue();
                }
                this._messages.pushBack(msg);
                dispatchQueue.pushBack(this);
                wakeUpMessageLoop();
            };
            return MessageDispatcher;
        })();
    })(core = phosphor.core || (phosphor.core = {}));
})(phosphor || (phosphor = {})); // module phosphor.core

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var core;
    (function (core) {
        /**
         * A base class for creating objects which manage a DOM node.
         */
        var NodeBase = (function () {
            /**
             * Construct a new node base.
             */
            function NodeBase() {
                this._node = this.constructor.createNode();
            }
            /**
             * Create the DOM node for a new object instance.
             *
             * This may be reimplemented to create a custom DOM node.
             */
            NodeBase.createNode = function () {
                return document.createElement('div');
            };
            /**
             * Dispose of the resources held by the object.
             *
             * This method only clears the reference to the DOM node, it does not
             * remove it from the DOM. Subclasses should reimplement this method
             * to perform custom cleanup.
             */
            NodeBase.prototype.dispose = function () {
                this._node = null;
            };
            Object.defineProperty(NodeBase.prototype, "node", {
                /**
                 * Get the DOM node managed by the object.
                 */
                get: function () {
                    return this._node;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Test whether the object's DOM node has the given class name.
             */
            NodeBase.prototype.hasClass = function (name) {
                return this._node.classList.contains(name);
            };
            /**
             * Add a class name to the object's DOM node.
             */
            NodeBase.prototype.addClass = function (name) {
                this._node.classList.add(name);
            };
            /**
             * Remove a class name from the object's DOM node.
             */
            NodeBase.prototype.removeClass = function (name) {
                this._node.classList.remove(name);
            };
            return NodeBase;
        })();
        core.NodeBase = NodeBase;
    })(core = phosphor.core || (phosphor.core = {}));
})(phosphor || (phosphor = {})); // phosphor.core

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var core;
    (function (core) {
        /**
         * A decorator which defines a signal for an object.
         *
         * @param obj - The object on which to define the signal.
         *
         * @param name - The name of the signal to define.
         *
         * #### Notes
         * This function can also be used as a non-decorator by invoking it
         * directly on the target object.
         *
         * #### Example
         * ```typescript
         * class SomeClass {
         *
         *   @signal
         *   valueChanged: ISignal<number>;
         *
         * }
         *
         * // define a signal directly on a prototype
         * signal(SomeClass.prototype, 'valueChanged');
         *
         * // define a signal directly on an object
         * signal(someObject, 'someSignal');
         * ```
         */
        function signal(obj, name) {
            Object.defineProperty(obj, name, {
                get: function () { return new BoundSignal(this, name); },
            });
        }
        core.signal = signal;
        /**
         * Get the object which is emitting the curent signal.
         *
         * #### Notes
         * If a signal is not currently being emitted, this returns `null`.
         *
         * #### Example
         * ```typescript
         * someObject.valueChanged.connect(myCallback);
         *
         * someObject.valueChanged.emit(42);
         *
         * function myCallback(value: number): void {
         *   console.log(sender() === someObject); // true
         * }
         * ```
         */
        function sender() {
            return currentSender;
        }
        core.sender = sender;
        /**
         * Remove all signal connections where the given object is the sender.
         *
         * @param obj - The sender object of interest.
         *
         * #### Example
         * ```typescript
         * disconnectSender(someObject);
         * ```
         */
        function disconnectSender(obj) {
            var hash = senderMap.get(obj);
            if (!hash) {
                return;
            }
            for (var name in hash) {
                var conn = hash[name].first;
                while (conn !== null) {
                    removeFromSendersList(conn);
                    conn.callback = null;
                    conn.thisArg = null;
                    conn = conn.nextReceiver;
                }
            }
            senderMap.delete(obj);
        }
        core.disconnectSender = disconnectSender;
        /**
         * Remove all signal connections where the given object is the receiver.
         *
         * @param obj - The receiver object of interest.
         *
         * #### Notes
         * If a `thisArg` is provided when connecting a signal, that object
         * is considered the receiver. Otherwise, the `callback` is used as
         * the receiver.
         *
         * #### Example
         * ```typescript
         * // disconnect a regular object receiver
         * disconnectReceiver(myObject);
         *
         * // disconnect a plain callback receiver
         * disconnectReceiver(myCallback);
         * ```
         */
        function disconnectReceiver(obj) {
            var conn = receiverMap.get(obj);
            if (!conn) {
                return;
            }
            while (conn !== null) {
                var temp = conn.nextSender;
                conn.callback = null;
                conn.thisArg = null;
                conn.prevSender = null;
                conn.nextSender = null;
                conn = temp;
            }
            receiverMap.delete(obj);
        }
        core.disconnectReceiver = disconnectReceiver;
        /**
         * Clear all signal data associated with the given object.
         *
         * #### Notes
         * This removes all signal connections where the object is used as
         * either the sender or the receiver.
         *
         * #### Example
         * ```typescript
         * clearSignalData(someObject);
         * ```
         */
        function clearSignalData(obj) {
            disconnectSender(obj);
            disconnectReceiver(obj);
        }
        core.clearSignalData = clearSignalData;
        /**
         * A concrete implementation of ISignal.
         */
        var BoundSignal = (function () {
            /**
             * Construct a new bound signal.
             */
            function BoundSignal(sender, name) {
                this._sender = sender;
                this._name = name;
            }
            /**
             * Connect a callback to the signal.
             */
            BoundSignal.prototype.connect = function (callback, thisArg) {
                return connect(this._sender, this._name, callback, thisArg);
            };
            /**
             * Disconnect a callback from the signal.
             */
            BoundSignal.prototype.disconnect = function (callback, thisArg) {
                return disconnect(this._sender, this._name, callback, thisArg);
            };
            /**
             * Emit the signal and invoke the connected callbacks.
             */
            BoundSignal.prototype.emit = function (args) {
                emit(this._sender, this._name, args);
            };
            return BoundSignal;
        })();
        /**
         * A struct which holds connection data.
         */
        var Connection = (function () {
            function Connection() {
                /**
                 * The callback connected to the signal.
                 */
                this.callback = null;
                /**
                 * The `this` context for the callback.
                 */
                this.thisArg = null;
                /**
                 * The next connection in the singly linked receivers list.
                 */
                this.nextReceiver = null;
                /**
                 * The next connection in the doubly linked senders list.
                 */
                this.nextSender = null;
                /**
                 * The previous connection in the doubly linked senders list.
                 */
                this.prevSender = null;
            }
            return Connection;
        })();
        /**
         * The list of receiver connections for a specific signal.
         */
        var ConnectionList = (function () {
            function ConnectionList() {
                /**
                 * The ref count for the list.
                 */
                this.refs = 0;
                /**
                 * The first connection in the list.
                 */
                this.first = null;
                /**
                 * The last connection in the list.
                 */
                this.last = null;
            }
            return ConnectionList;
        })();
        /**
         * A mapping of sender object to its connection map.
         */
        var senderMap = new WeakMap();
        /**
         * A mapping of receiver object to its connection array.
         */
        var receiverMap = new WeakMap();
        /**
         * The object emitting the current signal.
         */
        var currentSender = null;
        /**
         * Connect a signal to a callback.
         */
        function connect(sender, name, callback, thisArg) {
            // Warn and bail if a required argument is null.
            if (!sender || !name || !callback) {
                console.warn('null argument passed to `connect()`');
                return false;
            }
            // Coerce a `null` thisArg to `undefined`.
            thisArg = thisArg || void 0;
            // Get the connection map for the sender or create one if necessary.
            var hash = senderMap.get(sender);
            if (!hash) {
                hash = Object.create(null);
                senderMap.set(sender, hash);
            }
            // Search for an equivalent connection and bail if one is found.
            var list = hash[name];
            if (list && findConnection(list, callback, thisArg)) {
                return false;
            }
            // Create a new connection.
            var conn = new Connection();
            conn.callback = callback;
            conn.thisArg = thisArg;
            // Add the connection to the senders list.
            if (!list) {
                list = new ConnectionList();
                list.first = conn;
                list.last = conn;
                hash[name] = list;
            }
            else {
                list.last.nextReceiver = conn;
                list.last = conn;
            }
            // Add the connection to the receivers list.
            var receiver = thisArg || callback;
            var front = receiverMap.get(receiver);
            if (front) {
                front.prevSender = conn;
                conn.nextSender = front;
            }
            receiverMap.set(receiver, conn);
            return true;
        }
        /**
         * Disconnect a signal from a callback.
         */
        function disconnect(sender, name, callback, thisArg) {
            // Warn and bail if a required argument is null.
            if (!sender || !name || !callback) {
                console.warn('null argument passed to `disconnect()`');
                return false;
            }
            // Coerce a `null` thisArg to `undefined`.
            thisArg = thisArg || void 0;
            // Bail early if there is no equivalent connection.
            var hash = senderMap.get(sender);
            if (!hash) {
                return false;
            }
            var list = hash[name];
            if (!list) {
                return false;
            }
            var conn = findConnection(list, callback, thisArg);
            if (!conn) {
                return false;
            }
            // Remove the connection from the senders list. It will be removed
            // from the receivers list the next time the signal is emitted.
            removeFromSendersList(conn);
            // Clear the connection data so it becomes a dead connection.
            conn.callback = null;
            conn.thisArg = null;
            return true;
        }
        /**
         * Emit a signal and invoke its connected callbacks.
         */
        function emit(sender, name, args) {
            var hash = senderMap.get(sender);
            if (!hash) {
                return;
            }
            var list = hash[name];
            if (!list) {
                return;
            }
            var temp = currentSender;
            currentSender = sender;
            list.refs++;
            try {
                var dirty = invokeList(list, args);
            }
            finally {
                currentSender = temp;
                list.refs--;
            }
            if (dirty && list.refs === 0) {
                cleanList(list);
            }
        }
        /**
         * Find a matching connection in the given connection list.
         *
         * Returns undefined if a match is not found.
         */
        function findConnection(list, callback, thisArg) {
            var conn = list.first;
            while (conn !== null) {
                if (conn.callback === callback && conn.thisArg === thisArg) {
                    return conn;
                }
                conn = conn.nextReceiver;
            }
            return void 0;
        }
        /**
         * Invoke the callbacks in the given connection list.
         *
         * Connections added during dispatch will not be invoked. This returns
         * `true` if there are dead connections in the list, `false` otherwise.
         */
        function invokeList(list, args) {
            var dirty = false;
            var last = list.last;
            var conn = list.first;
            while (conn !== null) {
                if (conn.callback) {
                    conn.callback.call(conn.thisArg, args);
                }
                else {
                    dirty = true;
                }
                if (conn === last) {
                    break;
                }
                conn = conn.nextReceiver;
            }
            return dirty;
        }
        /**
         * Remove the dead connections from the given connection list.
         */
        function cleanList(list) {
            var prev;
            var conn = list.first;
            while (conn !== null) {
                var next = conn.nextReceiver;
                if (!conn.callback) {
                    conn.nextReceiver = null;
                }
                else if (!prev) {
                    list.first = conn;
                    prev = conn;
                }
                else {
                    prev.nextReceiver = conn;
                    prev = conn;
                }
                conn = next;
            }
            if (!prev) {
                list.first = null;
                list.last = null;
            }
            else {
                prev.nextReceiver = null;
                list.last = prev;
            }
        }
        /**
         * Remove a connection from the doubly linked list of senders.
         */
        function removeFromSendersList(conn) {
            var receiver = conn.thisArg || conn.callback;
            var prev = conn.prevSender;
            var next = conn.nextSender;
            if (prev === null && next === null) {
                receiverMap.delete(receiver);
            }
            else if (prev === null) {
                receiverMap.set(receiver, next);
                next.prevSender = null;
            }
            else if (next === null) {
                prev.nextSender = null;
            }
            else {
                prev.nextSender = next;
                next.prevSender = prev;
            }
            conn.prevSender = null;
            conn.nextSender = null;
        }
    })(core = phosphor.core || (phosphor.core = {}));
})(phosphor || (phosphor = {})); // module phosphor.core

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var di;
    (function (di) {
        /**
         * A token object which holds compile-time type information.
         */
        var Token = (function () {
            /**
             * Construct a new token.
             *
             * @param name - A human readable name for the token.
             */
            function Token(name) {
                this._name = name;
            }
            Object.defineProperty(Token.prototype, "name", {
                /**
                 * Get the human readable name for the token.
                 */
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            return Token;
        })();
        di.Token = Token;
    })(di = phosphor.di || (phosphor.di = {}));
})(phosphor || (phosphor = {})); // module phosphor.di

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var di;
    (function (di) {
        /**
         * A lightweight dependency injection container.
         */
        var Container = (function () {
            /**
             * Construct a new container.
             */
            function Container() {
                this._registry = new Map();
            }
            /**
             * Test whether a type is registered with the container.
             */
            Container.prototype.isRegistered = function (token) {
                return this._registry.has(token);
            };
            /**
             * Register a type mapping with the container.
             *
             * An exception will be thrown if the type is already registered.
             *
             * The allowed lifetimes are:
             *
             *   'singleton' - Only a single instance of the type is ever
             *      created, and that instance is shared by all objects
             *      which have a dependency on the given type id.
             *
             *   'transient' - A new instance of the type is created each
             *      time the dependency is fullfilled for an object which
             *      has a dependency on the given type id.
             *
             *   'perresolve' - A single instance of the type is created
             *      each time the `resolve` method is called, and that
             *      instance is shared by all objects which are created
             *      during the same resolve pass and have a dependency
             *      on the given type id.
             *
             * The default lifetime is 'singleton'.
             */
            Container.prototype.registerType = function (token, type, lifetime) {
                if (this._registry.has(token)) {
                    throw new Error('token is already registered');
                }
                var lt = createLifetime(lifetime || 'singleton');
                this._registry.set(token, { type: type, lifetime: lt });
            };
            /**
             * Register an instance mapping with the container.
             *
             * This is the same as a 'singleton' type registration, except
             * that the user creates the instance of the type beforehand.
             *
             * This will throw an exception if the token is already registered.
             */
            Container.prototype.registerInstance = function (token, instance) {
                if (this._registry.has(token)) {
                    throw new Error('token is already registered');
                }
                var lt = new SingletonLifetime(instance);
                this._registry.set(token, { type: null, lifetime: lt });
            };
            /**
             * Resolve an instance for the given token or type.
             *
             * An error is thrown if no type mapping is registered for the
             * token or if the injection dependencies cannot be fulfilled.
             */
            Container.prototype.resolve = function (token) {
                if (typeof token === 'function') {
                    return this._resolveType(token, resolveKeyTick++);
                }
                return this._resolveToken(token, resolveKeyTick++);
            };
            /**
             * Resolve an instance for the given token.
             *
             * An error is thrown if the token is not registered.
             */
            Container.prototype._resolveToken = function (token, key) {
                var item = this._registry.get(token);
                if (item === void 0) {
                    throw new Error('`' + token.name + '` is not registered');
                }
                var instance = item.lifetime.get(key);
                if (instance) {
                    return instance;
                }
                instance = this._resolveType(item.type, key);
                item.lifetime.set(key, instance);
                return instance;
            };
            /**
             * Resolve an instance of the given type.
             *
             * An error is thrown if the type dependencies cannot be fulfilled.
             */
            Container.prototype._resolveType = function (type, key) {
                var instance = Object.create(type.prototype);
                var deps = type.$inject;
                if (!deps || deps.length === 0) {
                    return type.call(instance) || instance;
                }
                var args = [];
                for (var i = 0, n = deps.length; i < n; ++i) {
                    args[i] = this._resolveToken(deps[i], key);
                }
                return type.apply(instance, args) || instance;
            };
            return Container;
        })();
        di.Container = Container;
        /**
         * An internal resolve key counter.
         */
        var resolveKeyTick = 0;
        /**
         * Create a lifetime object for the given string.
         */
        function createLifetime(lifetime) {
            if (lifetime === 'transient') {
                return transientInstance;
            }
            if (lifetime === 'singleton') {
                return new SingletonLifetime();
            }
            if (lifetime === 'perresolve') {
                return new PerResolveLifetime();
            }
            throw new Error('invalid lifetime: ' + lifetime);
        }
        /**
         * A lifetime which never caches its object.
         */
        var TransientLifetime = (function () {
            function TransientLifetime() {
            }
            /**
             * Get the cached object for the lifetime.
             */
            TransientLifetime.prototype.get = function (key) { return null; };
            /**
             * Set the cached object for the lifetime.
             */
            TransientLifetime.prototype.set = function (key, val) { };
            return TransientLifetime;
        })();
        /**
         * Only a single transient lifetime instance is ever needed.
         */
        var transientInstance = new TransientLifetime();
        /**
         * A lifetime which always caches its object.
         */
        var SingletonLifetime = (function () {
            /**
             * Construct a new singleton lifetime.
             */
            function SingletonLifetime(val) {
                if (val === void 0) { val = null; }
                this._val = val;
            }
            /**
             * Get the cached object for the lifetime if one exists.
             */
            SingletonLifetime.prototype.get = function (key) { return this._val; };
            /**
             * Set the cached object for the lifetime if needed.
             */
            SingletonLifetime.prototype.set = function (key, val) { this._val = val; };
            return SingletonLifetime;
        })();
        /**
         * A lifetime which caches the instance on a per-resolve basis.
         */
        var PerResolveLifetime = (function () {
            function PerResolveLifetime() {
                this._key = 0;
                this._val = null;
            }
            /**
             * Get the cached object for the lifetime if one exists.
             */
            PerResolveLifetime.prototype.get = function (key) { return this._key === key ? this._val : null; };
            /**
             * Set the cached object for the lifetime if needed.
             */
            PerResolveLifetime.prototype.set = function (key, val) { this._key = key; this._val = val; };
            return PerResolveLifetime;
        })();
    })(di = phosphor.di || (phosphor.di = {}));
})(phosphor || (phosphor = {})); // module phosphor.di

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var di;
    (function (di) {
        /**
         * The interface token for IContainer.
         */
        di.IContainer = new di.Token('phosphor.di.IContainer');
    })(di = phosphor.di || (phosphor.di = {}));
})(phosphor || (phosphor = {})); // module phosphor.di

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var virtualdom;
    (function (virtualdom) {
        var emptyArray = phosphor.utility.emptyArray;
        var emptyObject = phosphor.utility.emptyObject;
        /**
         * Create an elem factory function for the given tag.
         *
         * This will typically be used to create an elem factory function for
         * a user defined component. The `virtualdom` module exports a `dom`
         * object which contains factories for the standard DOM elements.
         */
        function createFactory(tag) {
            return factory.bind(void 0, tag);
        }
        virtualdom.createFactory = createFactory;
        /**
         * Extend the first array with elements of the second.
         *
         * Falsey values in the second array are ignored.
         */
        function extend(first, second) {
            for (var i = 0, n = second.length; i < n; ++i) {
                var item = second[i];
                if (item)
                    first.push(item);
            }
        }
        /**
         * The elem factory function implementation.
         *
         * When bound to a tag, this function implements `IFactory`.
         */
        function factory(tag, first) {
            var data = null;
            var children = null;
            if (first) {
                if (typeof first === 'string') {
                    children = [first];
                }
                else if (first instanceof virtualdom.Elem) {
                    children = [first];
                }
                else if (first instanceof Array) {
                    children = first.slice();
                }
                else {
                    data = first;
                }
            }
            var count = arguments.length;
            if (count > 2) {
                children = children || [];
                for (var i = 2; i < count; ++i) {
                    var child = arguments[i];
                    if (child instanceof Array) {
                        extend(children, child);
                    }
                    else if (child) {
                        children.push(child);
                    }
                }
            }
            if (children) {
                for (var i = 0, n = children.length; i < n; ++i) {
                    var child = children[i];
                    if (typeof child === 'string') {
                        children[i] = new virtualdom.Elem(virtualdom.ElemType.Text, child, emptyObject, emptyArray);
                    }
                }
            }
            data = data || emptyObject;
            children = children || emptyArray;
            var elem;
            if (typeof tag === 'string') {
                elem = new virtualdom.Elem(virtualdom.ElemType.Node, tag, data, children);
            }
            else {
                elem = new virtualdom.Elem(virtualdom.ElemType.Component, tag, data, children);
            }
            return elem;
        }
    })(virtualdom = phosphor.virtualdom || (phosphor.virtualdom = {}));
})(phosphor || (phosphor = {})); // module phosphor.virtualdom

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var virtualdom;
    (function (virtualdom) {
        var Message = phosphor.core.Message;
        var NodeBase = phosphor.core.NodeBase;
        var clearMessageData = phosphor.core.clearMessageData;
        var postMessage = phosphor.core.postMessage;
        var sendMessage = phosphor.core.sendMessage;
        var emptyArray = phosphor.utility.emptyArray;
        var emptyObject = phosphor.utility.emptyObject;
        /**
         * A singleton 'update-request' message.
         */
        var MSG_UPDATE_REQUEST = new Message('update-request');
        /**
         * A concrete implementation of IComponent.
         *
         * This class serves as a convenient base class for components which
         * manage the content of their node independent of the virtual DOM.
         */
        var BaseComponent = (function (_super) {
            __extends(BaseComponent, _super);
            /**
             * Construct a new base component.
             */
            function BaseComponent(data, children) {
                _super.call(this);
                this._data = emptyObject;
                this._children = emptyArray;
                this._data = data;
                this._children = children;
            }
            /**
             * Dispose of the resources held by the component.
             */
            BaseComponent.prototype.dispose = function () {
                clearMessageData(this);
                this._data = null;
                this._children = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(BaseComponent.prototype, "data", {
                /**
                 * Get the current data object for the component.
                 */
                get: function () {
                    return this._data;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BaseComponent.prototype, "children", {
                /**
                 * Get the current elem children for the component.
                 */
                get: function () {
                    return this._children;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Initialize the component with new data and children.
             *
             * This is called whenever the component is re-rendered by its parent.
             *
             * It is *not* called when the component is first instantiated.
             */
            BaseComponent.prototype.init = function (data, children) {
                this._data = data;
                this._children = children;
            };
            /**
             * Schedule an update for the component.
             *
             * If the `immediate` flag is false (the default) the update will be
             * scheduled for the next cycle of the event loop. If `immediate` is
             * true, the component will be updated immediately. Multiple pending
             * requests are collapsed into a single update.
             *
             * #### Notes
             * The semantics of an update are defined by a supporting component.
             */
            BaseComponent.prototype.update = function (immediate) {
                if (immediate === void 0) { immediate = false; }
                if (immediate) {
                    sendMessage(this, MSG_UPDATE_REQUEST);
                }
                else {
                    postMessage(this, MSG_UPDATE_REQUEST);
                }
            };
            /**
             * Process a message sent to the component.
             */
            BaseComponent.prototype.processMessage = function (msg) {
                switch (msg.type) {
                    case 'update-request':
                        this.onUpdateRequest(msg);
                        break;
                    case 'after-attach':
                        this.onAfterAttach(msg);
                        break;
                    case 'before-detach':
                        this.onBeforeDetach(msg);
                        break;
                    case 'before-move':
                        this.onBeforeMove(msg);
                        break;
                    case 'after-move':
                        this.onAfterMove(msg);
                        break;
                }
            };
            /**
             * Compress a message posted to the component.
             */
            BaseComponent.prototype.compressMessage = function (msg, pending) {
                if (msg.type === 'update-request') {
                    return pending.some(function (other) { return other.type === msg.type; });
                }
                return false;
            };
            /**
             * A method invoked on an 'update-request' message.
             *
             * The default implementation is a no-op.
             */
            BaseComponent.prototype.onUpdateRequest = function (msg) { };
            /**
             * A method invoked on an 'after-attach' message.
             *
             * The default implementation is a no-op.
             */
            BaseComponent.prototype.onAfterAttach = function (msg) { };
            /**
             * A method invoked on a 'before-detach' message.
             *
             * The default implementation is a no-op.
             */
            BaseComponent.prototype.onBeforeDetach = function (msg) { };
            /**
             * A method invoked on a 'before-move' message.
             *
             * The default implementation is a no-op.
             */
            BaseComponent.prototype.onBeforeMove = function (msg) { };
            /**
             * A method invoked on an 'after-move' message.
             *
             * The default implementation is a no-op.
             */
            BaseComponent.prototype.onAfterMove = function (msg) { };
            return BaseComponent;
        })(NodeBase);
        virtualdom.BaseComponent = BaseComponent;
    })(virtualdom = phosphor.virtualdom || (phosphor.virtualdom = {}));
})(phosphor || (phosphor = {})); // module phosphor.virtualdom

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var virtualdom;
    (function (virtualdom) {
        var Message = phosphor.core.Message;
        var sendMessage = phosphor.core.sendMessage;
        var emptyObject = phosphor.utility.emptyObject;
        /**
         * A singleton 'before-render' message.
         */
        var MSG_BEFORE_RENDER = new Message('before-render');
        /**
         * A singleton 'after-render' message.
         */
        var MSG_AFTER_RENDER = new Message('after-render');
        /**
         * A component which renders its content using the virtual DOM.
         *
         * User code should subclass this class and reimplement the `render`
         * method to generate the virtual DOM content for the component.
         */
        var Component = (function (_super) {
            __extends(Component, _super);
            function Component() {
                _super.apply(this, arguments);
                this._refs = emptyObject;
            }
            /**
             * Create the DOM node for a component.
             *
             * This method creates the DOM node from the `className` and `tagName`
             * properties. A subclass will not typically reimplement this method.
             */
            Component.createNode = function () {
                var node = document.createElement(this.tagName);
                node.className = this.className;
                return node;
            };
            /**
             * Dispose of the resources held by the component.
             */
            Component.prototype.dispose = function () {
                this._refs = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(Component.prototype, "refs", {
                /**
                 * Get the current refs mapping for the component.
                 */
                get: function () {
                    return this._refs;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Process a message sent to the component.
             */
            Component.prototype.processMessage = function (msg) {
                switch (msg.type) {
                    case 'before-render':
                        this.onBeforeRender(msg);
                        break;
                    case 'after-render':
                        this.onAfterRender(msg);
                        break;
                    default:
                        _super.prototype.processMessage.call(this, msg);
                }
            };
            /**
             * Create the virtual DOM content for the component.
             *
             * The rendered content is used to populate the component's node.
             *
             * The default implementation returns `null`.
             */
            Component.prototype.render = function () {
                return null;
            };
            /**
             * A method invoked on an 'update-request' message.
             *
             * This renders the virtual DOM content into the component's node.
             */
            Component.prototype.onUpdateRequest = function (msg) {
                sendMessage(this, MSG_BEFORE_RENDER);
                this._refs = virtualdom.render(this.render(), this.node);
                sendMessage(this, MSG_AFTER_RENDER);
            };
            /**
             * A method invoked on a 'before-render' message.
             *
             * The default implementation is a no-op.
             */
            Component.prototype.onBeforeRender = function (msg) { };
            /**
             * A method invoked on an 'after-render' message.
             *
             * The default implementation is a no-op.
             */
            Component.prototype.onAfterRender = function (msg) { };
            /**
             * The tag name to use when creating the component node.
             *
             * This may be reimplemented by a subclass.
             */
            Component.tagName = 'div';
            /**
             * The initial class name for the component node.
             *
             * This may be reimplemented by a subclass.
             */
            Component.className = '';
            return Component;
        })(virtualdom.BaseComponent);
        virtualdom.Component = Component;
    })(virtualdom = phosphor.virtualdom || (phosphor.virtualdom = {}));
})(phosphor || (phosphor = {})); // module phosphor.virtualdom

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var virtualdom;
    (function (virtualdom) {
        /**
         * The virtual dom factory functions.
         */
        virtualdom.dom = {
            a: virtualdom.createFactory('a'),
            abbr: virtualdom.createFactory('abbr'),
            address: virtualdom.createFactory('address'),
            area: virtualdom.createFactory('area'),
            article: virtualdom.createFactory('article'),
            aside: virtualdom.createFactory('aside'),
            audio: virtualdom.createFactory('audio'),
            b: virtualdom.createFactory('b'),
            bdi: virtualdom.createFactory('bdi'),
            bdo: virtualdom.createFactory('bdo'),
            blockquote: virtualdom.createFactory('blockquote'),
            br: virtualdom.createFactory('br'),
            button: virtualdom.createFactory('button'),
            canvas: virtualdom.createFactory('canvas'),
            caption: virtualdom.createFactory('caption'),
            cite: virtualdom.createFactory('cite'),
            code: virtualdom.createFactory('code'),
            col: virtualdom.createFactory('col'),
            colgroup: virtualdom.createFactory('colgroup'),
            data: virtualdom.createFactory('data'),
            datalist: virtualdom.createFactory('datalist'),
            dd: virtualdom.createFactory('dd'),
            del: virtualdom.createFactory('del'),
            dfn: virtualdom.createFactory('dfn'),
            div: virtualdom.createFactory('div'),
            dl: virtualdom.createFactory('dl'),
            dt: virtualdom.createFactory('dt'),
            em: virtualdom.createFactory('em'),
            embed: virtualdom.createFactory('embed'),
            fieldset: virtualdom.createFactory('fieldset'),
            figcaption: virtualdom.createFactory('figcaption'),
            figure: virtualdom.createFactory('figure'),
            footer: virtualdom.createFactory('footer'),
            form: virtualdom.createFactory('form'),
            h1: virtualdom.createFactory('h1'),
            h2: virtualdom.createFactory('h2'),
            h3: virtualdom.createFactory('h3'),
            h4: virtualdom.createFactory('h4'),
            h5: virtualdom.createFactory('h5'),
            h6: virtualdom.createFactory('h6'),
            header: virtualdom.createFactory('header'),
            hr: virtualdom.createFactory('hr'),
            i: virtualdom.createFactory('i'),
            iframe: virtualdom.createFactory('iframe'),
            img: virtualdom.createFactory('img'),
            input: virtualdom.createFactory('input'),
            ins: virtualdom.createFactory('ins'),
            kbd: virtualdom.createFactory('kbd'),
            label: virtualdom.createFactory('label'),
            legend: virtualdom.createFactory('legend'),
            li: virtualdom.createFactory('li'),
            main: virtualdom.createFactory('main'),
            map: virtualdom.createFactory('map'),
            mark: virtualdom.createFactory('mark'),
            meter: virtualdom.createFactory('meter'),
            nav: virtualdom.createFactory('nav'),
            noscript: virtualdom.createFactory('noscript'),
            object: virtualdom.createFactory('object'),
            ol: virtualdom.createFactory('ol'),
            optgroup: virtualdom.createFactory('optgroup'),
            option: virtualdom.createFactory('option'),
            output: virtualdom.createFactory('output'),
            p: virtualdom.createFactory('p'),
            param: virtualdom.createFactory('param'),
            pre: virtualdom.createFactory('pre'),
            progress: virtualdom.createFactory('progress'),
            q: virtualdom.createFactory('q'),
            rp: virtualdom.createFactory('rp'),
            rt: virtualdom.createFactory('rt'),
            ruby: virtualdom.createFactory('ruby'),
            s: virtualdom.createFactory('s'),
            samp: virtualdom.createFactory('samp'),
            section: virtualdom.createFactory('section'),
            select: virtualdom.createFactory('select'),
            small: virtualdom.createFactory('small'),
            source: virtualdom.createFactory('source'),
            span: virtualdom.createFactory('span'),
            strong: virtualdom.createFactory('strong'),
            sub: virtualdom.createFactory('sub'),
            summary: virtualdom.createFactory('summary'),
            sup: virtualdom.createFactory('sup'),
            table: virtualdom.createFactory('table'),
            tbody: virtualdom.createFactory('tbody'),
            td: virtualdom.createFactory('td'),
            textarea: virtualdom.createFactory('textarea'),
            tfoot: virtualdom.createFactory('tfoot'),
            th: virtualdom.createFactory('th'),
            thead: virtualdom.createFactory('thead'),
            time: virtualdom.createFactory('time'),
            title: virtualdom.createFactory('title'),
            tr: virtualdom.createFactory('tr'),
            track: virtualdom.createFactory('track'),
            u: virtualdom.createFactory('u'),
            ul: virtualdom.createFactory('ul'),
            var: virtualdom.createFactory('var'),
            video: virtualdom.createFactory('video'),
            wbr: virtualdom.createFactory('wbr'),
        };
    })(virtualdom = phosphor.virtualdom || (phosphor.virtualdom = {}));
})(phosphor || (phosphor = {})); // module phosphor.virtualdom

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var virtualdom;
    (function (virtualdom) {
        /**
         * An enum of supported elem types.
         */
        (function (ElemType) {
            /**
             * The elem represents a text node.
             */
            ElemType[ElemType["Text"] = 0] = "Text";
            /**
             * The elem represents an HTMLElement node.
             */
            ElemType[ElemType["Node"] = 1] = "Node";
            /**
             * The elem represents a component.
             */
            ElemType[ElemType["Component"] = 2] = "Component";
        })(virtualdom.ElemType || (virtualdom.ElemType = {}));
        var ElemType = virtualdom.ElemType;
        /**
         * A node in a virtual DOM hierarchy.
         *
         * User code will not typically instantiate an elem directly. Instead,
         * a factory function will be called to create the elem in a type-safe
         * fashion. Factory functions for all standard DOM nodes are provided
         * by the framework, and new factories may be created with the
         * `createFactory` function.
         *
         * An elem *must* be treated as immutable. Mutating the elem state will
         * result in undefined rendering behavior.
         */
        var Elem = (function () {
            /**
             * Construct a new virtual elem.
             */
            function Elem(type, tag, data, children) {
                this.type = type;
                this.tag = tag;
                this.data = data;
                this.children = children;
            }
            return Elem;
        })();
        virtualdom.Elem = Elem;
    })(virtualdom = phosphor.virtualdom || (phosphor.virtualdom = {}));
})(phosphor || (phosphor = {})); // module phosphor.virtualdom



/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var virtualdom;
    (function (virtualdom) {
        var algo = phosphor.collections.algorithm;
        var Message = phosphor.core.Message;
        var sendMessage = phosphor.core.sendMessage;
        var Pair = phosphor.utility.Pair;
        var emptyArray = phosphor.utility.emptyArray;
        var emptyObject = phosphor.utility.emptyObject;
        /**
         * Render virtual content into a host node.
         *
         * This renders the delta from the previous rendering. It assumes that
         * the contents of the host node are not manipulated by external code.
         * Modifying the host node will result in undefined rendering behavior.
         *
         * Returns an object which maps ref names to nodes and components.
         */
        function render(content, host) {
            var refs;
            stackLevel++;
            try {
                refs = renderImpl(content, host);
            }
            finally {
                stackLevel--;
            }
            if (stackLevel === 0) {
                notifyAttached();
            }
            return refs;
        }
        virtualdom.render = render;
        /**
         * The current stack level of recursive calls to `render`.
         */
        var stackLevel = 0;
        /**
         * Components which are pending attach notification.
         *
         * Components are pushed to this array when their node is added to the
         * DOM. When the root `render` call exits, each component in the array
         * will have its `afterAttach` method called.
         */
        var needsAttachNotification = [];
        /**
         * A weak mapping of host node to rendered content.
         */
        var hostMap = new WeakMap();
        /**
         * A weak mapping of component node to component.
         */
        var componentMap = new WeakMap();
        /**
         * A singleton 'update-request' message.
         */
        var MSG_UPDATE_REQUEST = new Message('update-request');
        /**
         * A singleton 'after-attach' message.
         */
        var MSG_AFTER_ATTACH = new Message('after-attach');
        /**
         * A singleton 'before-detach' message.
         */
        var MSG_BEFORE_DETACH = new Message('before-detach');
        /**
         * A singleton 'before-move' message.
         */
        var MSG_BEFORE_MOVE = new Message('before-move');
        /**
         * A singleton 'after-move' message.
         */
        var MSG_AFTER_MOVE = new Message('after-move');
        /**
         * The internal render entry point.
         *
         * This function is separated from the `render` function so that it can
         * be optimized by V8, which does not optimize functions which contain
         * a `try-finally` block.
         */
        function renderImpl(content, host) {
            var oldContent = hostMap.get(host) || emptyArray;
            var newContent = asElementArray(content);
            hostMap.set(host, newContent);
            updateContent(host, oldContent, newContent);
            return collectRefs(host, newContent);
        }
        /**
         * Coerce content into an elem array.
         *
         * Null content will be coerced to an empty array.
         */
        function asElementArray(content) {
            if (content instanceof Array) {
                return content;
            }
            if (content) {
                return [content];
            }
            return emptyArray;
        }
        /**
         * Notify the components pending an `afterAttach` notification.
         */
        function notifyAttached() {
            while (needsAttachNotification.length > 0) {
                var component = needsAttachNotification.pop();
                sendMessage(component, MSG_AFTER_ATTACH);
            }
        }
        /**
         * Walk the element tree and collect the refs into a new object.
         */
        function collectRefs(host, content) {
            var refs = Object.create(null);
            refsHelper(host, content, refs);
            return refs;
        }
        /**
         * A recursive implementation helper for `collectRefs`.
         */
        function refsHelper(host, content, refs) {
            var node = host.firstChild;
            for (var i = 0, n = content.length; i < n; ++i) {
                var elem = content[i];
                switch (elem.type) {
                    case virtualdom.ElemType.Node:
                        var ref = elem.data.ref;
                        if (ref)
                            refs[ref] = node;
                        refsHelper(node, elem.children, refs);
                        break;
                    case virtualdom.ElemType.Component:
                        var ref = elem.data.ref;
                        if (ref)
                            refs[ref] = componentMap.get(node);
                        break;
                }
                node = node.nextSibling;
            }
        }
        /**
         * Collect a mapping of keyed elements for the host content.
         */
        function collectKeys(host, content) {
            var node = host.firstChild;
            var keyed = Object.create(null);
            for (var i = 0, n = content.length; i < n; ++i) {
                var elem = content[i];
                var key = elem.data.key;
                if (key)
                    keyed[key] = new Pair(elem, node);
                node = node.nextSibling;
            }
            return keyed;
        }
        /**
         * Create and return a new DOM node for a give elem.
         */
        function createNode(elem) {
            var node;
            switch (elem.type) {
                case virtualdom.ElemType.Text:
                    node = document.createTextNode(elem.tag);
                    break;
                case virtualdom.ElemType.Node:
                    node = document.createElement(elem.tag);
                    addAttributes(node, elem.data);
                    addContent(node, elem.children);
                    break;
                case virtualdom.ElemType.Component:
                    var cls = elem.tag;
                    var component = new cls(elem.data, elem.children);
                    node = component.node;
                    componentMap.set(node, component);
                    needsAttachNotification.push(component);
                    sendMessage(component, MSG_UPDATE_REQUEST);
                    break;
                default:
                    throw new Error('invalid element type');
            }
            return node;
        }
        /**
         * Create and add child content to a newly created DOM node.
         */
        function addContent(node, content) {
            for (var i = 0, n = content.length; i < n; ++i) {
                node.appendChild(createNode(content[i]));
            }
        }
        /**
         * Update a host node with the delta of the elem content.
         *
         * This is the core "diff" algorithm. There is no explicit "patch"
         * phase. The host is patched at each step as the diff progresses.
         */
        function updateContent(host, oldContent, newContent) {
            // Bail early if the content is identical. This can occur when an
            // elem has no children or if a component renders cached content.
            if (oldContent === newContent) {
                return;
            }
            // Collect the old keyed elems into a mapping.
            var oldKeyed = collectKeys(host, oldContent);
            // Create a copy of the old content which can be modified in-place.
            var oldCopy = algo.copy(oldContent);
            // Update the host with the new content. The diff always proceeds
            // forward and never modifies a previously visited index. The old
            // copy array is modified in-place to reflect the changes made to
            // the host children. This causes the stale nodes to be pushed to
            // the end of the host node and removed at the end of the loop.
            var currNode = host.firstChild;
            var newCount = newContent.length;
            for (var i = 0; i < newCount; ++i) {
                // If the old elems are exhausted, create a new node.
                if (i >= oldCopy.length) {
                    host.appendChild(createNode(newContent[i]));
                    continue;
                }
                // Cache a reference to the old and new elems.
                var oldElem = oldCopy[i];
                var newElem = newContent[i];
                // If the new elem is keyed, move an old keyed elem to the proper
                // location before proceeding with the diff. The search can start
                // at the current index, since the unmatched old keyed elems are
                // pushed forward in the old copy array.
                var newKey = newElem.data.key;
                if (newKey && newKey in oldKeyed) {
                    var pair = oldKeyed[newKey];
                    if (pair.first !== oldElem) {
                        algo.move(oldCopy, algo.indexOf(oldCopy, pair.first, i), i);
                        sendBranch(pair.second, MSG_BEFORE_MOVE);
                        host.insertBefore(pair.second, currNode);
                        sendBranch(pair.second, MSG_AFTER_MOVE);
                        oldElem = pair.first;
                        currNode = pair.second;
                    }
                }
                // If both elements are identical, there is nothing to do.
                // This can occur when a component renders cached content.
                if (oldElem === newElem) {
                    currNode = currNode.nextSibling;
                    continue;
                }
                // If the old elem is keyed and does not match the new elem key,
                // create a new node. This is necessary since the old keyed elem
                // may be matched at a later point in the diff.
                var oldKey = oldElem.data.key;
                if (oldKey && oldKey !== newKey) {
                    algo.insert(oldCopy, i, newElem);
                    host.insertBefore(createNode(newElem), currNode);
                    continue;
                }
                // If the elements have different types, create a new node.
                if (oldElem.type !== newElem.type) {
                    algo.insert(oldCopy, i, newElem);
                    host.insertBefore(createNode(newElem), currNode);
                    continue;
                }
                // If the element is a text node, update its text content.
                if (newElem.type === virtualdom.ElemType.Text) {
                    currNode.textContent = newElem.tag;
                    currNode = currNode.nextSibling;
                    continue;
                }
                // At this point, the element is a Node or Component type.
                // If the element tags are different, create a new node.
                if (oldElem.tag !== newElem.tag) {
                    algo.insert(oldCopy, i, newElem);
                    host.insertBefore(createNode(newElem), currNode);
                    continue;
                }
                // If the element is a Node type, update the node in place.
                if (newElem.type === virtualdom.ElemType.Node) {
                    updateAttributes(currNode, oldElem.data, newElem.data);
                    updateContent(currNode, oldElem.children, newElem.children);
                    currNode = currNode.nextSibling;
                    continue;
                }
                // At this point, the node is a Component type; update it.
                var component = componentMap.get(currNode);
                component.init(newElem.data, newElem.children);
                sendMessage(component, MSG_UPDATE_REQUEST);
                currNode = currNode.nextSibling;
            }
            // Dispose of the old nodes pushed to the end of the host.
            for (var i = oldCopy.length - 1; i >= newCount; --i) {
                var oldNode = host.lastChild;
                sendBranch(oldNode, MSG_BEFORE_DETACH);
                host.removeChild(oldNode);
                disposeBranch(oldNode);
            }
        }
        /**
         * Send a message to each component in the branch.
         */
        function sendBranch(root, msg) {
            if (root.nodeType === 1) {
                var component = componentMap.get(root);
                if (component)
                    sendMessage(component, msg);
            }
            for (var node = root.firstChild; node; node = node.nextSibling) {
                sendBranch(node, msg);
            }
        }
        /**
         * Dispose of each component in the branch.
         */
        function disposeBranch(root) {
            if (root.nodeType === 1) {
                var component = componentMap.get(root);
                if (component)
                    component.dispose();
            }
            for (var node = root.firstChild; node; node = node.nextSibling) {
                disposeBranch(node);
            }
        }
        /**
         * Add attributes to a newly created DOM node.
         */
        function addAttributes(node, attrs) {
            for (var name in attrs) {
                var mode = attrModeTable[name];
                if (mode === 0 /* Property */ || mode === 2 /* Event */) {
                    node[name] = attrs[name];
                }
                else if (mode === 1 /* Attribute */) {
                    node.setAttribute(name.toLowerCase(), attrs[name]);
                }
            }
            var dataset = attrs.dataset;
            if (dataset) {
                for (var name in dataset) {
                    node.setAttribute('data-' + name, dataset[name]);
                }
            }
            var inlineStyles = attrs.style;
            if (inlineStyles) {
                var style = node.style;
                for (var name in inlineStyles) {
                    style[name] = inlineStyles[name];
                }
            }
        }
        /**
         * Update the node attributes with the delta of attribute objects.
         */
        function updateAttributes(node, oldAttrs, newAttrs) {
            if (oldAttrs === newAttrs) {
                return;
            }
            for (var name in oldAttrs) {
                if (!(name in newAttrs)) {
                    var mode = attrModeTable[name];
                    if (mode === 0 /* Property */) {
                        node.removeAttribute(name);
                    }
                    else if (mode === 1 /* Attribute */) {
                        node.removeAttribute(name.toLowerCase());
                    }
                    else if (mode === 2 /* Event */) {
                        node[name] = null;
                    }
                }
            }
            for (var name in newAttrs) {
                var value = newAttrs[name];
                if (oldAttrs[name] !== value) {
                    var mode = attrModeTable[name];
                    if (mode === 0 /* Property */ || mode === 2 /* Event */) {
                        node[name] = value;
                    }
                    else if (mode === 1 /* Attribute */) {
                        node.setAttribute(name.toLowerCase(), value);
                    }
                }
            }
            var oldDataset = oldAttrs.dataset || emptyObject;
            var newDataset = newAttrs.dataset || emptyObject;
            if (oldDataset !== newDataset) {
                for (var name in oldDataset) {
                    if (!(name in newDataset)) {
                        node.removeAttribute('data-' + name);
                    }
                }
                for (var name in newDataset) {
                    var value = newDataset[name];
                    if (oldDataset[name] !== value) {
                        node.setAttribute('data-' + name, value);
                    }
                }
            }
            var oldInlineStyles = oldAttrs.style || emptyObject;
            var newInlineStyles = newAttrs.style || emptyObject;
            if (oldInlineStyles !== newInlineStyles) {
                var style = node.style;
                for (var name in oldInlineStyles) {
                    if (!(name in newInlineStyles)) {
                        style[name] = '';
                    }
                }
                for (var name in newInlineStyles) {
                    var value = newInlineStyles[name];
                    if (oldInlineStyles[name] !== value) {
                        style[name] = value;
                    }
                }
            }
        }
        /**
         * A mapping of attribute name to required setattr mode.
         */
        var attrModeTable = {
            accept: 0 /* Property */,
            acceptCharset: 0 /* Property */,
            accessKey: 0 /* Property */,
            action: 0 /* Property */,
            allowFullscreen: 1 /* Attribute */,
            alt: 0 /* Property */,
            autocomplete: 0 /* Property */,
            autofocus: 0 /* Property */,
            autoplay: 0 /* Property */,
            checked: 0 /* Property */,
            cite: 0 /* Property */,
            className: 0 /* Property */,
            colSpan: 0 /* Property */,
            cols: 0 /* Property */,
            contentEditable: 0 /* Property */,
            controls: 0 /* Property */,
            coords: 0 /* Property */,
            crossOrigin: 0 /* Property */,
            data: 0 /* Property */,
            dateTime: 0 /* Property */,
            default: 0 /* Property */,
            dir: 0 /* Property */,
            dirName: 0 /* Property */,
            disabled: 0 /* Property */,
            download: 0 /* Property */,
            draggable: 0 /* Property */,
            enctype: 0 /* Property */,
            form: 1 /* Attribute */,
            formAction: 0 /* Property */,
            formEnctype: 0 /* Property */,
            formMethod: 0 /* Property */,
            formNoValidate: 0 /* Property */,
            formTarget: 0 /* Property */,
            headers: 0 /* Property */,
            height: 0 /* Property */,
            hidden: 0 /* Property */,
            high: 0 /* Property */,
            href: 0 /* Property */,
            hreflang: 0 /* Property */,
            htmlFor: 0 /* Property */,
            id: 0 /* Property */,
            inputMode: 0 /* Property */,
            isMap: 0 /* Property */,
            kind: 0 /* Property */,
            label: 0 /* Property */,
            lang: 0 /* Property */,
            list: 1 /* Attribute */,
            loop: 0 /* Property */,
            low: 0 /* Property */,
            max: 0 /* Property */,
            maxLength: 0 /* Property */,
            media: 1 /* Attribute */,
            mediaGroup: 0 /* Property */,
            method: 0 /* Property */,
            min: 0 /* Property */,
            minLength: 0 /* Property */,
            multiple: 0 /* Property */,
            muted: 0 /* Property */,
            name: 0 /* Property */,
            noValidate: 0 /* Property */,
            optimum: 0 /* Property */,
            pattern: 0 /* Property */,
            placeholder: 0 /* Property */,
            poster: 0 /* Property */,
            preload: 0 /* Property */,
            readOnly: 0 /* Property */,
            rel: 0 /* Property */,
            required: 0 /* Property */,
            reversed: 0 /* Property */,
            rowSpan: 0 /* Property */,
            rows: 0 /* Property */,
            sandbox: 0 /* Property */,
            scope: 0 /* Property */,
            seamless: 1 /* Attribute */,
            selected: 0 /* Property */,
            shape: 0 /* Property */,
            size: 0 /* Property */,
            sizes: 1 /* Attribute */,
            sorted: 0 /* Property */,
            span: 0 /* Property */,
            spellcheck: 0 /* Property */,
            src: 0 /* Property */,
            srcdoc: 0 /* Property */,
            srclang: 0 /* Property */,
            srcset: 1 /* Attribute */,
            start: 0 /* Property */,
            step: 0 /* Property */,
            tabIndex: 0 /* Property */,
            target: 0 /* Property */,
            title: 0 /* Property */,
            type: 0 /* Property */,
            typeMustMatch: 0 /* Property */,
            useMap: 0 /* Property */,
            value: 0 /* Property */,
            volume: 0 /* Property */,
            width: 0 /* Property */,
            wrap: 0 /* Property */,
            onabort: 2 /* Event */,
            onbeforecopy: 2 /* Event */,
            onbeforecut: 2 /* Event */,
            onbeforepaste: 2 /* Event */,
            onblur: 2 /* Event */,
            oncanplay: 2 /* Event */,
            oncanplaythrough: 2 /* Event */,
            onchange: 2 /* Event */,
            onclick: 2 /* Event */,
            oncontextmenu: 2 /* Event */,
            oncopy: 2 /* Event */,
            oncuechange: 2 /* Event */,
            oncut: 2 /* Event */,
            ondblclick: 2 /* Event */,
            ondrag: 2 /* Event */,
            ondragend: 2 /* Event */,
            ondragenter: 2 /* Event */,
            ondragleave: 2 /* Event */,
            ondragover: 2 /* Event */,
            ondragstart: 2 /* Event */,
            ondrop: 2 /* Event */,
            ondurationchange: 2 /* Event */,
            onended: 2 /* Event */,
            onemptied: 2 /* Event */,
            onerror: 2 /* Event */,
            onfocus: 2 /* Event */,
            onhelp: 2 /* Event */,
            oninput: 2 /* Event */,
            onkeydown: 2 /* Event */,
            onkeypress: 2 /* Event */,
            onkeyup: 2 /* Event */,
            onload: 2 /* Event */,
            onloadeddata: 2 /* Event */,
            onloadedmetadata: 2 /* Event */,
            onloadstart: 2 /* Event */,
            onmousedown: 2 /* Event */,
            onmouseenter: 2 /* Event */,
            onmouseleave: 2 /* Event */,
            onmousemove: 2 /* Event */,
            onmouseout: 2 /* Event */,
            onmouseover: 2 /* Event */,
            onmouseup: 2 /* Event */,
            onmousewheel: 2 /* Event */,
            onpaste: 2 /* Event */,
            onpause: 2 /* Event */,
            onplay: 2 /* Event */,
            onplaying: 2 /* Event */,
            onprogress: 2 /* Event */,
            onratechange: 2 /* Event */,
            onreadystatechange: 2 /* Event */,
            onreset: 2 /* Event */,
            onscroll: 2 /* Event */,
            onseeked: 2 /* Event */,
            onseeking: 2 /* Event */,
            onselect: 2 /* Event */,
            onselectstart: 2 /* Event */,
            onstalled: 2 /* Event */,
            onsubmit: 2 /* Event */,
            onsuspend: 2 /* Event */,
            ontimeupdate: 2 /* Event */,
            onvolumechange: 2 /* Event */,
            onwaiting: 2 /* Event */,
        };
    })(virtualdom = phosphor.virtualdom || (phosphor.virtualdom = {}));
})(phosphor || (phosphor = {})); // module phosphor.virtualdom

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * An enum of alignment bit flags.
         */
        (function (Alignment) {
            /**
             * Align with the left edge.
             */
            Alignment[Alignment["Left"] = 1] = "Left";
            /**
             * Align with the right edge.
             */
            Alignment[Alignment["Right"] = 2] = "Right";
            /**
             * Align with the horizontal center.
             */
            Alignment[Alignment["HorizontalCenter"] = 4] = "HorizontalCenter";
            /**
             * Align with the top edge.
             */
            Alignment[Alignment["Top"] = 16] = "Top";
            /**
             * Align with the bottom edge.
             */
            Alignment[Alignment["Bottom"] = 32] = "Bottom";
            /**
             * Align with the vertical center.
             */
            Alignment[Alignment["VerticalCenter"] = 64] = "VerticalCenter";
            /**
             * Align with the horizontal and vertical center.
             */
            Alignment[Alignment["Center"] = 68] = "Center";
            /**
             * A mask of horizontal alignment values.
             */
            Alignment[Alignment["Horizontal_Mask"] = 7] = "Horizontal_Mask";
            /**
             * A mask of vertical alignment values.
             */
            Alignment[Alignment["Vertical_Mask"] = 112] = "Vertical_Mask";
        })(widgets.Alignment || (widgets.Alignment = {}));
        var Alignment = widgets.Alignment;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var Message = phosphor.core.Message;
        /**
         * A class for messages related to child widgets.
         */
        var ChildMessage = (function (_super) {
            __extends(ChildMessage, _super);
            /**
             * Construct a new child message.
             */
            function ChildMessage(type, child) {
                _super.call(this, type);
                this._child = child;
            }
            Object.defineProperty(ChildMessage.prototype, "child", {
                /**
                 * The child widget for the message.
                 */
                get: function () {
                    return this._child;
                },
                enumerable: true,
                configurable: true
            });
            return ChildMessage;
        })(Message);
        widgets.ChildMessage = ChildMessage;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * An enum of layout directions.
         */
        (function (Direction) {
            /**
             * Left to right direction.
             */
            Direction[Direction["LeftToRight"] = 0] = "LeftToRight";
            /**
             * Right to left direction.
             */
            Direction[Direction["RightToLeft"] = 1] = "RightToLeft";
            /**
             * Top to bottom direction.
             */
            Direction[Direction["TopToBottom"] = 2] = "TopToBottom";
            /**
             * Bottom to top direction.
             */
            Direction[Direction["BottomToTop"] = 3] = "BottomToTop";
        })(widgets.Direction || (widgets.Direction = {}));
        var Direction = widgets.Direction;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * An enum of docking modes for a dock area.
         */
        (function (DockMode) {
            /**
             * Insert the widget at the top of the dock area.
             */
            DockMode[DockMode["Top"] = 0] = "Top";
            /**
             * Insert the widget at the left of the dock area.
             */
            DockMode[DockMode["Left"] = 1] = "Left";
            /**
             * Insert the widget at the right of the dock area.
             */
            DockMode[DockMode["Right"] = 2] = "Right";
            /**
             * Insert the widget at the bottom of the dock area.
             */
            DockMode[DockMode["Bottom"] = 3] = "Bottom";
            /**
             * Insert the widget as a new split item above the reference.
             */
            DockMode[DockMode["SplitTop"] = 4] = "SplitTop";
            /**
             * Insert the widget as a new split item to the left of the reference.
             */
            DockMode[DockMode["SplitLeft"] = 5] = "SplitLeft";
            /**
             * Insert the widget as a new split item to the right of the reference.
             */
            DockMode[DockMode["SplitRight"] = 6] = "SplitRight";
            /**
             * Insert the widget as a new split item below the reference.
             */
            DockMode[DockMode["SplitBottom"] = 7] = "SplitBottom";
            /**
             * Insert the widget as a new tab before the reference.
             */
            DockMode[DockMode["TabBefore"] = 8] = "TabBefore";
            /**
             * Insert the widget as a new tab after the reference.
             */
            DockMode[DockMode["TabAfter"] = 9] = "TabAfter";
        })(widgets.DockMode || (widgets.DockMode = {}));
        var DockMode = widgets.DockMode;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets



var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var Message = phosphor.core.Message;
        /**
         * A message class for 'move' messages.
         */
        var MoveMessage = (function (_super) {
            __extends(MoveMessage, _super);
            /**
             * Construct a new move message.
             */
            function MoveMessage(oldX, oldY, x, y) {
                _super.call(this, 'move');
                this._oldX = oldX;
                this._oldY = oldY;
                this._x = x;
                this._y = y;
            }
            Object.defineProperty(MoveMessage.prototype, "oldX", {
                /**
                 * The previous X coordinate of the widget.
                 */
                get: function () {
                    return this._oldX;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MoveMessage.prototype, "oldY", {
                /**
                 * The previous Y coordinate of the widget.
                 */
                get: function () {
                    return this._oldY;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MoveMessage.prototype, "x", {
                /**
                 * The current X coordinate of the widget.
                 */
                get: function () {
                    return this._x;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MoveMessage.prototype, "y", {
                /**
                 * The current Y coordinate of the widget.
                 */
                get: function () {
                    return this._y;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MoveMessage.prototype, "deltaX", {
                /**
                 * The change in X coordinate of the widget.
                 */
                get: function () {
                    return this._x - this._oldX;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MoveMessage.prototype, "deltaY", {
                /**
                 * The change in Y coordinate of the widget.
                 */
                get: function () {
                    return this._y - this._oldY;
                },
                enumerable: true,
                configurable: true
            });
            return MoveMessage;
        })(Message);
        widgets.MoveMessage = MoveMessage;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * An enum of layout orientations.
         */
        (function (Orientation) {
            /**
             * Horizontal orientation.
             */
            Orientation[Orientation["Horizontal"] = 0] = "Horizontal";
            /**
             * Vertical orientation.
             */
            Orientation[Orientation["Vertical"] = 1] = "Vertical";
        })(widgets.Orientation || (widgets.Orientation = {}));
        var Orientation = widgets.Orientation;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var Message = phosphor.core.Message;
        /**
         * A message class for 'resize' messages.
         */
        var ResizeMessage = (function (_super) {
            __extends(ResizeMessage, _super);
            /**
             * Construct a new resize message.
             */
            function ResizeMessage(oldWidth, oldHeight, width, height) {
                _super.call(this, 'resize');
                this._oldWidth = oldWidth;
                this._oldHeight = oldHeight;
                this._width = width;
                this._height = height;
            }
            Object.defineProperty(ResizeMessage.prototype, "oldWidth", {
                /**
                 * The previous width of the widget.
                 */
                get: function () {
                    return this._oldWidth;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ResizeMessage.prototype, "oldHeight", {
                /**
                 * The previous height of the widget.
                 */
                get: function () {
                    return this._oldHeight;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ResizeMessage.prototype, "width", {
                /**
                 * The current width of the widget.
                 */
                get: function () {
                    return this._width;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ResizeMessage.prototype, "height", {
                /**
                 * The current height of the widget.
                 */
                get: function () {
                    return this._height;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ResizeMessage.prototype, "deltaWidth", {
                /**
                 * The change in width of the widget.
                 */
                get: function () {
                    return this._width - this._oldWidth;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ResizeMessage.prototype, "deltaHeight", {
                /**
                 * The change in height of the widget.
                 */
                get: function () {
                    return this._height - this._oldHeight;
                },
                enumerable: true,
                configurable: true
            });
            return ResizeMessage;
        })(Message);
        widgets.ResizeMessage = ResizeMessage;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * An enum of size policy values.
         *
         * A size policy controls how layouts interpret a widget's `sizeHint`.
         */
        (function (SizePolicy) {
            /**
             * A policy indicating that the `sizeHint` is the only acceptable
             * size for the widget.
             */
            SizePolicy[SizePolicy["Fixed"] = 0] = "Fixed";
            /**
             * A bit flag indicating the widget can grow beyond `sizeHint`.
             */
            SizePolicy[SizePolicy["GrowFlag"] = 1] = "GrowFlag";
            /**
             * A bit flag indicating the widget can shrink below `sizeHint`.
             */
            SizePolicy[SizePolicy["ShrinkFlag"] = 2] = "ShrinkFlag";
            /**
             * A bit flag indicating the widget should expand beyond `sizeHint`.
             */
            SizePolicy[SizePolicy["ExpandFlag"] = 4] = "ExpandFlag";
            /**
             * A bit flag indicating the `sizeHint` is ignored.
             */
            SizePolicy[SizePolicy["IgnoreFlag"] = 8] = "IgnoreFlag";
            /**
             * A policy indicating that the `sizeHint` is a minimum, but the
             * widget can be expanded if needed and still be useful.
             */
            SizePolicy[SizePolicy["Minimum"] = 1] = "Minimum";
            /**
             * A policy indicating that the `sizeHint` is a maximum, but the
             * widget can be shrunk if needed and still be useful.
             */
            SizePolicy[SizePolicy["Maximum"] = 2] = "Maximum";
            /**
             * A policy indicating that the `sizeHint` is preferred, but the
             * widget can grow or shrink if needed and still be useful.
             *
             * This is the default size policy.
             */
            SizePolicy[SizePolicy["Preferred"] = 3] = "Preferred";
            /**
             * A policy indicating that `sizeHint` is reasonable, but the widget
             * can shrink if needed and still be useful. It can also make use of
             * extra space and should expand as much as possible.
             */
            SizePolicy[SizePolicy["Expanding"] = 7] = "Expanding";
            /**
             * A policy indicating that `sizeHint` is a minimum. The widget can
             * make use of extra space and should expand as much as possible.
             */
            SizePolicy[SizePolicy["MinimumExpanding"] = 5] = "MinimumExpanding";
            /**
             * A policy indicating the `sizeHint` is ignored.
             */
            SizePolicy[SizePolicy["Ignored"] = 11] = "Ignored";
        })(widgets.SizePolicy || (widgets.SizePolicy = {}));
        var SizePolicy = widgets.SizePolicy;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * An enum of widget bit flags.
         *
         * Widget flags are used to control various low-level behaviors of
         * a widget. They are typically not used directly by user code.
         */
        (function (WidgetFlag) {
            /**
             * The widget is attached to the DOM.
             */
            WidgetFlag[WidgetFlag["IsAttached"] = 1] = "IsAttached";
            /**
             * The widget is explicitly hidden.
             */
            WidgetFlag[WidgetFlag["IsHidden"] = 2] = "IsHidden";
            /**
             * The widget is visible.
             */
            WidgetFlag[WidgetFlag["IsVisible"] = 4] = "IsVisible";
            /**
             * The widget has been disposed.
             */
            WidgetFlag[WidgetFlag["IsDisposed"] = 8] = "IsDisposed";
            /**
             * Changing the widget layout is disallowed.
             */
            WidgetFlag[WidgetFlag["DisallowLayoutChange"] = 16] = "DisallowLayoutChange";
        })(widgets.WidgetFlag || (widgets.WidgetFlag = {}));
        var WidgetFlag = widgets.WidgetFlag;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var Message = phosphor.core.Message;
        var clearSignalData = phosphor.core.clearSignalData;
        var postMessage = phosphor.core.postMessage;
        /**
         * A singleton 'layout-request' message.
         */
        var MSG_LAYOUT_REQUEST = new Message('layout-request');
        /**
         * The base class of phosphor layouts.
         *
         * The Layout class does not define an interface for adding widgets to
         * the layout. A subclass should define that API in a manner suitable
         * for its intended use.
         */
        var Layout = (function () {
            /**
             * Construct a new layout.
             */
            function Layout() {
                this._parent = null;
            }
            /**
             * Dispose of the resources held by the layout.
             */
            Layout.prototype.dispose = function () {
                clearSignalData(this);
                this._parent = null;
            };
            Object.defineProperty(Layout.prototype, "parent", {
                /**
                 * Get the parent widget of the layout.
                 */
                get: function () {
                    return this._parent;
                },
                /**
                 * Set the parent widget of the layout.
                 *
                 * The parent widget can only be set once, and is done automatically
                 * when the layout is installed on a widget. This should not be set
                 * directly by user code.
                 */
                set: function (parent) {
                    if (!parent) {
                        throw new Error('cannot set parent widget to null');
                    }
                    if (parent === this._parent) {
                        return;
                    }
                    if (this._parent) {
                        throw new Error('layout already installed on a widget');
                    }
                    this._parent = parent;
                    this.reparentChildWidgets();
                    this.invalidate();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Layout.prototype, "count", {
                /**
                 * Get the number of layout items in the layout.
                 *
                 * This must be implemented by a subclass.
                 */
                get: function () {
                    throw new Error('not implemented');
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the layout item at the given index.
             *
             * This must be implemented by a subclass.
             */
            Layout.prototype.itemAt = function (index) {
                throw new Error('not implemented');
            };
            /**
             * Remove and return the layout item at the given index.
             *
             * This must be implemented by a subclass.
             */
            Layout.prototype.removeAt = function (index) {
                throw new Error('not implemented');
            };
            /**
             * Compute the size hint for the layout.
             *
             * This must be implemented by a subclass.
             */
            Layout.prototype.sizeHint = function () {
                throw new Error('not implemented');
            };
            /**
             * Compute the minimum required size for the layout.
             *
             * This must be implemented by a subclass.
             */
            Layout.prototype.minSize = function () {
                throw new Error('not implemented');
            };
            /**
             * Compute the maximum allowed size for the layout.
             *
             * This must be implemented by a subclass.
             */
            Layout.prototype.maxSize = function () {
                throw new Error('not implemented');
            };
            /**
             * Get the widget at the given index.
             *
             * Returns `undefined` if there is no widget at the given index.
             */
            Layout.prototype.widgetAt = function (index) {
                var item = this.itemAt(index);
                return (item && item.widget) || void 0;
            };
            /**
             * Get the index of the given widget or layout item.
             *
             * Returns -1 if the widget or item does not exist in the layout.
             */
            Layout.prototype.indexOf = function (value) {
                for (var i = 0, n = this.count; i < n; ++i) {
                    var item = this.itemAt(i);
                    if (item === value || item.widget === value) {
                        return i;
                    }
                }
                return -1;
            };
            /**
             * Remove an item from the layout and return its index.
             *
             * Returns -1 if the item is not in the layout.
             */
            Layout.prototype.remove = function (value) {
                var i = this.indexOf(value);
                if (i !== -1)
                    this.removeAt(i);
                return i;
            };
            /**
             * Get the alignment for the given widget.
             *
             * Returns 0 if the widget is not found in the layout.
             */
            Layout.prototype.alignment = function (widget) {
                var index = this.indexOf(widget);
                return index === -1 ? 0 : this.itemAt(index).alignment;
            };
            /**
             * Set the alignment for the given widget.
             *
             * Returns true if the alignment was updated, false otherwise.
             */
            Layout.prototype.setAlignment = function (widget, alignment) {
                var index = this.indexOf(widget);
                if (index === -1) {
                    return false;
                }
                var item = this.itemAt(index);
                if (item.alignment !== alignment) {
                    item.alignment = alignment;
                    this.invalidate();
                }
                return true;
            };
            /**
             * Invalidate the cached layout data and enqueue an update.
             *
             * This should be reimplemented by a subclass as needed.
             */
            Layout.prototype.invalidate = function () {
                var parent = this._parent;
                if (parent) {
                    postMessage(parent, MSG_LAYOUT_REQUEST);
                    parent.updateGeometry();
                }
            };
            /**
             * Refresh the layout for the parent widget immediately.
             *
             * This is typically called automatically at the appropriate times.
             */
            Layout.prototype.refresh = function () {
                var parent = this._parent;
                if (parent && parent.isVisible) {
                    var box = parent.boxSizing;
                    var x = box.paddingLeft;
                    var y = box.paddingTop;
                    var w = parent.width - box.horizontalSum;
                    var h = parent.height - box.verticalSum;
                    this.layout(x, y, w, h);
                }
            };
            /**
             * Filter a message sent to a message handler.
             *
             * This implements the `IMessageFilter` interface.
             */
            Layout.prototype.filterMessage = function (handler, msg) {
                if (handler === this._parent) {
                    this.processParentMessage(msg);
                }
                return false;
            };
            /**
             * Process a message dispatched to the parent widget.
             *
             * Subclasses may reimplement this method as needed.
             */
            Layout.prototype.processParentMessage = function (msg) {
                switch (msg.type) {
                    case 'resize':
                    case 'layout-request':
                        this.refresh();
                        break;
                    case 'child-removed':
                        this.remove(msg.child);
                        break;
                    case 'before-attach':
                        this.invalidate();
                        break;
                }
            };
            /**
             * A method invoked when widget layout should be updated.
             *
             * The arguments are the content boundaries for the layout which are
             * already adjusted to account for the parent widget box sizing data.
             *
             * The default implementation of this method is a no-op.
             */
            Layout.prototype.layout = function (x, y, width, height) { };
            /**
             * Ensure a child widget is parented to the layout's parent.
             *
             * This should be called by a subclass when adding a widget.
             */
            Layout.prototype.ensureParent = function (widget) {
                var parent = this._parent;
                if (parent)
                    widget.parent = parent;
            };
            /**
             * Reparent the child widgets to the layout's parent.
             *
             * This is typically called automatically at the proper times.
             */
            Layout.prototype.reparentChildWidgets = function () {
                var parent = this._parent;
                if (parent) {
                    for (var i = 0, n = this.count; i < n; ++i) {
                        var widget = this.itemAt(i).widget;
                        if (widget)
                            widget.parent = parent;
                    }
                }
            };
            return Layout;
        })();
        widgets.Layout = Layout;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * A sizer object for the `layoutCalc` function.
         *
         * Instances of this class are used internally by the panel layouts
         * to implement their layout logic. User code will not typically use
         * this class directly.
         */
        var LayoutSizer = (function () {
            function LayoutSizer() {
                /**
                 * The size hint for the sizer.
                 *
                 * The sizer will be given this initial size subject to its bounds.
                 */
                this.sizeHint = 0;
                /**
                 * The minimum size of the sizer.
                 *
                 * The sizer will never be sized less than this value.
                 *
                 * Limits: [0, Infinity) && <= maxSize
                 */
                this.minSize = 0;
                /**
                 * The maximum size of the sizer.
                 *
                 * The sizer will never be sized greater than this value.
                 *
                 * Limits: [0, Infinity] && >= minSize
                 */
                this.maxSize = Infinity;
                /**
                 * The stretch factor for the sizer.
                 *
                 * This controls how much the sizer stretches relative to the other
                 * sizers when layout space is distributed. A sizer with a stretch
                 * factor of zero will only be resized after all stretch sizers
                 * and expansive sizers have been sized to their limits.
                 *
                 * Limits: [0, Infinity)
                 */
                this.stretch = 1;
                /**
                 * Whether the sizer should consume extra space if available.
                 *
                 * Expansive sizers will absorb any remaining space after all
                 * stretch sizers have been resized to their limits.
                 */
                this.expansive = false;
                /**
                 * The computed size of the sizer.
                 *
                 * This value is the output of the algorithm.
                 */
                this.size = 0;
                /**
                 * An internal storage property for the layout algorithm.
                 */
                this.done = false;
            }
            return LayoutSizer;
        })();
        widgets.LayoutSizer = LayoutSizer;
        /**
         * Distribute space among the given sizers.
         *
         * This distributes the given layout spacing among the sizers
         * according to the following algorithm:
         *
         *   1) Initialize the sizers's size to its size hint and compute
         *      the sums for each of size hint, min size, and max size.
         *
         *   2) If the total size hint equals the layout space, return.
         *
         *   3) If the layout space is less than the total min size,
         *      set all sizers to their min size and return.
         *
         *   4) If the layout space is greater than the total max size,
         *      set all sizers to their max size and return.
         *
         *   5) If the layout space is less than the total size hint,
         *      distribute the negative delta as follows:
         *
         *     a) Shrink each sizer with a stretch factor greater than
         *        zero by an amount proportional to the sum of stretch
         *        factors and negative space. If the sizer reaches its
         *        minimum size, remove it and its stretch factor from
         *        the computation.
         *
         *     b) If after adjusting all stretch sizers there remains
         *        negative space, distribute it equally among sizers
         *        with a stretch factor of zero. If a sizer reaches
         *        its minimum size, remove it from the computation.
         *
         *   6) If the layout space is greater than the total size hint,
         *      distribute the positive delta as follows:
         *
         *     a) Expand each sizer with a stretch factor greater than
         *        zero by an amount proportional to the sum of stretch
         *        factors and positive space. If the sizer reaches its
         *        maximum size, remove it and its stretch factor from
         *        the computation.
         *
         *     b) If after adjusting all stretch sizers there remains
         *        positive space, distribute it equally among sizers
         *        with the `expansive` flag set. If a sizer reaches
         *        its maximum size, remove it from the computation.
         *
         *     c) If after adjusting all stretch and expansive sizers
         *        there remains positive space, distribute it equally
         *        among sizers with a stretch factor of zero. If a sizer
         *        reaches its maximum size, remove it from the computation.
         */
        function layoutCalc(sizers, space) {
            var count = sizers.length;
            if (count === 0) {
                return;
            }
            // Setup the counters.
            var totalMin = 0;
            var totalMax = 0;
            var totalSize = 0;
            var totalStretch = 0;
            var stretchCount = 0;
            var expansiveCount = 0;
            // Setup the sizers and calculate the totals.
            for (var i = 0; i < count; ++i) {
                var sizer = sizers[i];
                var minSize = sizer.minSize;
                var maxSize = sizer.maxSize;
                var size = Math.max(minSize, Math.min(sizer.sizeHint, maxSize));
                sizer.done = false;
                sizer.size = size;
                totalSize += size;
                totalMin += minSize;
                totalMax += maxSize;
                if (sizer.stretch > 0) {
                    totalStretch += sizer.stretch;
                    stretchCount++;
                }
                if (sizer.expansive) {
                    expansiveCount++;
                }
            }
            // 1) If the space is equal to the total size, return.
            if (space === totalSize) {
                return;
            }
            // 2) If the space is less than the total min, minimize each sizer.
            if (space <= totalMin) {
                for (var i = 0; i < count; ++i) {
                    var sizer = sizers[i];
                    sizer.size = sizer.minSize;
                }
                return;
            }
            // 3) If the space is greater than the total max, maximize each sizer.
            if (space >= totalMax) {
                for (var i = 0; i < count; ++i) {
                    var sizer = sizers[i];
                    sizer.size = sizer.maxSize;
                }
                return;
            }
            // The loops below perform sub-pixel precision sizing. A near zero
            // value is used for compares instead of zero to ensure that the
            // loop terminates when the subdivided space is reasonably small.
            var nearZero = 0.01;
            // A counter which decreaes monotonically each time a sizer is
            // resized to its limit. This ensure the loops terminate even
            // if there is space remaining to distribute.
            var notDoneCount = count;
            // 5) Distribute negative delta space.
            if (space < totalSize) {
                // 5a) Shrink each stretch sizer by an amount proportional to its
                // stretch factor. If it reaches its limit it's marked as done.
                // The loop progresses in phases where each sizer gets a chance to
                // consume its fair share for the phase, regardless of whether a
                // sizer before it reached its limit. This continues until the
                // stretch sizers or the free space is exhausted.
                var freeSpace = totalSize - space;
                while (stretchCount > 0 && freeSpace > nearZero) {
                    var distSpace = freeSpace;
                    var distStretch = totalStretch;
                    for (var i = 0; i < count; ++i) {
                        var sizer = sizers[i];
                        if (sizer.done || sizer.stretch === 0) {
                            continue;
                        }
                        var amt = sizer.stretch * distSpace / distStretch;
                        if (sizer.size - amt <= sizer.minSize) {
                            freeSpace -= sizer.size - sizer.minSize;
                            totalStretch -= sizer.stretch;
                            sizer.size = sizer.minSize;
                            sizer.done = true;
                            notDoneCount--;
                            stretchCount--;
                        }
                        else {
                            freeSpace -= amt;
                            sizer.size -= amt;
                        }
                    }
                }
                // 5b) Distribute any remaining space evenly among the sizers
                // with zero stretch factors. This progresses in phases in the
                // same manner as step (5a).
                while (notDoneCount > 0 && freeSpace > nearZero) {
                    var amt = freeSpace / notDoneCount;
                    for (var i = 0; i < count; ++i) {
                        var sizer = sizers[i];
                        if (sizer.done) {
                            continue;
                        }
                        if (sizer.size - amt <= sizer.minSize) {
                            freeSpace -= sizer.size - sizer.minSize;
                            sizer.size = sizer.minSize;
                            sizer.done = true;
                            notDoneCount--;
                        }
                        else {
                            freeSpace -= amt;
                            sizer.size -= amt;
                        }
                    }
                }
            }
            else {
                // 6a) Expand each stretch sizer by an amount proportional to its
                // stretch factor. If it reaches its limit it's marked as done.
                // The loop progresses in phases where each sizer gets a chance to
                // consume its fair share for the phase, regardless of whether an
                // sizer before it reached its limit. This continues until the
                // stretch sizers or the free space is exhausted.
                var freeSpace = space - totalSize;
                while (stretchCount > 0 && freeSpace > nearZero) {
                    var distSpace = freeSpace;
                    var distStretch = totalStretch;
                    for (var i = 0; i < count; ++i) {
                        var sizer = sizers[i];
                        if (sizer.done || sizer.stretch === 0) {
                            continue;
                        }
                        var amt = sizer.stretch * distSpace / distStretch;
                        if (sizer.size + amt >= sizer.maxSize) {
                            freeSpace -= sizer.maxSize - sizer.size;
                            totalStretch -= sizer.stretch;
                            sizer.size = sizer.maxSize;
                            sizer.done = true;
                            notDoneCount--;
                            stretchCount--;
                            if (sizer.expansive) {
                                expansiveCount--;
                            }
                        }
                        else {
                            freeSpace -= amt;
                            sizer.size += amt;
                        }
                    }
                }
                // 6b) Distribute remaining space equally among expansive sizers.
                // This progresses in phases in the same manner as step (6a).
                while (expansiveCount > 0 && freeSpace > nearZero) {
                    var amt = freeSpace / expansiveCount;
                    for (var i = 0; i < count; ++i) {
                        var sizer = sizers[i];
                        if (sizer.done || !sizer.expansive) {
                            continue;
                        }
                        if (sizer.size + amt >= sizer.maxSize) {
                            freeSpace -= sizer.maxSize - sizer.size;
                            sizer.size = sizer.maxSize;
                            sizer.done = true;
                            expansiveCount--;
                            notDoneCount--;
                        }
                        else {
                            freeSpace -= amt;
                            sizer.size += amt;
                        }
                    }
                }
                // 6c) Distribute any remaining space evenly among the sizers
                // with zero stretch factors. This progresses in phases in the
                // same manner as step (6a).
                while (notDoneCount > 0 && freeSpace > nearZero) {
                    var amt = freeSpace / notDoneCount;
                    for (var i = 0; i < count; ++i) {
                        var sizer = sizers[i];
                        if (sizer.done) {
                            continue;
                        }
                        if (sizer.size + amt >= sizer.maxSize) {
                            freeSpace -= sizer.maxSize - sizer.size;
                            sizer.size = sizer.maxSize;
                            sizer.done = true;
                            notDoneCount--;
                        }
                        else {
                            freeSpace -= amt;
                            sizer.size += amt;
                        }
                    }
                }
            }
        }
        widgets.layoutCalc = layoutCalc;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var Size = phosphor.utility.Size;
        /**
         * A layout item which manages empty space.
         *
         * User code will not typically use this class directly.
         */
        var SpacerItem = (function () {
            /**
             * Construct a new spacer item.
             */
            function SpacerItem(width, height, hPolicy, vPolicy) {
                this.setSizing(width, height, hPolicy, vPolicy);
            }
            Object.defineProperty(SpacerItem.prototype, "isWidget", {
                /**
                 * Test whether the item manages a widget.
                 */
                get: function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpacerItem.prototype, "isSpacer", {
                /**
                 * Test whether the item manages empty space.
                 */
                get: function () {
                    return true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpacerItem.prototype, "isHidden", {
                /**
                 * Test whether the item should be treated as hidden.
                 */
                get: function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpacerItem.prototype, "widget", {
                /**
                 * The widget the item manages, if any.
                 */
                get: function () {
                    return null;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpacerItem.prototype, "alignment", {
                /**
                 * Get the alignment for the item in its layout cell.
                 */
                get: function () {
                    return 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpacerItem.prototype, "expandHorizontal", {
                /**
                 * Test whether the item should be expanded horizontally.
                 */
                get: function () {
                    var hPolicy = this._sizePolicy >> 16;
                    return (hPolicy & widgets.SizePolicy.ExpandFlag) !== 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SpacerItem.prototype, "expandVertical", {
                /**
                 * Test Whether the item should be expanded vertically.
                 */
                get: function () {
                    var vPolicy = this._sizePolicy & 0xFFFF;
                    return (vPolicy & widgets.SizePolicy.ExpandFlag) !== 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Change the sizing of the spacer item.
             *
             * The owner layout must be invalidated to reflect the change.
             */
            SpacerItem.prototype.setSizing = function (width, height, hPolicy, vPolicy) {
                var w = Math.max(0, width);
                var h = Math.max(0, height);
                this._size = new Size(w, h);
                this._sizePolicy = (hPolicy << 16) | vPolicy;
            };
            /**
             * Transpose the effective orientation of the spacer item.
             */
            SpacerItem.prototype.transpose = function () {
                var size = this._size;
                var hPolicy = this._sizePolicy >> 16;
                var vPolicy = this._sizePolicy & 0xFFFF;
                this._size = new Size(size.height, size.width);
                this._sizePolicy = (vPolicy << 16) | hPolicy;
            };
            /**
             * Invalidate the cached data for the item.
             */
            SpacerItem.prototype.invalidate = function () { };
            /**
             * Compute the preferred size of the item.
             */
            SpacerItem.prototype.sizeHint = function () {
                return this._size;
            };
            /**
             * Compute the minimum size of the item.
             */
            SpacerItem.prototype.minSize = function () {
                var size = this._size;
                var hPolicy = this._sizePolicy >> 16;
                var vPolicy = this._sizePolicy & 0xFFFF;
                var w = hPolicy & widgets.SizePolicy.ShrinkFlag ? 0 : size.width;
                var h = vPolicy & widgets.SizePolicy.ShrinkFlag ? 0 : size.height;
                return new Size(w, h);
            };
            /**
             * Compute the maximum size of the item.
             */
            SpacerItem.prototype.maxSize = function () {
                var size = this._size;
                var hPolicy = this._sizePolicy >> 16;
                var vPolicy = this._sizePolicy & 0xFFFF;
                var w = hPolicy & widgets.SizePolicy.GrowFlag ? Infinity : size.width;
                var h = vPolicy & widgets.SizePolicy.GrowFlag ? Infinity : size.height;
                return new Size(w, h);
            };
            /**
             * Set the geometry of the item using the given values.
             */
            SpacerItem.prototype.setGeometry = function (x, y, width, height) { };
            return SpacerItem;
        })();
        widgets.SpacerItem = SpacerItem;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var Size = phosphor.utility.Size;
        /**
         * A layout item which manages a widget.
         *
         * User code will not typically use this class directly.
         */
        var WidgetItem = (function () {
            /**
             * Construct a new widget item.
             */
            function WidgetItem(widget, alignment) {
                if (alignment === void 0) { alignment = 0; }
                this._origHint = null;
                this._sizeHint = null;
                this._minSize = null;
                this._maxSize = null;
                this._widget = widget;
                this._alignment = alignment;
            }
            Object.defineProperty(WidgetItem.prototype, "isWidget", {
                /**
                 * Test whether the item manages a widget.
                 */
                get: function () {
                    return true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(WidgetItem.prototype, "isSpacer", {
                /**
                 * Test whether the item manages empty space.
                 */
                get: function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(WidgetItem.prototype, "isHidden", {
                /**
                 * Test whether the item should be treated as hidden.
                 */
                get: function () {
                    return this._widget.isHidden;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(WidgetItem.prototype, "widget", {
                /**
                 * The widget the item manages, if any.
                 */
                get: function () {
                    return this._widget;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(WidgetItem.prototype, "alignment", {
                /**
                 * Get the alignment for the item in its layout cell.
                 */
                get: function () {
                    return this._alignment;
                },
                /**
                 * Set the alignment for the item in its layout cell.
                 *
                 * The owner layout must be invalidated to reflect the change.
                 */
                set: function (alignment) {
                    this._alignment = alignment;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(WidgetItem.prototype, "expandHorizontal", {
                /**
                 * Test whether the item should be expanded horizontally.
                 */
                get: function () {
                    if (this._alignment & widgets.Alignment.Horizontal_Mask) {
                        return false;
                    }
                    var horizontalPolicy = this._widget.horizontalSizePolicy;
                    return (horizontalPolicy & widgets.SizePolicy.ExpandFlag) !== 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(WidgetItem.prototype, "expandVertical", {
                /**
                 * Test Whether the item should be expanded vertically.
                 */
                get: function () {
                    if (this._alignment & widgets.Alignment.Vertical_Mask) {
                        return false;
                    }
                    var verticalPolicy = this._widget.verticalSizePolicy;
                    return (verticalPolicy & widgets.SizePolicy.ExpandFlag) !== 0;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Invalidate the cached data for the item.
             */
            WidgetItem.prototype.invalidate = function () {
                this._origHint = null;
                this._sizeHint = null;
                this._minSize = null;
                this._maxSize = null;
            };
            /**
             * Compute the preferred size of the item.
             */
            WidgetItem.prototype.sizeHint = function () {
                if (!this._sizeHint) {
                    this._updateSizes();
                }
                return this._sizeHint;
            };
            /**
             * Compute the minimum size of the item.
             */
            WidgetItem.prototype.minSize = function () {
                if (!this._minSize) {
                    this._updateSizes();
                }
                return this._minSize;
            };
            /**
             * Compute the maximum size of the item.
             */
            WidgetItem.prototype.maxSize = function () {
                if (!this._maxSize) {
                    this._updateSizes();
                }
                return this._maxSize;
            };
            /**
             * Set the geometry of the item using the given values.
             */
            WidgetItem.prototype.setGeometry = function (x, y, width, height) {
                var widget = this._widget;
                if (widget.isHidden) {
                    return;
                }
                var w = width;
                var h = height;
                var alignment = this._alignment;
                if (alignment & widgets.Alignment.Horizontal_Mask) {
                    var ignW = widget.horizontalSizePolicy === widgets.SizePolicy.Ignored;
                    w = Math.min(w, ignW ? this._origHint.width : this._sizeHint.width);
                }
                if (alignment & widgets.Alignment.Vertical_Mask) {
                    var ignH = widget.verticalSizePolicy === widgets.SizePolicy.Ignored;
                    h = Math.min(h, ignH ? this._origHint.height : this._sizeHint.height);
                }
                var minSize = this._minSize;
                var maxSize = this._maxSize;
                w = Math.max(minSize.width, Math.min(w, maxSize.width));
                h = Math.max(minSize.height, Math.min(h, maxSize.height));
                if (alignment & widgets.Alignment.Right) {
                    x += width - w;
                }
                else if (alignment & widgets.Alignment.HorizontalCenter) {
                    x += (width - w) / 2;
                }
                if (alignment & widgets.Alignment.Bottom) {
                    y += height - h;
                }
                else if (alignment & widgets.Alignment.VerticalCenter) {
                    y += (height - h) / 2;
                }
                widget.setGeometry(x, y, w, h);
            };
            /**
             * Update the computed sizes for the widget item.
             */
            WidgetItem.prototype._updateSizes = function () {
                var widget = this._widget;
                if (widget.isHidden) {
                    this._origHint = Size.Zero;
                    this._sizeHint = Size.Zero;
                    this._minSize = Size.Zero;
                    this._maxSize = Size.Zero;
                    return;
                }
                var box = widget.boxSizing;
                var sizeHint = widget.sizeHint();
                var minHint = widget.minSizeHint();
                var maxHint = widget.maxSizeHint();
                var verticalPolicy = widget.verticalSizePolicy;
                var horizontalPolicy = widget.horizontalSizePolicy;
                // computed size hint
                var hintW = 0;
                var hintH = 0;
                if (horizontalPolicy !== widgets.SizePolicy.Ignored) {
                    hintW = Math.max(minHint.width, sizeHint.width);
                }
                if (verticalPolicy !== widgets.SizePolicy.Ignored) {
                    hintH = Math.max(minHint.height, sizeHint.height);
                }
                hintW = Math.max(box.minWidth, Math.min(hintW, box.maxWidth));
                hintH = Math.max(box.minHeight, Math.min(hintH, box.maxHeight));
                // computed min size
                var minW = 0;
                var minH = 0;
                if (horizontalPolicy !== widgets.SizePolicy.Ignored) {
                    if (horizontalPolicy & widgets.SizePolicy.ShrinkFlag) {
                        minW = minHint.width;
                    }
                    else {
                        minW = Math.max(minHint.width, sizeHint.width);
                    }
                }
                if (verticalPolicy !== widgets.SizePolicy.Ignored) {
                    if (verticalPolicy & widgets.SizePolicy.ShrinkFlag) {
                        minH = minHint.height;
                    }
                    else {
                        minH = Math.max(minHint.height, sizeHint.height);
                    }
                }
                minW = Math.max(box.minWidth, Math.min(minW, box.maxWidth));
                minH = Math.max(box.minHeight, Math.min(minH, box.maxHeight));
                // computed max size
                var maxW = Infinity;
                var maxH = Infinity;
                var alignment = this._alignment;
                if (!(alignment & widgets.Alignment.Horizontal_Mask)) {
                    if (horizontalPolicy !== widgets.SizePolicy.Ignored) {
                        if (horizontalPolicy & widgets.SizePolicy.GrowFlag) {
                            maxW = Math.max(minHint.width, maxHint.width);
                        }
                        else {
                            maxW = Math.max(minHint.width, sizeHint.width);
                        }
                    }
                    maxW = Math.max(box.minWidth, Math.min(maxW, box.maxWidth));
                }
                if (!(alignment & widgets.Alignment.Vertical_Mask)) {
                    if (verticalPolicy !== widgets.SizePolicy.Ignored) {
                        if (verticalPolicy & widgets.SizePolicy.GrowFlag) {
                            maxH = Math.max(minHint.height, maxHint.height);
                        }
                        else {
                            maxH = Math.max(minHint.height, sizeHint.height);
                        }
                    }
                    maxH = Math.max(box.minHeight, Math.min(maxH, box.maxHeight));
                }
                this._origHint = sizeHint;
                this._sizeHint = new Size(hintW, hintH);
                this._minSize = new Size(minW, minH);
                this._maxSize = new Size(maxW, maxH);
            };
            return WidgetItem;
        })();
        widgets.WidgetItem = WidgetItem;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var algo = phosphor.collections.algorithm;
        var Size = phosphor.utility.Size;
        /**
         * A layout which arranges widgets in a row or column.
         */
        var BoxLayout = (function (_super) {
            __extends(BoxLayout, _super);
            /**
             * Construct a new box layout.
             */
            function BoxLayout(direction, spacing) {
                if (spacing === void 0) { spacing = 8; }
                _super.call(this);
                this._dirty = true;
                this._fixedSpace = 0;
                this._lastSpaceIndex = -1;
                this._minSize = null;
                this._maxSize = null;
                this._sizeHint = null;
                this._items = [];
                this._sizers = [];
                this._direction = direction;
                this._spacing = Math.max(0, spacing);
            }
            /**
             * Dispose of the resources held by the layout.
             */
            BoxLayout.prototype.dispose = function () {
                this._items = null;
                this._sizers = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(BoxLayout.prototype, "direction", {
                /**
                 * Get the layout direction for the box layout.
                 */
                get: function () {
                    return this._direction;
                },
                /**
                 * Set the layout direction for the box layout.
                 */
                set: function (direction) {
                    if (direction === this._direction) {
                        return;
                    }
                    if (isHorizontal(this._direction) !== isHorizontal(direction)) {
                        this._items.forEach(function (item) {
                            if (item instanceof widgets.SpacerItem)
                                item.transpose();
                        });
                    }
                    this._direction = direction;
                    this.invalidate();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BoxLayout.prototype, "spacing", {
                /**
                 * Get the inter-element fixed spacing for the box layout.
                 */
                get: function () {
                    return this._spacing;
                },
                /**
                 * Set the inter-element fixed spacing for the box layout.
                 */
                set: function (spacing) {
                    spacing = Math.max(0, spacing);
                    if (spacing === this._spacing) {
                        return;
                    }
                    this._spacing = spacing;
                    this.invalidate();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BoxLayout.prototype, "count", {
                /**
                 * Get the number of layout items in the layout.
                 */
                get: function () {
                    return this._items.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the layout item at the specified index.
             */
            BoxLayout.prototype.itemAt = function (index) {
                return this._items[index];
            };
            /**
             * Remove and return the layout item at the specified index.
             */
            BoxLayout.prototype.removeAt = function (index) {
                var item = algo.removeAt(this._items, index);
                algo.removeAt(this._sizers, index);
                if (item)
                    this.invalidate();
                return item;
            };
            /**
             * Add a widget as the last item in the layout.
             *
             * If the widget already exists in the layout, it will be moved.
             *
             * Returns the index of the added widget.
             */
            BoxLayout.prototype.addWidget = function (widget, stretch, alignment) {
                return this.insertWidget(this.count, widget, stretch, alignment);
            };
            /**
             * Insert a widget into the layout at the given index.
             *
             * If the widget already exists in the layout, it will be moved.
             *
             * Returns the index of the added widget.
             */
            BoxLayout.prototype.insertWidget = function (index, widget, stretch, alignment) {
                if (stretch === void 0) { stretch = 0; }
                if (alignment === void 0) { alignment = 0; }
                this.remove(widget);
                this.ensureParent(widget);
                return this._insert(index, new widgets.WidgetItem(widget, alignment), stretch);
            };
            /**
             * Add a fixed amount of spacing to the end of the layout.
             *
             * Returns the index of the added space.
             */
            BoxLayout.prototype.addSpacing = function (size) {
                return this.insertSpacing(this.count, size);
            };
            /**
             * Insert a fixed amount of spacing at the given index.
             *
             * Returns the index of the added space.
             */
            BoxLayout.prototype.insertSpacing = function (index, size) {
                var spacer;
                if (isHorizontal(this._direction)) {
                    spacer = new widgets.SpacerItem(size, 0, widgets.SizePolicy.Fixed, widgets.SizePolicy.Minimum);
                }
                else {
                    spacer = new widgets.SpacerItem(0, size, widgets.SizePolicy.Minimum, widgets.SizePolicy.Fixed);
                }
                return this._insert(index, spacer, 0);
            };
            /**
             * Add stretchable space to the end of the layout.
             *
             * Returns the index of the added space.
             */
            BoxLayout.prototype.addStretch = function (stretch) {
                return this.insertStretch(this.count, stretch);
            };
            /**
             * Insert stretchable space at the given index.
             */
            BoxLayout.prototype.insertStretch = function (index, stretch) {
                var spacer;
                if (isHorizontal(this._direction)) {
                    spacer = new widgets.SpacerItem(0, 0, widgets.SizePolicy.Expanding, widgets.SizePolicy.Minimum);
                }
                else {
                    spacer = new widgets.SpacerItem(0, 0, widgets.SizePolicy.Minimum, widgets.SizePolicy.Expanding);
                }
                return this._insert(index, spacer, stretch);
            };
            /**
             * Get the stretch factor for the given widget or index.
             *
             * Returns -1 if the given widget or index is invalid.
             */
            BoxLayout.prototype.stretch = function (which) {
                var index = typeof which === 'number' ? which : this.indexOf(which);
                var sizer = this._sizers[index];
                return sizer ? sizer.stretch : -1;
            };
            /**
             * Set the stretch factor for the given widget or index.
             *
             * Returns true if the stretch was updated, false otherwise.
             */
            BoxLayout.prototype.setStretch = function (which, stretch) {
                var index = typeof which === 'number' ? which : this.indexOf(which);
                var sizer = this._sizers[index];
                if (!sizer) {
                    return false;
                }
                stretch = Math.max(0, Math.floor(stretch));
                if (sizer.stretch !== stretch) {
                    sizer.stretch = stretch;
                    this.invalidate();
                }
                return true;
            };
            /**
             * Invalidate the cached layout data and enqueue an update.
             */
            BoxLayout.prototype.invalidate = function () {
                this._dirty = true;
                _super.prototype.invalidate.call(this);
            };
            /**
             * Compute the preferred size of the layout.
             */
            BoxLayout.prototype.sizeHint = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._sizeHint;
            };
            /**
             * Compute the minimum size of the layout.
             */
            BoxLayout.prototype.minSize = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._minSize;
            };
            /**
             * Compute the maximum size of the layout.
             */
            BoxLayout.prototype.maxSize = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._maxSize;
            };
            /**
             * Update the geometry of the child layout items.
             */
            BoxLayout.prototype.layout = function (x, y, width, height) {
                // Bail early when no work needs to be done.
                var items = this._items;
                if (items.length === 0) {
                    return;
                }
                // Refresh the layout items if needed.
                if (this._dirty) {
                    this._setupGeometry();
                }
                // Commonly used variables.
                var dir = this._direction;
                var sizers = this._sizers;
                var lastSpaceIndex = this._lastSpaceIndex;
                // Distribute the layout space to the sizers.
                var mainSpace = isHorizontal(dir) ? width : height;
                widgets.layoutCalc(sizers, Math.max(0, mainSpace - this._fixedSpace));
                // Update the geometry of the items according to the layout
                // direction. Fixed spacing is added before each item which
                // immediately follows a non-hidden widget item. This has the
                // effect of of collapsing all sibling spacers and ensuring
                // that only one fixed spacing increment occurs between any
                // two widgets. It also prevents fixed spacing from being
                // added before the first item or after the last item.
                var lastWasWidget = false;
                var spacing = this._spacing;
                var count = items.length;
                if (dir === widgets.Direction.LeftToRight) {
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        if (item.isHidden) {
                            continue;
                        }
                        if (lastWasWidget && i <= lastSpaceIndex) {
                            x += spacing;
                        }
                        var size = sizers[i].size;
                        item.setGeometry(x, y, size, height);
                        lastWasWidget = item.isWidget;
                        x += size;
                    }
                }
                else if (dir === widgets.Direction.TopToBottom) {
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        if (item.isHidden) {
                            continue;
                        }
                        if (lastWasWidget && i <= lastSpaceIndex) {
                            y += spacing;
                        }
                        var size = sizers[i].size;
                        item.setGeometry(x, y, width, size);
                        lastWasWidget = item.isWidget;
                        y += size;
                    }
                }
                else if (dir === widgets.Direction.RightToLeft) {
                    x += width;
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        if (item.isHidden) {
                            continue;
                        }
                        if (lastWasWidget && i <= lastSpaceIndex) {
                            x -= spacing;
                        }
                        var size = sizers[i].size;
                        item.setGeometry(x - size, y, size, height);
                        lastWasWidget = item.isWidget;
                        x -= size;
                    }
                }
                else {
                    y += height;
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        if (item.isHidden) {
                            continue;
                        }
                        if (lastWasWidget && i <= lastSpaceIndex) {
                            y -= spacing;
                        }
                        var size = sizers[i].size;
                        item.setGeometry(x, y - size, width, size);
                        lastWasWidget = item.isWidget;
                        y -= size;
                    }
                }
            };
            /**
             * Initialize the layout items and internal sizes for the layout.
             */
            BoxLayout.prototype._setupGeometry = function () {
                // Bail early when no work needs to be done.
                if (!this._dirty) {
                    return;
                }
                this._dirty = false;
                // No parent means the layout is not yet attached.
                var parent = this.parent;
                if (!parent) {
                    this._sizeHint = Size.Zero;
                    this._minSize = Size.Zero;
                    this._maxSize = Size.Zero;
                    this._fixedSpace = 0;
                    return;
                }
                // Invalidate the layout items. This is done here instead of the
                // `invalidate` method as this method is invoked only when needed,
                // typically on a collapsed event. It also finds the last visible
                // widget item index, which is needed for fixed spacing allocation.
                var lastSpaceIndex = -1;
                var items = this._items;
                var count = items.length;
                for (var i = 0; i < count; ++i) {
                    var item = items[i];
                    item.invalidate();
                    if (item.isWidget && !item.isHidden) {
                        lastSpaceIndex = i;
                    }
                }
                // Setup commonly used variables.
                var hintW = 0;
                var hintH = 0;
                var minW = 0;
                var minH = 0;
                var maxW;
                var maxH;
                var fixedSpace = 0;
                var lastWasWidget = false;
                var dir = this._direction;
                var spacing = this._spacing;
                var sizers = this._sizers;
                // Compute the size bounds according to the layout orientation.
                // Empty layout items behave as if they don't exist and fixed
                // spacing is before items which immediately follow a non-hidden
                // widget item. This prevents leading and trailing fixed spacing
                // as well as fixed spacing after spacers. Sizers are initialized
                // according to their corresponding layout item.
                if (isHorizontal(dir)) {
                    maxH = Infinity;
                    maxW = count > 0 ? 0 : Infinity;
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        var sizer = sizers[i];
                        if (item.isHidden) {
                            sizer.sizeHint = 0;
                            sizer.minSize = 0;
                            sizer.maxSize = 0;
                            sizer.expansive = false;
                            continue;
                        }
                        var itemHint = item.sizeHint();
                        var itemMin = item.minSize();
                        var itemMax = item.maxSize();
                        hintH = Math.max(hintH, itemHint.height);
                        minH = Math.max(minH, itemMin.height);
                        maxH = Math.min(maxH, itemMax.height);
                        hintW += itemHint.width;
                        minW += itemMin.width;
                        maxW += itemMax.width;
                        sizer.sizeHint = itemHint.width;
                        sizer.minSize = itemMin.width;
                        sizer.maxSize = itemMax.width;
                        sizer.expansive = item.expandHorizontal;
                        if (lastWasWidget && i <= lastSpaceIndex) {
                            fixedSpace += spacing;
                        }
                        lastWasWidget = item.isWidget;
                    }
                    hintW += fixedSpace;
                    minW += fixedSpace;
                    maxW += fixedSpace;
                }
                else {
                    maxW = Infinity;
                    maxH = count > 0 ? 0 : Infinity;
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        var sizer = sizers[i];
                        if (item.isHidden) {
                            sizer.sizeHint = 0;
                            sizer.minSize = 0;
                            sizer.maxSize = 0;
                            sizer.expansive = false;
                            continue;
                        }
                        var itemHint = item.sizeHint();
                        var itemMin = item.minSize();
                        var itemMax = item.maxSize();
                        hintW = Math.max(hintW, itemHint.width);
                        minW = Math.max(minW, itemMin.width);
                        maxW = Math.min(maxW, itemMax.width);
                        hintH += itemHint.height;
                        minH += itemMin.height;
                        maxH += itemMax.height;
                        sizer.sizeHint = itemHint.height;
                        sizer.minSize = itemMin.height;
                        sizer.maxSize = itemMax.height;
                        sizer.expansive = item.expandVertical;
                        if (lastWasWidget && i <= lastSpaceIndex) {
                            fixedSpace += spacing;
                        }
                        lastWasWidget = item.isWidget;
                    }
                    hintH += fixedSpace;
                    minH += fixedSpace;
                    maxH += fixedSpace;
                }
                // Account for padding and border on the parent.
                var box = parent.boxSizing;
                var boxW = box.horizontalSum;
                var boxH = box.verticalSum;
                hintW += boxW;
                hintH += boxH;
                minW += boxW;
                minH += boxH;
                maxW += boxW;
                maxH += boxH;
                // Update the internal sizes.
                this._sizeHint = new Size(hintW, hintH);
                this._minSize = new Size(minW, minH);
                this._maxSize = new Size(maxW, maxH);
                this._fixedSpace = fixedSpace;
                this._lastSpaceIndex = lastSpaceIndex;
            };
            /**
             * Insert a layout item at the given index.
             *
             * Returns the index of the added item.
             */
            BoxLayout.prototype._insert = function (index, item, stretch) {
                var sizer = new widgets.LayoutSizer();
                sizer.stretch = Math.max(0, Math.floor(stretch));
                index = algo.insert(this._items, index, item);
                algo.insert(this._sizers, index, sizer);
                this.invalidate();
                return index;
            };
            return BoxLayout;
        })(widgets.Layout);
        widgets.BoxLayout = BoxLayout;
        /**
         * Test whether the given direction is horizontal.
         */
        function isHorizontal(dir) {
            return dir === widgets.Direction.LeftToRight || dir === widgets.Direction.RightToLeft;
        }
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var NodeBase = phosphor.core.NodeBase;
        /**
         * The class name assigned to a split handle.
         */
        var HANDLE_CLASS = 'p-SplitHandle';
        /**
         * The class name assigned to a split handle overlay.
         */
        var OVERLAY_CLASS = 'p-SplitHandle-overlay';
        /**
         * The class name added to horizontal split handles.
         */
        var HORIZONTAL_CLASS = 'p-mod-horizontal';
        /**
         * The class name added to vertical split handles.
         */
        var VERTICAL_CLASS = 'p-mod-vertical';
        /**
         * The class name added to hidden split handles.
         */
        var HIDDEN_CLASS = 'p-mod-hidden';
        /**
         * A class which manages a handle node for a split panel.
         */
        var SplitHandle = (function (_super) {
            __extends(SplitHandle, _super);
            /**
             * Construct a new split handle.
             */
            function SplitHandle(orientation) {
                _super.call(this);
                this._hidden = false;
                this.addClass(HANDLE_CLASS);
                this._orientation = orientation;
                if (orientation === widgets.Orientation.Horizontal) {
                    this.addClass(HORIZONTAL_CLASS);
                }
                else {
                    this.addClass(VERTICAL_CLASS);
                }
            }
            /**
             * Create the DOM node for a split handle.
             */
            SplitHandle.createNode = function () {
                var node = document.createElement('div');
                var overlay = document.createElement('div');
                overlay.className = OVERLAY_CLASS;
                node.appendChild(overlay);
                return node;
            };
            Object.defineProperty(SplitHandle.prototype, "hidden", {
                /**
                 * Get whether the handle is hidden.
                 */
                get: function () {
                    return this._hidden;
                },
                /**
                 * Set whether the handle is hidden.
                 */
                set: function (hidden) {
                    if (hidden === this._hidden) {
                        return;
                    }
                    this._hidden = hidden;
                    if (hidden) {
                        this.addClass(HIDDEN_CLASS);
                    }
                    else {
                        this.removeClass(HIDDEN_CLASS);
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SplitHandle.prototype, "orientation", {
                /**
                 * Get the orientation of the handle.
                 */
                get: function () {
                    return this._orientation;
                },
                /**
                 * Set the orientation of the handle.
                 */
                set: function (value) {
                    if (value === this._orientation) {
                        return;
                    }
                    this._orientation = value;
                    if (value === widgets.Orientation.Horizontal) {
                        this.removeClass(VERTICAL_CLASS);
                        this.addClass(HORIZONTAL_CLASS);
                    }
                    else {
                        this.removeClass(HORIZONTAL_CLASS);
                        this.addClass(VERTICAL_CLASS);
                    }
                },
                enumerable: true,
                configurable: true
            });
            return SplitHandle;
        })(NodeBase);
        widgets.SplitHandle = SplitHandle;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var algo = phosphor.collections.algorithm;
        var Size = phosphor.utility.Size;
        /**
         * A layout which arranges widgets in resizable sections.
         */
        var SplitLayout = (function (_super) {
            __extends(SplitLayout, _super);
            /**
             * Construct a new split layout.
             */
            function SplitLayout(orientation) {
                _super.call(this);
                this._dirty = true;
                this._handleSize = 3;
                this._fixedSpace = 0;
                this._minSize = null;
                this._maxSize = null;
                this._sizeHint = null;
                this._items = [];
                this._sizers = [];
                this._orientation = orientation;
            }
            /**
             * Dispose of the resources held by the layout.
             */
            SplitLayout.prototype.dispose = function () {
                this._items = null;
                this._sizers = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(SplitLayout.prototype, "orientation", {
                /**
                 * Get the orientation of the split layout.
                 */
                get: function () {
                    return this._orientation;
                },
                /**
                 * Set the orientation of the split layout.
                 */
                set: function (orientation) {
                    if (orientation === this._orientation) {
                        return;
                    }
                    this._orientation = orientation;
                    this.invalidate();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SplitLayout.prototype, "handleSize", {
                /**
                 * Get the size of the split handles.
                 */
                get: function () {
                    return this._handleSize;
                },
                /**
                 * Set the the size of the split handles.
                 */
                set: function (size) {
                    size = Math.max(0, Math.floor(size));
                    if (size === this._handleSize) {
                        return;
                    }
                    this._handleSize = size;
                    this.invalidate();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SplitLayout.prototype, "count", {
                /**
                 * Get the number of layout items in the layout.
                 */
                get: function () {
                    return this._items.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the normalized sizes of the items in the layout.
             */
            SplitLayout.prototype.sizes = function () {
                return normalize(this._sizers.map(function (sizer) { return sizer.size; }));
            };
            /**
             * Set the relative sizes for the split items.
             *
             * Extra values are ignored, too few will yield an undefined layout.
             */
            SplitLayout.prototype.setSizes = function (sizes) {
                var parent = this.parent;
                if (!parent) {
                    return;
                }
                var totalSize;
                var box = parent.boxSizing;
                if (this._orientation === widgets.Orientation.Horizontal) {
                    totalSize = parent.width - box.horizontalSum - this._fixedSpace;
                }
                else {
                    totalSize = parent.height - box.verticalSum - this._fixedSpace;
                }
                var sizers = this._sizers;
                var normed = normalize(sizes);
                var n = Math.min(sizers.length, normed.length);
                for (var i = 0; i < n; ++i) {
                    var hint = Math.round(normed[i] * totalSize);
                    var sizer = sizers[i];
                    sizer.size = hint;
                    sizer.sizeHint = hint;
                }
                this.refresh();
            };
            /**
             * Get the splitter handle at the given index.
             */
            SplitLayout.prototype.handleAt = function (index) {
                var item = this._items[index];
                return item ? item.handle : void 0;
            };
            /**
             * Move the handle at the given index to the offset position.
             *
             * This will move the handle as close as possible to the given
             * offset position, without violating item size constraints.
             */
            SplitLayout.prototype.moveHandle = function (index, pos) {
                var item = this._items[index];
                if (!item || item.handle.hidden) {
                    return;
                }
                var delta;
                if (this._orientation === widgets.Orientation.Horizontal) {
                    delta = pos - item.handle.node.offsetLeft;
                }
                else {
                    delta = pos - item.handle.node.offsetTop;
                }
                if (delta === 0) {
                    return;
                }
                var sizers = this._sizers;
                storeSizes(sizers); // Prevent item resizing unless needed.
                if (delta > 0) {
                    growSizer(sizers, index, delta);
                }
                else {
                    sizers.reverse();
                    growSizer(sizers, sizers.length - (index + 2), -delta);
                    sizers.reverse();
                }
                this.refresh();
            };
            /**
             * Get the layout item at the specified index.
             */
            SplitLayout.prototype.itemAt = function (index) {
                return this._items[index];
            };
            /**
             * Remove and return the layout item at the specified index.
             */
            SplitLayout.prototype.removeAt = function (index) {
                var item = algo.removeAt(this._items, index);
                algo.removeAt(this._sizers, index);
                if (item) {
                    var hNode = item.handle.node;
                    var pNode = hNode.parentNode;
                    if (pNode)
                        pNode.removeChild(hNode);
                    this.invalidate();
                }
                return item;
            };
            /**
             * Add a widget as the last item in the layout.
             *
             * If the widget already exists in the layout, it will be moved.
             *
             * Returns the index of the added widget.
             */
            SplitLayout.prototype.addWidget = function (widget, stretch, alignment) {
                return this.insertWidget(this.count, widget, stretch, alignment);
            };
            /**
             * Insert a widget into the layout at the given index.
             *
             * If the widget already exists in the layout, it will be moved.
             *
             * Returns the index of the added widget.
             */
            SplitLayout.prototype.insertWidget = function (index, widget, stretch, alignment) {
                if (stretch === void 0) { stretch = 0; }
                if (alignment === void 0) { alignment = 0; }
                this.remove(widget);
                this.ensureParent(widget);
                var handle = new widgets.SplitHandle(this._orientation);
                var item = new SplitItem(handle, widget, alignment);
                var sizer = new widgets.LayoutSizer();
                sizer.stretch = Math.max(0, Math.floor(stretch));
                index = algo.insert(this._items, index, item);
                algo.insert(this._sizers, index, sizer);
                this.invalidate();
                return index;
            };
            /**
             * Get the stretch factor for the given widget or index.
             *
             * Returns -1 if the given widget or index is invalid.
             */
            SplitLayout.prototype.stretch = function (which) {
                var index = typeof which === 'number' ? which : this.indexOf(which);
                var sizer = this._sizers[index];
                return sizer ? sizer.stretch : -1;
            };
            /**
             * Set the stretch factor for the given widget or index.
             *
             * Returns true if the stretch was updated, false otherwise.
             */
            SplitLayout.prototype.setStretch = function (which, stretch) {
                var index = typeof which === 'number' ? which : this.indexOf(which);
                var sizer = this._sizers[index];
                if (!sizer) {
                    return false;
                }
                stretch = Math.max(0, Math.floor(stretch));
                if (sizer.stretch !== stretch) {
                    sizer.stretch = stretch;
                    this.invalidate();
                }
                return true;
            };
            /**
             * Invalidate the cached layout data and enqueue an update.
             */
            SplitLayout.prototype.invalidate = function () {
                this._dirty = true;
                _super.prototype.invalidate.call(this);
            };
            /**
             * Compute the preferred size of the layout.
             */
            SplitLayout.prototype.sizeHint = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._sizeHint;
            };
            /**
             * Compute the minimum size of the layout.
             */
            SplitLayout.prototype.minSize = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._minSize;
            };
            /**
             * Compute the maximum size of the layout.
             */
            SplitLayout.prototype.maxSize = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._maxSize;
            };
            /**
             * Update the geometry of the child layout items.
             */
            SplitLayout.prototype.layout = function (x, y, width, height) {
                // Bail early when no work needs to be done.
                var items = this._items;
                if (items.length === 0) {
                    return;
                }
                // Refresh the layout items if needed.
                if (this._dirty) {
                    this._setupGeometry();
                }
                // Commonly used variables.
                var orient = this._orientation;
                var sizers = this._sizers;
                // Distribute the layout space to the sizers.
                var mainSpace = orient === widgets.Orientation.Horizontal ? width : height;
                widgets.layoutCalc(sizers, Math.max(0, mainSpace - this._fixedSpace));
                // Update the geometry of the items according to the orientation.
                var hSize = this._handleSize;
                var count = items.length;
                if (orient === widgets.Orientation.Horizontal) {
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        if (item.isHidden) {
                            continue;
                        }
                        var size = sizers[i].size;
                        var hStyle = item.handle.node.style;
                        item.setGeometry(x, y, size, height);
                        hStyle.top = y + 'px';
                        hStyle.left = x + size + 'px';
                        hStyle.width = hSize + 'px';
                        hStyle.height = height + 'px';
                        x += size + hSize;
                    }
                }
                else {
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        if (item.isHidden) {
                            continue;
                        }
                        var size = sizers[i].size;
                        var hStyle = item.handle.node.style;
                        item.setGeometry(x, y, width, size);
                        hStyle.top = y + size + 'px';
                        hStyle.left = x + 'px';
                        hStyle.width = width + 'px';
                        hStyle.height = hSize + 'px';
                        y += size + hSize;
                    }
                }
            };
            /**
             * Initialize the layout items and internal sizes for the layout.
             */
            SplitLayout.prototype._setupGeometry = function () {
                // Bail early when no work needs to be done.
                if (!this._dirty) {
                    return;
                }
                this._dirty = false;
                // No parent means the layout is not yet attached.
                var parent = this.parent;
                if (!parent) {
                    this._sizeHint = Size.Zero;
                    this._minSize = Size.Zero;
                    this._maxSize = Size.Zero;
                    this._fixedSpace = 0;
                    return;
                }
                // Invalidate the layout items and reset the handles for the current
                // orientation. Hide the handles associated with a hidden item and
                // ensure the handle node is attached to the parent node. Traverse
                // the items backwards and hide the first visible item handle.
                var hidFirst = false;
                var pNode = parent.node;
                var orient = this._orientation;
                var items = this._items;
                var count = items.length;
                for (var i = count - 1; i >= 0; --i) {
                    var item = items[i];
                    var handle = item.handle;
                    var hNode = handle.node;
                    item.invalidate();
                    handle.orientation = orient;
                    handle.hidden = item.isHidden;
                    if (hNode.parentNode !== pNode) {
                        pNode.appendChild(hNode);
                    }
                    if (!hidFirst && !item.isHidden) {
                        item.handle.hidden = true;
                        hidFirst = true;
                    }
                }
                // Setup commonly used variables.
                var hintW = 0;
                var hintH = 0;
                var minW = 0;
                var minH = 0;
                var maxW;
                var maxH;
                var fixedSpace = 0;
                var handleSize = this._handleSize;
                var sizers = this._sizers;
                // Prevent item resizing unless needed.
                storeSizes(sizers);
                // Compute the size bounds according to the splitter orientation.
                //
                // A visible item with a zero size hint indicates a newly added
                // item. Its layout size hint is initialized to the item's hint.
                if (orient === widgets.Orientation.Horizontal) {
                    maxH = Infinity;
                    maxW = count > 0 ? 0 : Infinity;
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        var sizer = sizers[i];
                        if (item.isHidden) {
                            sizer.minSize = 0;
                            sizer.maxSize = 0;
                            sizer.expansive = false;
                            continue;
                        }
                        var itemHint = item.sizeHint();
                        var itemMin = item.minSize();
                        var itemMax = item.maxSize();
                        hintH = Math.max(hintH, itemHint.height);
                        minH = Math.max(minH, itemMin.height);
                        maxH = Math.min(maxH, itemMax.height);
                        hintW += itemHint.width;
                        minW += itemMin.width;
                        maxW += itemMax.width;
                        sizer.minSize = itemMin.width;
                        sizer.maxSize = itemMax.width;
                        sizer.expansive = item.expandHorizontal;
                        if (sizer.sizeHint === 0) {
                            sizer.sizeHint = itemHint.width;
                        }
                        if (!item.handle.hidden) {
                            fixedSpace += handleSize;
                        }
                    }
                    hintW += fixedSpace;
                    minW += fixedSpace;
                    maxW += fixedSpace;
                }
                else {
                    maxW = Infinity;
                    maxH = count > 0 ? 0 : Infinity;
                    for (var i = 0; i < count; ++i) {
                        var item = items[i];
                        var sizer = sizers[i];
                        if (item.isHidden) {
                            sizer.minSize = 0;
                            sizer.maxSize = 0;
                            sizer.expansive = false;
                            continue;
                        }
                        var itemHint = item.sizeHint();
                        var itemMin = item.minSize();
                        var itemMax = item.maxSize();
                        hintW = Math.max(hintW, itemHint.width);
                        minW = Math.max(minW, itemMin.width);
                        maxW = Math.min(maxW, itemMax.width);
                        hintH += itemHint.height;
                        minH += itemMin.height;
                        maxH += itemMax.height;
                        sizer.minSize = itemMin.height;
                        sizer.maxSize = itemMax.height;
                        sizer.expansive = item.expandVertical;
                        if (sizer.sizeHint === 0) {
                            sizer.sizeHint = itemHint.height;
                        }
                        if (!item.handle.hidden) {
                            fixedSpace += handleSize;
                        }
                    }
                    hintH += fixedSpace;
                    minH += fixedSpace;
                    maxH += fixedSpace;
                }
                // Account for padding and border on the parent.
                var box = parent.boxSizing;
                var boxW = box.horizontalSum;
                var boxH = box.verticalSum;
                hintW += boxW;
                hintH += boxH;
                minW += boxW;
                minH += boxH;
                maxW += boxW;
                maxH += boxH;
                // Update the internal sizes.
                this._sizeHint = new Size(hintW, hintH);
                this._minSize = new Size(minW, minH);
                this._maxSize = new Size(maxW, maxH);
                this._fixedSpace = fixedSpace;
            };
            return SplitLayout;
        })(widgets.Layout);
        widgets.SplitLayout = SplitLayout;
        /**
         * A custom widget item used by a split layout.
         */
        var SplitItem = (function (_super) {
            __extends(SplitItem, _super);
            /**
             * Construct a new split item.
             */
            function SplitItem(handle, widget, alignment) {
                _super.call(this, widget, alignment);
                this._handle = handle;
            }
            Object.defineProperty(SplitItem.prototype, "handle", {
                /**
                 * Get the split handle for the item.
                 */
                get: function () {
                    return this._handle;
                },
                enumerable: true,
                configurable: true
            });
            return SplitItem;
        })(widgets.WidgetItem);
        widgets.SplitItem = SplitItem;
        /**
         * Store the current layout sizes of the sizers.
         *
         * This will set the layout size hint to the current layout size for
         * every sizer with a current size greater than zero. This ensures
         * that an item will not be resized on the next layout unless its
         * size limits force a resize.
         */
        function storeSizes(sizers) {
            for (var i = 0, n = sizers.length; i < n; ++i) {
                var sizer = sizers[i];
                if (sizer.size > 0) {
                    sizer.sizeHint = sizer.size;
                }
            }
        }
        /**
         * Grow a sizer to the right by a positive delta.
         *
         * This will adjust the sizer's neighbors if required.
         */
        function growSizer(sizers, index, delta) {
            var growLimit = 0;
            for (var i = 0; i <= index; ++i) {
                var sizer = sizers[i];
                growLimit += sizer.maxSize - sizer.size;
            }
            var shrinkLimit = 0;
            for (var i = index + 1, n = sizers.length; i < n; ++i) {
                var sizer = sizers[i];
                shrinkLimit += sizer.size - sizer.minSize;
            }
            delta = Math.min(delta, growLimit, shrinkLimit);
            var grow = delta;
            for (var i = index; i >= 0 && grow > 0; --i) {
                var sizer = sizers[i];
                var limit = sizer.maxSize - sizer.size;
                if (limit >= grow) {
                    sizer.sizeHint = sizer.size + grow;
                    grow = 0;
                }
                else {
                    sizer.sizeHint = sizer.size + limit;
                    grow -= limit;
                }
            }
            var shrink = delta;
            for (var i = index + 1, n = sizers.length; i < n && shrink > 0; ++i) {
                var sizer = sizers[i];
                var limit = sizer.size - sizer.minSize;
                if (limit >= shrink) {
                    sizer.sizeHint = sizer.size - shrink;
                    shrink = 0;
                }
                else {
                    sizer.sizeHint = sizer.size - limit;
                    shrink -= limit;
                }
            }
        }
        /**
         * Normalize an array of positive values.
         */
        function normalize(values) {
            var n = values.length;
            if (n === 0) {
                return [];
            }
            var sum = 0;
            for (var i = 0; i < n; ++i) {
                sum += values[i];
            }
            var result = new Array(n);
            if (sum === 0) {
                for (var i = 0; i < n; ++i) {
                    result[i] = 1 / n;
                }
            }
            else {
                for (var i = 0; i < n; ++i) {
                    result[i] = values[i] / sum;
                }
            }
            return result;
        }
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var algo = phosphor.collections.algorithm;
        var signal = phosphor.core.signal;
        var Pair = phosphor.utility.Pair;
        var Size = phosphor.utility.Size;
        /**
         * A layout in which only one widget is visible at a time.
         *
         * User code is responsible for managing the current layout index. The
         * index defaults to -1, which means no widget will be shown. The index
         * must be set to a valid index in order for a widget to be displayed.
         *
         * If the current widget is removed, the current index is reset to -1.
         *
         * This layout will typically be used in conjunction with another
         * widget, such as a tab bar, which manipulates the layout index.
         */
        var StackedLayout = (function (_super) {
            __extends(StackedLayout, _super);
            /**
             * Construct a new stack layout.
             */
            function StackedLayout() {
                _super.call(this);
                this._dirty = true;
                this._sizeHint = null;
                this._minSize = null;
                this._maxSize = null;
                this._items = [];
                this._currentItem = null;
            }
            /**
             * Dispose of the resources held by the layout.
             */
            StackedLayout.prototype.dispose = function () {
                this._currentItem = null;
                this._items = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(StackedLayout.prototype, "currentIndex", {
                /**
                 * Get the current index of the layout.
                 */
                get: function () {
                    return algo.indexOf(this._items, this._currentItem);
                },
                /**
                 * Set the current index of the layout.
                 */
                set: function (index) {
                    var prev = this._currentItem;
                    var next = this.itemAt(index) || null;
                    if (prev === next) {
                        return;
                    }
                    this._currentItem = next;
                    if (prev)
                        prev.widget.hide();
                    if (next)
                        next.widget.show();
                    // IE repaints before firing the animation frame which processes
                    // the layout update triggered by the show/hide calls above. This
                    // causes a double paint flicker when changing the visible widget.
                    // The workaround is to refresh the layout immediately.
                    this.refresh();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(StackedLayout.prototype, "currentWidget", {
                /**
                 * Get the current widget in the layout.
                 */
                get: function () {
                    return this._currentItem.widget;
                },
                /**
                 * Set the current widget in the layout.
                 */
                set: function (widget) {
                    this.currentIndex = this.indexOf(widget);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(StackedLayout.prototype, "count", {
                /**
                 * Get the number of layout items in the layout.
                 */
                get: function () {
                    return this._items.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the layout item at the specified index.
             */
            StackedLayout.prototype.itemAt = function (index) {
                return this._items[index];
            };
            /**
             * Remove and return the layout item at the specified index.
             */
            StackedLayout.prototype.removeAt = function (index) {
                var item = algo.removeAt(this._items, index);
                if (!item) {
                    return void 0;
                }
                if (item === this._currentItem) {
                    this._currentItem = null;
                    item.widget.hide();
                }
                this.widgetRemoved.emit(new Pair(index, item.widget));
                return item;
            };
            /**
             * Add a widget as the last item in the layout.
             *
             * If the widget already exists in the layout, it will be moved.
             *
             * Returns the index of the added widget.
             */
            StackedLayout.prototype.addWidget = function (widget, alignment) {
                return this.insertWidget(this.count, widget, alignment);
            };
            /**
             * Insert a widget into the layout at the given index.
             *
             * If the widget already exists in the layout, it will be moved.
             *
             * Returns the index of the added widget.
             */
            StackedLayout.prototype.insertWidget = function (index, widget, alignment) {
                if (alignment === void 0) { alignment = 0; }
                widget.hide();
                this.remove(widget);
                this.ensureParent(widget);
                return algo.insert(this._items, index, new widgets.WidgetItem(widget, alignment));
            };
            /**
             * Move a widget from one index to another.
             *
             * This method is more efficient for moving a widget than calling
             * `insertWidget` for an already added widget. It will not remove
             * the widget before moving it and will not emit `widgetRemoved`.
             *
             * Returns -1 if `fromIndex` is out of range.
             */
            StackedLayout.prototype.moveWidget = function (fromIndex, toIndex) {
                return algo.move(this._items, fromIndex, toIndex);
            };
            /**
             * Invalidate the cached layout data and enqueue an update.
             */
            StackedLayout.prototype.invalidate = function () {
                this._dirty = true;
                _super.prototype.invalidate.call(this);
            };
            /**
             * Compute the preferred size of the layout.
             */
            StackedLayout.prototype.sizeHint = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._sizeHint;
            };
            /**
             * Compute the minimum size of the layout.
             */
            StackedLayout.prototype.minSize = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._minSize;
            };
            /**
             * Compute the maximum size of the layout.
             */
            StackedLayout.prototype.maxSize = function () {
                if (this._dirty) {
                    this._setupGeometry();
                }
                return this._maxSize;
            };
            /**
             * Update the geometry of the child layout items.
             */
            StackedLayout.prototype.layout = function (x, y, width, height) {
                if (this._dirty) {
                    this._setupGeometry();
                }
                if (this._currentItem !== null) {
                    this._currentItem.setGeometry(x, y, width, height);
                }
            };
            /**
             * Initialize the layout items and internal sizes for the layout.
             */
            StackedLayout.prototype._setupGeometry = function () {
                // Bail early when no work needs to be done.
                if (!this._dirty) {
                    return;
                }
                this._dirty = false;
                // No parent means the layout is not yet attached.
                var parent = this.parent;
                if (!parent) {
                    this._sizeHint = Size.Zero;
                    this._minSize = Size.Zero;
                    this._maxSize = Size.Zero;
                    return;
                }
                // Compute the size bounds based on the visible item.
                var hintW = 0;
                var hintH = 0;
                var minW = 0;
                var minH = 0;
                var maxW = Infinity;
                var maxH = Infinity;
                var item = this._currentItem;
                if (item !== null) {
                    item.invalidate();
                    var itemHint = item.sizeHint();
                    var itemMin = item.minSize();
                    var itemMax = item.maxSize();
                    hintW = Math.max(hintW, itemHint.width);
                    hintH = Math.max(hintH, itemHint.height);
                    minW = Math.max(minW, itemMin.width);
                    minH = Math.max(minH, itemMin.height);
                    maxW = Math.min(maxW, itemMax.width);
                    maxH = Math.min(maxH, itemMax.height);
                }
                // Account for padding and border on the parent.
                var box = parent.boxSizing;
                var boxW = box.horizontalSum;
                var boxH = box.verticalSum;
                hintW += boxW;
                hintH += boxH;
                minW += boxW;
                minH += boxH;
                maxW += boxW;
                maxH += boxH;
                // Update the internal sizes.
                this._sizeHint = new Size(hintW, hintH);
                this._minSize = new Size(minW, minH);
                this._maxSize = new Size(maxW, maxH);
            };
            __decorate([
                signal
            ], StackedLayout.prototype, "widgetRemoved");
            return StackedLayout;
        })(widgets.Layout);
        widgets.StackedLayout = StackedLayout;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var algo = phosphor.collections.algorithm;
        var Message = phosphor.core.Message;
        var NodeBase = phosphor.core.NodeBase;
        var clearMessageData = phosphor.core.clearMessageData;
        var clearSignalData = phosphor.core.clearSignalData;
        var installMessageFilter = phosphor.core.installMessageFilter;
        var postMessage = phosphor.core.postMessage;
        var removeMessageFilter = phosphor.core.removeMessageFilter;
        var sendMessage = phosphor.core.sendMessage;
        var signal = phosphor.core.signal;
        var Size = phosphor.utility.Size;
        var createBoxSizing = phosphor.utility.createBoxSizing;
        /**
         * The class name added to Widget instances.
         */
        var WIDGET_CLASS = 'p-Widget';
        /**
         * The class name added to hidden widgets.
         */
        var HIDDEN_CLASS = 'p-mod-hidden';
        /**
         * A singleton 'layout-changed' message.
         */
        var MSG_LAYOUT_CHANGED = new Message('layout-changed');
        /**
         * A singleton 'layout-request' message.
         */
        var MSG_LAYOUT_REQUEST = new Message('layout-request');
        /**
         * A singleton 'update-request' message.
         */
        var MSG_UPDATE_REQUEST = new Message('update-request');
        /**
         * A singleton 'parent-changed' message.
         */
        var MSG_PARENT_CHANGED = new Message('parent-changed');
        /**
         * A singleton 'before-show' message.
         */
        var MSG_BEFORE_SHOW = new Message('before-show');
        /**
         * A singleton 'after-show' message.
         */
        var MSG_AFTER_SHOW = new Message('after-show');
        /**
         * A singleton 'before-hide' message.
         */
        var MSG_BEFORE_HIDE = new Message('before-hide');
        /**
         * A singleton 'after-hide' message.
         */
        var MSG_AFTER_HIDE = new Message('after-hide');
        /**
         * A singleton 'before-attach' message.
         */
        var MSG_BEFORE_ATTACH = new Message('before-attach');
        /**
         * A singleton 'after-attach' message.
         */
        var MSG_AFTER_ATTACH = new Message('after-attach');
        /**
         * A singleton 'before-detach' message.
         */
        var MSG_BEFORE_DETACH = new Message('before-detach');
        /**
         * A singleton 'after-detach' message.
         */
        var MSG_AFTER_DETACH = new Message('after-detach');
        /**
         * A singleton 'close' message.
         */
        var MSG_CLOSE = new Message('close');
        /**
         * The base class of the Phosphor widget hierarchy.
         *
         * A widget wraps an absolutely positioned DOM node. It can act as a
         * container for child widgets which can be arranged with a Phosphor
         * layout manager, or it can act as a leaf control which manipulates
         * its DOM node directly.
         *
         * A root widget (a widget with no parent) can be mounted anywhere
         * in the DOM by calling its `attach` method and passing the DOM
         * node which should be used as the parent of the widget's node.
         */
        var Widget = (function (_super) {
            __extends(Widget, _super);
            /**
             * Construct a new widget.
             */
            function Widget() {
                _super.call(this);
                this._x = 0;
                this._y = 0;
                this._width = 0;
                this._height = 0;
                this._wflags = 0;
                this._layout = null;
                this._parent = null;
                this._children = [];
                this._boxSizing = null;
                this._sizePolicy = defaultSizePolicy;
                this.addClass(WIDGET_CLASS);
            }
            /**
             * Dispose of the widget and its descendants.
             */
            Widget.prototype.dispose = function () {
                this.setFlag(widgets.WidgetFlag.IsDisposed);
                this.disposed.emit(void 0);
                clearSignalData(this);
                clearMessageData(this);
                var layout = this._layout;
                if (layout) {
                    this._layout = null;
                    layout.dispose();
                }
                var parent = this._parent;
                if (parent) {
                    this._parent = null;
                    algo.remove(parent._children, this);
                    sendMessage(parent, new widgets.ChildMessage('child-removed', this));
                }
                else if (this.isAttached) {
                    this.detach();
                }
                var children = this._children;
                for (var i = 0; i < children.length; ++i) {
                    var child = children[i];
                    children[i] = null;
                    child._parent = null;
                    child.dispose();
                }
                children.length = 0;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(Widget.prototype, "x", {
                /**
                 * Get the X position set for the widget.
                 */
                get: function () {
                    return this._x;
                },
                /**
                 * Set the X position for the widget.
                 *
                 * This is equivalent to `move(x, this.y)`.
                 */
                set: function (x) {
                    this.move(x, this._y);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "y", {
                /**
                 * Get the Y position set for the widget.
                 */
                get: function () {
                    return this._y;
                },
                /**
                 * Set the Y position for the widget.
                 *
                 * This is equivalent to `move(this.x, y)`.
                 */
                set: function (y) {
                    this.move(this._x, y);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "width", {
                /**
                 * Get the width set for the widget.
                 */
                get: function () {
                    return this._width;
                },
                /**
                 * Set the width for the widget.
                 *
                 * This is equivalent to `resize(width, this.height)`.
                 */
                set: function (width) {
                    this.resize(width, this._height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "height", {
                /**
                 * Get the height set for the widget.
                 */
                get: function () {
                    return this._height;
                },
                /**
                 * Set the height for the widget.
                 *
                 * This is equivalent to `resize(this.width, height)`.
                 */
                set: function (height) {
                    this.resize(this._width, height);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "horizontalSizePolicy", {
                /**
                 * Get the horizontal size policy for the widget.
                 */
                get: function () {
                    return this._sizePolicy >> 16;
                },
                /**
                 * Set the horizontal size policy for the widget.
                 *
                 * This is equivalent to `setSizePolicy(policy, this.verticalSizePolicy)`.
                 */
                set: function (policy) {
                    this.setSizePolicy(policy, this.verticalSizePolicy);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "verticalSizePolicy", {
                /**
                 * Get the vertical size policy for the widget.
                 */
                get: function () {
                    return this._sizePolicy & 0xFFFF;
                },
                /**
                 * Set the vertical size policy for the widget.
                 *
                 * This is equivalent to `setSizePolicy(this.horizontalPolicy, policy)`.
                 */
                set: function (policy) {
                    this.setSizePolicy(this.horizontalSizePolicy, policy);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "boxSizing", {
                /**
                 * Get the CSS box sizing for the widget.
                 *
                 * This method computes the data once, then caches it. The cached
                 * data can be cleared by calling the `invalidateBoxSizing` method.
                 */
                get: function () {
                    if (!this._boxSizing) {
                        this._boxSizing = createBoxSizing(this.node);
                    }
                    return this._boxSizing;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "isAttached", {
                /**
                 * Test whether the widget's node is attached to the DOM.
                 */
                get: function () {
                    return this.testFlag(widgets.WidgetFlag.IsAttached);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "isDisposed", {
                /**
                 * Test whether the widget has been disposed.
                 */
                get: function () {
                    return this.testFlag(widgets.WidgetFlag.IsDisposed);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "isHidden", {
                /**
                 * Test whether the widget is explicitly hidden.
                 */
                get: function () {
                    return this.testFlag(widgets.WidgetFlag.IsHidden);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "isVisible", {
                /**
                 * Test whether the widget is visible.
                 *
                 * A widget is visible under the following conditions:
                 *   - it is attached to the DOM
                 *   - it is not explicitly hidden
                 *   - it has no explicitly hidden ancestors
                 */
                get: function () {
                    return this.testFlag(widgets.WidgetFlag.IsVisible);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "layout", {
                /**
                 * Get the layout manager attached to the widget.
                 *
                 * Returns null if the widget has no layout manager.
                 */
                get: function () {
                    return this._layout;
                },
                /**
                 * Set the layout manager for the widget.
                 *
                 * A layout is single-use only. The current layout can be set to null
                 * or to a new layout instance, but not to a layout which is already
                 * installed on another widget.
                 *
                 * The current layout will be disposed and cannot be reused.
                 */
                set: function (layout) {
                    layout = layout || null;
                    var oldLayout = this._layout;
                    if (oldLayout === layout) {
                        return;
                    }
                    if (this.testFlag(widgets.WidgetFlag.DisallowLayoutChange)) {
                        throw new Error('cannot change widget layout');
                    }
                    if (layout && layout.parent) {
                        throw new Error('layout already installed on a widget');
                    }
                    if (oldLayout) {
                        this._layout = null;
                        removeMessageFilter(this, oldLayout);
                        oldLayout.dispose();
                    }
                    if (layout) {
                        this._layout = layout;
                        installMessageFilter(this, layout);
                        layout.parent = this;
                    }
                    sendMessage(this, MSG_LAYOUT_CHANGED);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "parent", {
                /**
                 * Get the parent of the widget.
                 *
                 * Returns null if the widget has no parent.
                 */
                get: function () {
                    return this._parent;
                },
                /**
                 * Set the parent of the widget.
                 *
                 * Setting the parent to null will detach the widget from the DOM
                 * and automatically remove it from the relevant layout manager.
                 */
                set: function (parent) {
                    parent = parent || null;
                    var oldParent = this._parent;
                    if (oldParent === parent) {
                        return;
                    }
                    if (oldParent) {
                        this._parent = null;
                        algo.remove(oldParent._children, this);
                        sendMessage(oldParent, new widgets.ChildMessage('child-removed', this));
                    }
                    if (parent) {
                        this._parent = parent;
                        parent._children.push(this);
                        sendMessage(parent, new widgets.ChildMessage('child-added', this));
                    }
                    sendMessage(this, MSG_PARENT_CHANGED);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Widget.prototype, "childCount", {
                /**
                 * Get the number of children in the widget.
                 */
                get: function () {
                    return this._children.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the child widget at the given index.
             *
             * Returns `undefined` if the index is out of range.
             */
            Widget.prototype.childAt = function (index) {
                return this._children[index];
            };
            /**
             * Test whether the given widget flag is set.
             */
            Widget.prototype.testFlag = function (flag) {
                return (this._wflags & flag) !== 0;
            };
            /**
             * Set the given widget flag.
             */
            Widget.prototype.setFlag = function (flag) {
                this._wflags |= flag;
            };
            /**
             * Clear the given widget flag.
             */
            Widget.prototype.clearFlag = function (flag) {
                this._wflags &= ~flag;
            };
            /**
             * Make the widget visible to its parent.
             *
             * If the widget is not explicitly hidden, this is a no-op.
             */
            Widget.prototype.show = function () {
                if (!this.isHidden) {
                    return;
                }
                var parent = this._parent;
                if (this.isAttached && (!parent || parent.isVisible)) {
                    beforeShowHelper(this);
                    this.removeClass(HIDDEN_CLASS);
                    this.clearFlag(widgets.WidgetFlag.IsHidden);
                    afterShowHelper(this);
                }
                else {
                    this.removeClass(HIDDEN_CLASS);
                    this.clearFlag(widgets.WidgetFlag.IsHidden);
                }
                if (parent) {
                    sendMessage(parent, new widgets.ChildMessage('child-shown', this));
                }
                this.updateGeometry();
            };
            /**
             * Make the widget invisible to its parent.
             *
             * If the widget is already hidden, this is a no-op.
             */
            Widget.prototype.hide = function () {
                if (this.isHidden) {
                    return;
                }
                var parent = this._parent;
                if (this.isAttached && (!parent || parent.isVisible)) {
                    beforeHideHelper(this);
                    this.addClass(HIDDEN_CLASS);
                    this.setFlag(widgets.WidgetFlag.IsHidden);
                    afterHideHelper(this);
                }
                else {
                    this.addClass(HIDDEN_CLASS);
                    this.setFlag(widgets.WidgetFlag.IsHidden);
                }
                if (parent) {
                    sendMessage(parent, new widgets.ChildMessage('child-hidden', this));
                }
                this.updateGeometry(true);
            };
            /**
             * Show or hide the widget according to the given flag.
             */
            Widget.prototype.setVisible = function (visible) {
                if (visible) {
                    this.show();
                }
                else {
                    this.hide();
                }
            };
            /**
             * Close the widget by sending it a 'close' message.
             *
             * Subclasses should reimplement `onClose` to perform custom actions.
             */
            Widget.prototype.close = function () {
                sendMessage(this, MSG_CLOSE);
            };
            /**
             * Attach the widget's node to a host DOM element.
             *
             * The `fit` method can be called to resize the widget to fill its
             * host node. It should be called whenever the size of host node is
             * known to have changed.
             *
             * Only a root widget can be attached to a host node.
             */
            Widget.prototype.attach = function (host) {
                if (this._parent) {
                    throw new Error('cannot attach a non-root widget to the DOM');
                }
                beforeAttachHelper(this);
                host.appendChild(this.node);
                afterAttachHelper(this);
            };
            /**
             * Detach the widget's node from the DOM.
             *
             * Only a root widget can be detached from its host node.
             */
            Widget.prototype.detach = function () {
                if (this._parent) {
                    throw new Error('cannot dettach a non-root widget from the DOM');
                }
                var host = this.node.parentNode;
                if (!host) {
                    return;
                }
                beforeDetachHelper(this);
                host.removeChild(this.node);
                afterDetachHelper(this);
            };
            /**
             * Resize the widget so that it fills its host node.
             *
             * Only a root widget can be fit to its host.
             *
             * If the size of the host node is known, it can be provided. This
             * will prevent a DOM geometry read and avoid a potential reflow.
             */
            Widget.prototype.fit = function (width, height, box) {
                if (this._parent) {
                    throw new Error('cannot fit a non-root widget');
                }
                var host = this.node.parentNode;
                if (!host) {
                    return;
                }
                if (width === void 0) {
                    width = host.offsetWidth;
                }
                if (height === void 0) {
                    height = host.offsetHeight;
                }
                if (box === void 0) {
                    box = createBoxSizing(host);
                }
                var x = box.paddingLeft;
                var y = box.paddingTop;
                var w = width - box.horizontalSum;
                var h = height - box.verticalSum;
                this.setGeometry(x, y, w, h);
            };
            /**
             * Calculate the preferred size for the widget.
             *
             * This is used by Phosphor's layout machinery to compute the natural
             * space required for the widget and its children. A subclass which
             * provides leaf content should reimplement this method.
             *
             * The default implementation of this method delegates to the layout
             * manager if installed, otherwise it returns a zero size.
             */
            Widget.prototype.sizeHint = function () {
                if (this._layout) {
                    return this._layout.sizeHint();
                }
                return Size.Zero;
            };
            /**
             * Calculate the preferred minimum size for the widget.
             *
             * This is used by Phosphor's layout machinery to compute the minimum
             * space required for the widget and its children. This is independent
             * of and subordinate to the minimum size specified in CSS. User code
             * will not typically interact with this method.
             *
             * The default implementation of this method delegates to the layout
             * manager if installed, otherwise it returns a zero size.
             */
            Widget.prototype.minSizeHint = function () {
                if (this._layout) {
                    return this._layout.minSize();
                }
                return Size.Zero;
            };
            /**
             * Calculate the preferred maximum size for the widget.
             *
             * This is used by Phosphor's layout machinery to compute the maximum
             * space allowed for the widget and its children. This is independent
             * of and subordinate to the maximum size specified in CSS. User code
             * will not typically interact with this method.
             *
             * The default implementation of this method delegates to the layout
             * manager if installed, otherwise it returns an infinite size.
             */
            Widget.prototype.maxSizeHint = function () {
                if (this._layout) {
                    return this._layout.maxSize();
                }
                return Size.Infinite;
            };
            /**
             * Invalidate the cached CSS box sizing for the widget.
             *
             * User code should invoke this method when it makes a change to the
             * node's style which changes its border, padding, or size limits.
             */
            Widget.prototype.invalidateBoxSizing = function () {
                this._boxSizing = null;
                if (this._layout) {
                    this._layout.invalidate();
                }
                else {
                    postMessage(this, MSG_LAYOUT_REQUEST);
                }
                this.updateGeometry();
            };
            /**
             * Notify the layout system that the widget's geometry is dirty.
             *
             * This is typically called automatically at the proper times, but
             * a custom leaf widget should call this method when its size hint
             * changes so that the ancestor layout will refresh.
             *
             * If the `force` flag is false and the widget is explicitly hidden,
             * this is a no-op. The geometry will update automatically when the
             * widget is made visible.
             */
            Widget.prototype.updateGeometry = function (force) {
                if (force === void 0) { force = false; }
                var parent = this._parent;
                if (!parent || (this.isHidden && !force)) {
                    return;
                }
                if (parent._layout) {
                    parent._layout.invalidate();
                }
                else {
                    postMessage(parent, MSG_LAYOUT_REQUEST);
                    parent.updateGeometry();
                }
            };
            /**
             * Schedule an update for the widget.
             *
             * If the `immediate` flag is false (the default) the update will be
             * scheduled for the next cycle of the event loop. If `immediate` is
             * true, the widget will be updated immediately. Multiple pending
             * requests are collapsed into a single update.
             *
             * #### Notes
             * The semantics of an update are defined by a supporting widget.
             */
            Widget.prototype.update = function (immediate) {
                if (immediate === void 0) { immediate = false; }
                if (immediate) {
                    sendMessage(this, MSG_UPDATE_REQUEST);
                }
                else {
                    postMessage(this, MSG_UPDATE_REQUEST);
                }
            };
            /**
             * Move the widget to the specified X-Y coordinate.
             */
            Widget.prototype.move = function (x, y) {
                this.setGeometry(x, y, this._width, this._height);
            };
            /**
             * Resize the widget to the specified width and height.
             */
            Widget.prototype.resize = function (width, height) {
                this.setGeometry(this._x, this._y, width, height);
            };
            /**
             * Set the position and size of the widget.
             *
             * The size is clipped to the limits specified by the node's style.
             *
             * This method will send 'move' and 'resize' messages to the widget if
             * the new geometry changes the position or size of the widget's node.
             */
            Widget.prototype.setGeometry = function (x, y, width, height) {
                var isMove = false;
                var isResize = false;
                var oldX = this._x;
                var oldY = this._y;
                var oldW = this._width;
                var oldH = this._height;
                var box = this.boxSizing;
                var style = this.node.style;
                var w = Math.max(box.minWidth, Math.min(width, box.maxWidth));
                var h = Math.max(box.minHeight, Math.min(height, box.maxHeight));
                if (oldX !== x) {
                    this._x = x;
                    style.left = x + 'px';
                    isMove = true;
                }
                if (oldY !== y) {
                    this._y = y;
                    style.top = y + 'px';
                    isMove = true;
                }
                if (oldW !== w) {
                    this._width = w;
                    style.width = w + 'px';
                    isResize = true;
                }
                if (oldH !== h) {
                    this._height = h;
                    style.height = h + 'px';
                    isResize = true;
                }
                if (isMove) {
                    sendMessage(this, new widgets.MoveMessage(oldX, oldY, x, y));
                }
                if (isResize) {
                    sendMessage(this, new widgets.ResizeMessage(oldW, oldH, w, h));
                }
            };
            /**
             * Set the size policy for the widget.
             */
            Widget.prototype.setSizePolicy = function (horizontal, vertical) {
                var policy = (horizontal << 16) | vertical;
                if (policy !== this._sizePolicy) {
                    this._sizePolicy = policy;
                    this.updateGeometry();
                }
            };
            /**
             * Process a message sent to the widget.
             *
             * This implements the IMessageHandler interface.
             *
             * Subclasses may reimplement this method as needed.
             */
            Widget.prototype.processMessage = function (msg) {
                switch (msg.type) {
                    case 'move':
                        this.onMove(msg);
                        break;
                    case 'resize':
                        this.onResize(msg);
                        break;
                    case 'update-request':
                        this.onUpdateRequest(msg);
                        break;
                    case 'child-added':
                        this.onChildAdded(msg);
                        break;
                    case 'child-removed':
                        this.onChildRemoved(msg);
                        break;
                    case 'before-show':
                        this.onBeforeShow(msg);
                        break;
                    case 'after-show':
                        this.onAfterShow(msg);
                        break;
                    case 'before-hide':
                        this.onBeforeHide(msg);
                        break;
                    case 'after-hide':
                        this.onAfterHide(msg);
                        break;
                    case 'before-attach':
                        this._boxSizing = null;
                        this.onBeforeAttach(msg);
                        break;
                    case 'after-attach':
                        this.onAfterAttach(msg);
                        break;
                    case 'before-detach':
                        this.onBeforeDetach(msg);
                        break;
                    case 'after-detach':
                        this.onAfterDetach(msg);
                        break;
                    case 'close':
                        this.onClose(msg);
                        break;
                }
            };
            /**
             * Compress a message posted to the widget.
             *
             * This implements the IMessageHandler interface.
             *
             * Subclasses may reimplement this method as needed.
             */
            Widget.prototype.compressMessage = function (msg, pending) {
                if (msg.type === 'layout-request' || msg.type === 'update-request') {
                    return pending.some(function (other) { return other.type === msg.type; });
                }
                return false;
            };
            /**
             * A method invoked when a 'close' message is received.
             *
             * The default implementation sets the parent to null.
             */
            Widget.prototype.onClose = function (msg) {
                this.parent = null;
            };
            /**
             * A method invoked when a 'child-added' message is received.
             *
             * The default implementation appends the child node to the DOM.
             */
            Widget.prototype.onChildAdded = function (msg) {
                var child = msg.child;
                if (this.isAttached) {
                    beforeAttachHelper(child);
                    this.node.appendChild(child.node);
                    afterAttachHelper(child);
                }
                else {
                    this.node.appendChild(child.node);
                }
            };
            /**
             * A method invoked when a 'child-removed' message is received.
             *
             * The default implementation removes the child node from the DOM.
             */
            Widget.prototype.onChildRemoved = function (msg) {
                var child = msg.child;
                if (this.isAttached) {
                    beforeDetachHelper(child);
                    this.node.removeChild(child.node);
                    afterDetachHelper(child);
                }
                else {
                    this.node.removeChild(child.node);
                }
            };
            /**
             * A method invoked when a 'move' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onMove = function (msg) { };
            /**
             * A method invoked when a 'resize' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onResize = function (msg) { };
            /**
             * A method invoked on an 'update-request' message.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onUpdateRequest = function (msg) { };
            /**
             * A method invoked when a 'before-show' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onBeforeShow = function (msg) { };
            /**
             * A method invoked when an 'after-show' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onAfterShow = function (msg) { };
            /**
             * A method invoked when a 'before-hide' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onBeforeHide = function (msg) { };
            /**
             * A method invoked when an 'after-hide' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onAfterHide = function (msg) { };
            /**
             * A method invoked when a 'before-attach' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onBeforeAttach = function (msg) { };
            /**
             * A method invoked when an 'after-attach' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onAfterAttach = function (msg) { };
            /**
             * A method invoked when a 'before-detach' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onBeforeDetach = function (msg) { };
            /**
             * A method invoked when an 'after-detach' message is received.
             *
             * The default implementation is a no-op.
             */
            Widget.prototype.onAfterDetach = function (msg) { };
            __decorate([
                signal
            ], Widget.prototype, "disposed");
            return Widget;
        })(NodeBase);
        widgets.Widget = Widget;
        /**
         * The default widget size policy.
         */
        var defaultSizePolicy = (widgets.SizePolicy.Preferred << 16) | widgets.SizePolicy.Preferred;
        /**
         * A recursive 'before-show' helper function.
         */
        function beforeShowHelper(widget) {
            sendMessage(widget, MSG_BEFORE_SHOW);
            for (var i = 0; i < widget.childCount; ++i) {
                var child = widget.childAt(i);
                if (!child.isHidden)
                    beforeShowHelper(child);
            }
        }
        /**
         * A recursive 'after-show' helper function.
         */
        function afterShowHelper(widget) {
            widget.setFlag(widgets.WidgetFlag.IsVisible);
            sendMessage(widget, MSG_AFTER_SHOW);
            for (var i = 0; i < widget.childCount; ++i) {
                var child = widget.childAt(i);
                if (!child.isHidden)
                    afterShowHelper(child);
            }
        }
        /**
         * A recursive 'before-hide' helper function.
         */
        function beforeHideHelper(widget) {
            sendMessage(widget, MSG_BEFORE_HIDE);
            for (var i = 0; i < widget.childCount; ++i) {
                var child = widget.childAt(i);
                if (!child.isHidden)
                    beforeHideHelper(child);
            }
        }
        /**
         * A recursive 'after-hide' helper function.
         */
        function afterHideHelper(widget) {
            widget.clearFlag(widgets.WidgetFlag.IsVisible);
            sendMessage(widget, MSG_AFTER_HIDE);
            for (var i = 0; i < widget.childCount; ++i) {
                var child = widget.childAt(i);
                if (!child.isHidden)
                    afterHideHelper(child);
            }
        }
        /**
         * A recursive 'before-attach' helper function.
         */
        function beforeAttachHelper(widget) {
            sendMessage(widget, MSG_BEFORE_ATTACH);
            for (var i = 0; i < widget.childCount; ++i) {
                beforeAttachHelper(widget.childAt(i));
            }
        }
        /**
         * A recursive 'after-attach' helper function.
         */
        function afterAttachHelper(widget) {
            var parent = widget.parent;
            if (!widget.isHidden && (!parent || parent.isVisible)) {
                widget.setFlag(widgets.WidgetFlag.IsVisible);
            }
            widget.setFlag(widgets.WidgetFlag.IsAttached);
            sendMessage(widget, MSG_AFTER_ATTACH);
            for (var i = 0; i < widget.childCount; ++i) {
                afterAttachHelper(widget.childAt(i));
            }
        }
        /**
         * A recursive 'before-detach' helper function.
         */
        function beforeDetachHelper(widget) {
            sendMessage(widget, MSG_BEFORE_DETACH);
            for (var i = 0; i < widget.childCount; ++i) {
                beforeDetachHelper(widget.childAt(i));
            }
        }
        /**
         * A recursive 'after-detach' helper function.
         */
        function afterDetachHelper(widget) {
            widget.clearFlag(widgets.WidgetFlag.IsVisible);
            widget.clearFlag(widgets.WidgetFlag.IsAttached);
            sendMessage(widget, MSG_AFTER_DETACH);
            for (var i = 0; i < widget.childCount; ++i) {
                afterDetachHelper(widget.childAt(i));
            }
        }
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * A widget which delegates to a permanently installed layout.
         *
         * This is used as a base class for common panel widgets.
         */
        var Panel = (function (_super) {
            __extends(Panel, _super);
            /**
             * Construct a new panel.
             */
            function Panel(layout) {
                _super.call(this);
                this.layout = layout;
                this.setFlag(widgets.WidgetFlag.DisallowLayoutChange);
            }
            Object.defineProperty(Panel.prototype, "count", {
                /**
                 * Get the number of items (widgets + spacers) in the panel.
                 */
                get: function () {
                    return this.layout.count;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the index of the given widget.
             *
             * Returns -1 if the widget is not found.
             */
            Panel.prototype.indexOf = function (widget) {
                return this.layout.indexOf(widget);
            };
            /**
             * Get the widget at the given index.
             *
             * Returns `undefined` if there is no widget at the given index.
             */
            Panel.prototype.widgetAt = function (index) {
                return this.layout.widgetAt(index);
            };
            /**
             * Get the alignment for the given widget.
             *
             * Returns 0 if the widget is not found in the panel.
             */
            Panel.prototype.alignment = function (widget) {
                return this.layout.alignment(widget);
            };
            /**
             * Set the alignment for the given widget.
             *
             * Returns true if the alignment was updated, false otherwise.
             */
            Panel.prototype.setAlignment = function (widget, alignment) {
                return this.layout.setAlignment(widget, alignment);
            };
            return Panel;
        })(widgets.Widget);
        widgets.Panel = Panel;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        /**
         * The class name added to BoxPanel instances.
         */
        var BOX_PANEL_CLASS = 'p-BoxPanel';
        /**
         * A panel which arranges its children in a row or column.
         */
        var BoxPanel = (function (_super) {
            __extends(BoxPanel, _super);
            /**
             * Construct a new box panel.
             */
            function BoxPanel(direction, spacing) {
                if (direction === void 0) { direction = widgets.Direction.TopToBottom; }
                if (spacing === void 0) { spacing = 8; }
                _super.call(this, new widgets.BoxLayout(direction, spacing));
                this.addClass(BOX_PANEL_CLASS);
            }
            Object.defineProperty(BoxPanel.prototype, "direction", {
                /**
                 * Get the layout direction for the panel.
                 */
                get: function () {
                    return this.layout.direction;
                },
                /**
                 * Set the layout direction for the panel.
                 */
                set: function (direction) {
                    this.layout.direction = direction;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BoxPanel.prototype, "spacing", {
                /**
                 * Get the inter-element fixed spacing for the panel.
                 */
                get: function () {
                    return this.layout.spacing;
                },
                /**
                 * Set the inter-element fixed spacing for the panel.
                 */
                set: function (spacing) {
                    this.layout.spacing = spacing;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Add a child widget to the end of the panel.
             *
             * If the widget already exists in the panel, it will be moved.
             *
             * Returns the index of the added widget.
             */
            BoxPanel.prototype.addWidget = function (widget, stretch, alignment) {
                return this.layout.addWidget(widget, stretch, alignment);
            };
            /**
             * Insert a child widget into the panel at the given index.
             *
             * If the widget already exists in the panel, it will be moved.
             *
             * Returns the index of the added widget.
             */
            BoxPanel.prototype.insertWidget = function (index, widget, stretch, alignment) {
                return this.layout.insertWidget(index, widget, stretch, alignment);
            };
            /**
             * Add a fixed amount of spacing to the end of the panel.
             *
             * Returns the index of the added space.
             */
            BoxPanel.prototype.addSpacing = function (size) {
                return this.layout.addSpacing(size);
            };
            /**
             * Insert a fixed amount of spacing at the given index.
             *
             * Returns the index of the added space.
             */
            BoxPanel.prototype.insertSpacing = function (index, size) {
                return this.layout.insertSpacing(index, size);
            };
            /**
             * Add stretchable space to the end of the panel.
             *
             * Returns the index of the added space.
             */
            BoxPanel.prototype.addStretch = function (stretch) {
                return this.layout.addStretch(stretch);
            };
            /**
             * Insert stretchable space at the given index.
             *
             * Returns the index of the added space.
             */
            BoxPanel.prototype.insertStretch = function (index, stretch) {
                return this.layout.insertStretch(index, stretch);
            };
            /**
             * Get the stretch factor for the given widget or index.
             *
             * Returns -1 if the given widget or index is invalid.
             */
            BoxPanel.prototype.stretch = function (which) {
                return this.layout.stretch(which);
            };
            /**
             * Set the stretch factor for the given widget or index.
             *
             * Returns true if the stretch was updated, false otherwise.
             */
            BoxPanel.prototype.setStretch = function (which, stretch) {
                return this.layout.setStretch(which, stretch);
            };
            return BoxPanel;
        })(widgets.Panel);
        widgets.BoxPanel = BoxPanel;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var overrideCursor = phosphor.utility.overrideCursor;
        /**
         * The class name added to SplitPanel instances.
         */
        var SPLIT_PANEL_CLASS = 'p-SplitPanel';
        /**
         * A panel which arranges its children into resizable sections.
         */
        var SplitPanel = (function (_super) {
            __extends(SplitPanel, _super);
            /**
             * Construct a new split panel.
             */
            function SplitPanel(orientation) {
                if (orientation === void 0) { orientation = widgets.Orientation.Horizontal; }
                _super.call(this, new widgets.SplitLayout(orientation));
                this._pressData = null;
                this.addClass(SPLIT_PANEL_CLASS);
            }
            /**
             * Dispose of the resources held by the panel.
             */
            SplitPanel.prototype.dispose = function () {
                this._releaseMouse();
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(SplitPanel.prototype, "orientation", {
                /**
                 * Get the orientation of the split panel.
                 */
                get: function () {
                    return this.layout.orientation;
                },
                /**
                 * Set the orientation of the split panel.
                 */
                set: function (orientation) {
                    this.layout.orientation = orientation;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SplitPanel.prototype, "handleSize", {
                /**
                 * Get the size of the split handles.
                 */
                get: function () {
                    return this.layout.handleSize;
                },
                /**
                 * Set the the size of the split handles.
                 */
                set: function (size) {
                    this.layout.handleSize = size;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the normalized sizes of the widgets in the split panel.
             */
            SplitPanel.prototype.sizes = function () {
                return this.layout.sizes();
            };
            /**
             * Set the relative sizes for the split panel widgets.
             *
             * Extra values are ignored, too few will yield an undefined layout.
             */
            SplitPanel.prototype.setSizes = function (sizes) {
                this.layout.setSizes(sizes);
            };
            /**
             * Add a child widget to the end of the split panel.
             *
             * If the widget already exists in the panel, it will be moved.
             *
             * Returns the index of the added widget.
             */
            SplitPanel.prototype.addWidget = function (widget, stretch, alignment) {
                return this.layout.addWidget(widget, stretch, alignment);
            };
            /**
             * Insert a child widget into the split panel at the given index.
             *
             * If the widget already exists in the panel, it will be moved.
             *
             * Returns the index of the added widget.
             */
            SplitPanel.prototype.insertWidget = function (index, widget, stretch, alignment) {
                return this.layout.insertWidget(index, widget, stretch, alignment);
            };
            /**
             * Get the stretch factor for the given widget or index.
             *
             * Returns -1 if the given widget or index is invalid.
             */
            SplitPanel.prototype.stretch = function (which) {
                return this.layout.stretch(which);
            };
            /**
             * Set the stretch factor for the given widget or index.
             *
             * Returns true if the stretch was updated, false otherwise.
             */
            SplitPanel.prototype.setStretch = function (which, stretch) {
                return this.layout.setStretch(which, stretch);
            };
            /**
             * Handle the DOM events for the split panel.
             */
            SplitPanel.prototype.handleEvent = function (event) {
                switch (event.type) {
                    case 'mousedown':
                        this._evtMouseDown(event);
                        break;
                    case 'mouseup':
                        this._evtMouseUp(event);
                        break;
                    case 'mousemove':
                        this._evtMouseMove(event);
                        break;
                }
            };
            /**
             * A method invoked after the node is attached to the DOM.
             */
            SplitPanel.prototype.onAfterAttach = function (msg) {
                this.node.addEventListener('mousedown', this);
            };
            /**
             * A method invoked after the node is detached from the DOM.
             */
            SplitPanel.prototype.onAfterDetach = function (msg) {
                this.node.removeEventListener('mousedown', this);
            };
            /**
             * Handle the 'mousedown' event for the split panel.
             */
            SplitPanel.prototype._evtMouseDown = function (event) {
                if (event.button !== 0) {
                    return;
                }
                var data = this._findHandle(event.target);
                if (!data) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                document.addEventListener('mouseup', this, true);
                document.addEventListener('mousemove', this, true);
                var delta;
                var node = data.handle.node;
                var rect = node.getBoundingClientRect();
                if (this.orientation === widgets.Orientation.Horizontal) {
                    delta = event.clientX - rect.left;
                }
                else {
                    delta = event.clientY - rect.top;
                }
                var cursor = overrideCursor(window.getComputedStyle(node).cursor);
                this._pressData = { index: data.index, delta: delta, cursor: cursor };
            };
            /**
             * Handle the 'mouseup' event for the split panel.
             */
            SplitPanel.prototype._evtMouseUp = function (event) {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                this._releaseMouse();
            };
            /**
             * Handle the 'mousemove' event for the split panel.
             */
            SplitPanel.prototype._evtMouseMove = function (event) {
                event.preventDefault();
                event.stopPropagation();
                var pos;
                var data = this._pressData;
                var layout = this.layout;
                var rect = this.node.getBoundingClientRect();
                if (layout.orientation === widgets.Orientation.Horizontal) {
                    pos = event.clientX - data.delta - rect.left;
                }
                else {
                    pos = event.clientY - data.delta - rect.top;
                }
                layout.moveHandle(data.index, pos);
            };
            /**
             * Find the index of the handle which contains a target element.
             */
            SplitPanel.prototype._findHandle = function (target) {
                var layout = this.layout;
                for (var i = 0, n = layout.count; i < n; ++i) {
                    var handle = layout.handleAt(i);
                    if (handle.node.contains(target)) {
                        return { index: i, handle: handle };
                    }
                }
                return null;
            };
            /**
             * Release the mouse grab for the split panel.
             */
            SplitPanel.prototype._releaseMouse = function () {
                if (!this._pressData) {
                    return;
                }
                this._pressData.cursor.dispose();
                this._pressData = null;
                document.removeEventListener('mouseup', this, true);
                document.removeEventListener('mousemove', this, true);
            };
            return SplitPanel;
        })(widgets.Panel);
        widgets.SplitPanel = SplitPanel;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var signal = phosphor.core.signal;
        /**
         * The class name added to StackedPanel instances.
         */
        var STACKED_PANEL_CLASS = 'p-StackedPanel';
        /**
         * A panel where only one child widget is visible at a time.
         */
        var StackedPanel = (function (_super) {
            __extends(StackedPanel, _super);
            /**
             * Construct a new stacked panel.
             */
            function StackedPanel() {
                _super.call(this, new widgets.StackedLayout());
                this.addClass(STACKED_PANEL_CLASS);
                var layout = this.layout;
                layout.widgetRemoved.connect(this._p_widgetRemoved, this);
            }
            Object.defineProperty(StackedPanel.prototype, "currentIndex", {
                /**
                 * Get the current index of the panel.
                 */
                get: function () {
                    return this.layout.currentIndex;
                },
                /**
                 * Set the current index of the panel.
                 */
                set: function (index) {
                    this.layout.currentIndex = index;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(StackedPanel.prototype, "currentWidget", {
                /**
                 * Get the current widget of the panel.
                 */
                get: function () {
                    return this.layout.currentWidget;
                },
                /**
                 * Set the current widget of the panel.
                 */
                set: function (widget) {
                    this.layout.currentWidget = widget;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Add a child widget to the end of the panel.
             *
             * If the widget already exists in the panel, it will be moved.
             *
             * Returns the index of the added widget.
             */
            StackedPanel.prototype.addWidget = function (widget, alignment) {
                return this.layout.addWidget(widget, alignment);
            };
            /**
             * Insert a child widget into the panel at the given index.
             *
             * If the widget already exists in the panel, it will be moved.
             *
             * Returns the index of the added widget.
             */
            StackedPanel.prototype.insertWidget = function (index, widget, alignment) {
                return this.layout.insertWidget(index, widget, alignment);
            };
            /**
             * Move a child widget from one index to another.
             *
             * This method is more efficient for moving a widget than calling
             * `insertWidget` for an already added widget. It will not remove
             * the widget before moving it and will not emit `widgetRemoved`.
             *
             * Returns -1 if `fromIndex` is out of range.
             */
            StackedPanel.prototype.moveWidget = function (fromIndex, toIndex) {
                return this.layout.moveWidget(fromIndex, toIndex);
            };
            /**
             * Handle the `widgetRemoved` signal for the stacked layout.
             */
            StackedPanel.prototype._p_widgetRemoved = function (args) {
                this.widgetRemoved.emit(args);
            };
            __decorate([
                signal
            ], StackedPanel.prototype, "widgetRemoved");
            return StackedPanel;
        })(widgets.Panel);
        widgets.StackedPanel = StackedPanel;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var algo = phosphor.collections.algorithm;
        var sender = phosphor.core.sender;
        var hitTest = phosphor.utility.hitTest;
        var overrideCursor = phosphor.utility.overrideCursor;
        /**
         * The class name added to DockArea instances.
         */
        var DOCK_AREA_CLASS = 'p-DockArea';
        /**
         * The class name added to DockSplitter instances.
         */
        var DOCK_SPLITTER_CLASS = 'p-DockSplitter';
        /**
         * The class name added to DockPanel instances.
         */
        var DOCK_PANEL_CLASS = 'p-DockPanel';
        /**
         * The class name added to the DockPanel overlay div.
         */
        var OVERLAY_CLASS = 'p-DockPanel-overlay';
        /**
         * The class name added to floating tabs.
         */
        var FLOATING_CLASS = 'p-mod-floating';
        /**
         * A widget which provides a flexible docking layout area for widgets.
         */
        var DockArea = (function (_super) {
            __extends(DockArea, _super);
            /**
             * Construct a new dock area.
             */
            function DockArea() {
                _super.call(this);
                this._handleSize = 3;
                this._tabWidth = 175;
                this._tabOverlap = 0;
                this._minTabWidth = 45;
                this._ignoreRemoved = false;
                this._root = null;
                this._dragData = null;
                this._items = [];
                this.addClass(DOCK_AREA_CLASS);
                this._root = this._createSplitter(widgets.Orientation.Horizontal);
                var layout = new widgets.BoxLayout(widgets.Direction.TopToBottom, 0);
                layout.addWidget(this._root);
                this.layout = layout;
                this.setFlag(widgets.WidgetFlag.DisallowLayoutChange);
            }
            /**
             * Dispose of the resources held by the widget.
             */
            DockArea.prototype.dispose = function () {
                this._abortDrag();
                this._root = null;
                this._items = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(DockArea.prototype, "tabWidth", {
                /**
                 * Get the width of the tabs in the dock area.
                 */
                get: function () {
                    return this._tabWidth;
                },
                /**
                 * Get the width of the tabs in the dock area.
                 */
                set: function (width) {
                    width = Math.max(0, width);
                    if (width === this._tabWidth) {
                        return;
                    }
                    this._tabWidth = width;
                    iterPanels(this._root, function (panel) {
                        panel.tabBar.tabWidth = width;
                    });
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DockArea.prototype, "minTabWidth", {
                /**
                 * Get the minimum tab width in pixels.
                 */
                get: function () {
                    return this._minTabWidth;
                },
                /**
                 * Set the minimum tab width in pixels.
                 */
                set: function (width) {
                    width = Math.max(0, width);
                    if (width === this._minTabWidth) {
                        return;
                    }
                    this._minTabWidth = width;
                    iterPanels(this._root, function (panel) {
                        panel.tabBar.minTabWidth = width;
                    });
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DockArea.prototype, "tabOverlap", {
                /**
                 * Get the tab overlap amount in pixels.
                 */
                get: function () {
                    return this._tabOverlap;
                },
                /**
                 * Set the tab overlap amount in pixels.
                 */
                set: function (overlap) {
                    if (overlap === this._tabOverlap) {
                        return;
                    }
                    this._tabOverlap = overlap;
                    iterPanels(this._root, function (panel) {
                        panel.tabBar.tabOverlap = overlap;
                    });
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DockArea.prototype, "handleSize", {
                /**
                 * Get the handle size of the dock splitters.
                 */
                get: function () {
                    return this._handleSize;
                },
                /**
                 * Set the handle size of the dock splitters.
                 */
                set: function (size) {
                    if (size === this._handleSize) {
                        return;
                    }
                    this._handleSize = size;
                    iterSplitters(this._root, function (splitter) {
                        splitter.handleSize = size;
                    });
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Add a widget to the dock area.
             *
             * The widget is positioned in the area according to the given dock
             * mode and reference widget. If the dock widget is already added to
             * the area, it will be moved to the new location.
             *
             * The default mode inserts the widget on the left side of the area.
             */
            DockArea.prototype.addWidget = function (widget, mode, ref) {
                switch (mode) {
                    case widgets.DockMode.Top:
                        this._addWidget(widget, widgets.Orientation.Vertical, false);
                        break;
                    case widgets.DockMode.Left:
                        this._addWidget(widget, widgets.Orientation.Horizontal, false);
                        break;
                    case widgets.DockMode.Right:
                        this._addWidget(widget, widgets.Orientation.Horizontal, true);
                        break;
                    case widgets.DockMode.Bottom:
                        this._addWidget(widget, widgets.Orientation.Vertical, true);
                        break;
                    case widgets.DockMode.SplitTop:
                        this._splitWidget(widget, ref, widgets.Orientation.Vertical, false);
                        break;
                    case widgets.DockMode.SplitLeft:
                        this._splitWidget(widget, ref, widgets.Orientation.Horizontal, false);
                        break;
                    case widgets.DockMode.SplitRight:
                        this._splitWidget(widget, ref, widgets.Orientation.Horizontal, true);
                        break;
                    case widgets.DockMode.SplitBottom:
                        this._splitWidget(widget, ref, widgets.Orientation.Vertical, true);
                        break;
                    case widgets.DockMode.TabBefore:
                        this._tabifyWidget(widget, ref, false);
                        break;
                    case widgets.DockMode.TabAfter:
                        this._tabifyWidget(widget, ref, true);
                        break;
                    default:
                        this._addWidget(widget, widgets.Orientation.Horizontal, false);
                        break;
                }
            };
            // /**
            //  * Ensure the given widget is activated.
            //  *
            //  * If the widget does not exist, this is a no-op.
            //  *
            //  * Returns true if the widget was activated, false otherwise.
            //  */
            // activateWidget(widget: Widget): boolean {
            //   var item = find(this._items, it => it.widget === widget);
            //   if (!item) {
            //     return false;
            //   }
            //   item.panel.tabBar.currentTab = item.widget.tab;
            //   return true;
            // }
            // /**
            //  * Get an array of the active widgets in the dock area.
            //  */
            // activeWidgets(): Widget[] {
            //   var result: Widget[] = [];
            //   iterPanels(this._root, panel => {
            //     var current = panel.stackPanel.currentPanel;
            //     if (current) result.push(current);
            //   });
            //   return result;
            // }
            /**
             * Handle the DOM events for the dock area.
             */
            DockArea.prototype.handleEvent = function (event) {
                switch (event.type) {
                    case 'mousemove':
                        this._evtMouseMove(event);
                        break;
                    case 'mouseup':
                        this._evtMouseUp(event);
                        break;
                    case 'contextmenu':
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                }
            };
            /**
             * Handle the 'mousemove' event for the dock area.
             *
             * This is triggered on the document during a tab move operation.
             */
            DockArea.prototype._evtMouseMove = function (event) {
                event.preventDefault();
                event.stopPropagation();
                var dragData = this._dragData;
                if (!dragData) {
                    return;
                }
                // Hit test the panels using the current mouse position.
                var clientX = event.clientX;
                var clientY = event.clientY;
                var hitPanel = iterPanels(this._root, function (p) {
                    return hitTest(p.node, clientX, clientY) ? p : void 0;
                });
                // If the last hit panel is not this hit panel, clear the overlay.
                if (dragData.lastHitPanel && dragData.lastHitPanel !== hitPanel) {
                    dragData.lastHitPanel.hideOverlay();
                }
                // Clear the reference to the hit panel. It will be updated again
                // if the mouse is over a panel, but not over the panel's tab bar.
                dragData.lastHitPanel = null;
                // Compute the new X and Y tab coordinates.
                var x = clientX - dragData.offsetX;
                var y = clientY - dragData.offsetY;
                // If the mouse is not over a dock panel, simply update the tab.
                var item = dragData.item;
                var itemTab = item.widget.tab;
                var tabStyle = itemTab.node.style;
                if (!hitPanel) {
                    tabStyle.left = x + 'px';
                    tabStyle.top = y + 'px';
                    return;
                }
                // Handle the case where the mouse is not over a tab bar. This
                // saves a reference to the hit panel so that its overlay can be
                // hidden once the mouse leaves the area, and shows the overlay
                // provided that the split target is not the current widget.
                if (!hitTest(hitPanel.tabBar.node, clientX, clientY)) {
                    dragData.lastHitPanel = hitPanel;
                    if (hitPanel !== item.panel || hitPanel.tabBar.count > 0) {
                        hitPanel.showOverlay(clientX, clientY);
                    }
                    tabStyle.left = x + 'px';
                    tabStyle.top = y + 'px';
                    return;
                }
                // Otherwise the mouse is positioned over a tab bar. Hide the
                // overlay before attaching the tab to the new tab bar.
                hitPanel.hideOverlay();
                // If the hit panel is not the current owner, the current hit
                // panel and tab are saved so that they can be restored later.
                if (hitPanel !== item.panel) {
                    dragData.tempPanel = hitPanel;
                    dragData.tempTab = hitPanel.tabBar.currentTab;
                }
                // Reset the tab style before attaching the tab to the tab bar.
                floatTab(itemTab, false);
                tabStyle.top = '';
                tabStyle.left = '';
                tabStyle.width = '';
                // Attach the tab to the hit tab bar.
                hitPanel.tabBar.attachTab(itemTab, clientX);
                // The tab bar takes over movement of the tab. The dock area still
                // listens for the mouseup event in order to complete the move.
                document.removeEventListener('mousemove', this, true);
            };
            /**
             * Handle the 'mouseup' event for the dock area.
             *
             * This is triggered on the document during a tab move operation.
             */
            DockArea.prototype._evtMouseUp = function (event) {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                document.removeEventListener('mouseup', this, true);
                document.removeEventListener('mousemove', this, true);
                document.removeEventListener('contextmenu', this, true);
                var dragData = this._dragData;
                if (!dragData) {
                    return;
                }
                this._dragData = null;
                // Restore the application cursor and hide the overlay.
                dragData.cursorGrab.dispose();
                if (dragData.lastHitPanel) {
                    dragData.lastHitPanel.hideOverlay();
                }
                // Fetch common variables.
                var item = dragData.item;
                var ownPanel = item.panel;
                var ownBar = ownPanel.tabBar;
                var ownCount = ownBar.count;
                var itemTab = item.widget.tab;
                // If the tab was being temporarily borrowed by another panel,
                // make that relationship permanent by moving the dock widget.
                // If the original owner panel becomes empty, it is removed.
                // Otherwise, its current index is updated to the next widget.
                // The ignoreRemoved flag is set during the widget swap since
                // the widget is not actually being removed from the area.
                if (dragData.tempPanel) {
                    this._ignoreRemoved = true;
                    item.panel = dragData.tempPanel;
                    item.panel.stackedPanel.addWidget(item.widget);
                    item.panel.stackedPanel.currentWidget = item.widget;
                    this._ignoreRemoved = false;
                    if (ownPanel.stackedPanel.count === 0) {
                        this._removePanel(ownPanel);
                    }
                    else {
                        var i = ownBar.indexOf(dragData.prevTab);
                        if (i === -1)
                            i = Math.min(dragData.index, ownCount - 1);
                        ownBar.currentIndex = i;
                    }
                    return;
                }
                // Snap the split mode before modifying the DOM with the tab insert.
                var mode = SplitMode.Invalid;
                var hitPanel = dragData.lastHitPanel;
                if (hitPanel && (hitPanel !== ownPanel || ownCount !== 0)) {
                    mode = hitPanel.splitModeAt(event.clientX, event.clientY);
                }
                // If the mouse was not released over a panel, or if the hit panel
                // is the empty owner panel, restore the tab to its position.
                var tabStyle = itemTab.node.style;
                if (mode === SplitMode.Invalid) {
                    if (ownBar.currentTab !== itemTab) {
                        floatTab(itemTab, false);
                        tabStyle.top = '';
                        tabStyle.left = '';
                        tabStyle.width = '';
                        ownBar.insertTab(dragData.index, itemTab);
                    }
                    return;
                }
                // Remove the tab from the document body and reset its style.
                document.body.removeChild(itemTab.node);
                floatTab(itemTab, false);
                tabStyle.top = '';
                tabStyle.left = '';
                tabStyle.width = '';
                // Split the target panel with the dock widget.
                var after = mode === SplitMode.Right || mode === SplitMode.Bottom;
                var horiz = mode === SplitMode.Left || mode === SplitMode.Right;
                var orientation = horiz ? widgets.Orientation.Horizontal : widgets.Orientation.Vertical;
                this._splitPanel(hitPanel, item.widget, orientation, after);
                var i = ownBar.indexOf(dragData.prevTab);
                if (i === -1)
                    i = Math.min(dragData.index, ownCount - 1);
                ownBar.currentIndex = i;
            };
            /**
             * Add the widget to a new root dock panel along the given orientation.
             *
             * If the widget already exists in the area, it will be removed.
             */
            DockArea.prototype._addWidget = function (widget, orientation, after) {
                widget.parent = null;
                var panel = this._createPanel();
                this._items.push({ widget: widget, panel: panel });
                panel.stackedPanel.addWidget(widget);
                panel.tabBar.addTab(widget.tab);
                this._ensureRoot(orientation);
                if (after) {
                    this._root.addWidget(panel);
                }
                else {
                    this._root.insertWidget(0, panel);
                }
            };
            /**
             * Add the dock widget as a new split panel next to the reference.
             *
             * If the reference does not exist in the area, this is a no-op.
             *
             * If the dock widget already exists in the area, it will be moved.
             */
            DockArea.prototype._splitWidget = function (widget, ref, orientation, after) {
                if (widget === ref) {
                    return;
                }
                var refItem = algo.find(this._items, function (it) { return it.widget === ref; });
                if (!refItem) {
                    return;
                }
                this._splitPanel(refItem.panel, widget, orientation, after);
            };
            /**
             * Split the panel with the given widget along the given orientation.
             *
             * If the widget already exists in the area, it will be moved.
             */
            DockArea.prototype._splitPanel = function (panel, widget, orientation, after) {
                widget.parent = null;
                var newPanel = this._createPanel();
                this._items.push({ widget: widget, panel: newPanel });
                newPanel.stackedPanel.addWidget(widget);
                newPanel.tabBar.addTab(widget.tab);
                var splitter = panel.parent;
                if (splitter.orientation !== orientation) {
                    if (splitter.count <= 1) {
                        splitter.orientation = orientation;
                        splitter.insertWidget(after ? 1 : 0, newPanel);
                        splitter.setSizes([1, 1]);
                    }
                    else {
                        var sizes = splitter.sizes();
                        var index = splitter.indexOf(panel);
                        var newSplitter = this._createSplitter(orientation);
                        newSplitter.addWidget(panel);
                        newSplitter.insertWidget(after ? 1 : 0, newPanel);
                        splitter.insertWidget(index, newSplitter);
                        splitter.setSizes(sizes);
                        newSplitter.setSizes([1, 1]);
                    }
                }
                else {
                    var index = splitter.indexOf(panel);
                    var i = after ? index + 1 : index;
                    var sizes = splitter.sizes();
                    var size = sizes[index] = sizes[index] / 2;
                    splitter.insertWidget(i, newPanel);
                    algo.insert(sizes, i, size);
                    splitter.setSizes(sizes);
                }
            };
            /**
             * Add the dock widget as a tab next to the reference.
             *
             * If the reference does not exist in the area, this is a no-op.
             *
             * If the dock widget already exists in the area, it will be moved.
             */
            DockArea.prototype._tabifyWidget = function (widget, ref, after) {
                if (widget === ref) {
                    return;
                }
                var refItem = algo.find(this._items, function (it) { return it.widget === ref; });
                if (!refItem) {
                    return;
                }
                widget.parent = null;
                var panel = refItem.panel;
                var index = panel.tabBar.indexOf(ref.tab) + (after ? 1 : 0);
                this._items.push({ widget: widget, panel: panel });
                panel.stackedPanel.addWidget(widget);
                panel.tabBar.insertTab(index, widget.tab);
            };
            /**
             * Ensure the root splitter has the given orientation.
             *
             * If the current root has the given orientation, this is a no-op.
             *
             * If the root has <= 1 child, its orientation will be updated.
             *
             * Otherwise, a new root will be created with the proper orientation
             * and the current root will be added as the new root's first child.
             */
            DockArea.prototype._ensureRoot = function (orientation) {
                var root = this._root;
                if (root.orientation === orientation) {
                    return;
                }
                if (root.count <= 1) {
                    root.orientation = orientation;
                }
                else {
                    this._root = this._createSplitter(orientation);
                    this._root.addWidget(root);
                    this.layout.addWidget(this._root);
                }
            };
            /**
             * Create a new panel and setup the signal handlers.
             */
            DockArea.prototype._createPanel = function () {
                var panel = new DockPanel();
                var bar = panel.tabBar;
                var stack = panel.stackedPanel;
                bar.tabWidth = this._tabWidth;
                bar.tabOverlap = this._tabOverlap;
                bar.minTabWidth = this._minTabWidth;
                bar.currentChanged.connect(this._p_currentChanged, this);
                bar.tabCloseRequested.connect(this._p_tabCloseRequested, this);
                bar.tabDetachRequested.connect(this._p_tabDetachRequested, this);
                stack.widgetRemoved.connect(this._p_widgetRemoved, this);
                return panel;
            };
            /**
             * Create a new dock splitter for the dock area.
             */
            DockArea.prototype._createSplitter = function (orientation) {
                var splitter = new DockSplitter(orientation);
                splitter.handleSize = this._handleSize;
                return splitter;
            };
            /**
             * Remove an empty dock panel from the hierarchy.
             *
             * This ensures that the hierarchy is kept consistent by merging an
             * ancestor splitter when it contains only a single child widget.
             */
            DockArea.prototype._removePanel = function (panel) {
                // The parent of a dock panel is always a splitter.
                var splitter = panel.parent;
                // Dispose the panel. It is possible that this method is executing
                // on the path of the panel's child stack widget event handler, so
                // the panel is disposed in a deferred fashion to avoid disposing
                // the child stack widget while it's processing events.
                panel.parent = null;
                setTimeout(function () { return panel.dispose(); }, 0);
                // If the splitter still has multiple children after removing
                // the target panel, nothing else needs to be done.
                if (splitter.count > 1) {
                    return;
                }
                // If the splitter is the root splitter and has a remaining
                // child which is a splitter, that child becomes the root.
                if (splitter === this._root) {
                    if (splitter.count === 1) {
                        var child = splitter.widgetAt(0);
                        if (child instanceof DockSplitter) {
                            var layout = this.layout;
                            var sizes = child.sizes();
                            this._root = child;
                            splitter.parent = null;
                            layout.addWidget(child);
                            child.setSizes(sizes);
                            splitter.dispose();
                        }
                    }
                    return;
                }
                // Non-root splitters always have a splitter parent and are always
                // created with 2 children, so the splitter is guaranteed to have
                // a single child at this point. Furthermore, splitters always have
                // an orthogonal orientation to their parent, so a grandparent and
                // a grandchild splitter will have the same orientation. This means
                // the children of the grandchild can be merged into the grandparent.
                var gParent = splitter.parent;
                var gSizes = gParent.sizes();
                var gChild = splitter.widgetAt(0);
                var index = gParent.indexOf(splitter);
                splitter.parent = null;
                if (gChild instanceof DockPanel) {
                    gParent.insertWidget(index, gChild);
                }
                else {
                    var gcsp = gChild;
                    var gcspSizes = gcsp.sizes();
                    var sizeShare = algo.removeAt(gSizes, index);
                    for (var i = 0; gcsp.count !== 0; ++i) {
                        gParent.insertWidget(index + i, gcsp.widgetAt(0));
                        algo.insert(gSizes, index + i, sizeShare * gcspSizes[i]);
                    }
                }
                gParent.setSizes(gSizes);
                splitter.dispose();
            };
            /**
             * Abort the tab drag operation if one is in progress.
             */
            DockArea.prototype._abortDrag = function () {
                var dragData = this._dragData;
                if (!dragData) {
                    return;
                }
                this._dragData = null;
                // Release the mouse grab and restore the application cursor.
                document.removeEventListener('mouseup', this, true);
                document.removeEventListener('mousemove', this, true);
                document.removeEventListener('contextmenu', this, true);
                dragData.cursorGrab.dispose();
                // Hide the overlay for the last hit panel.
                if (dragData.lastHitPanel) {
                    dragData.lastHitPanel.hideOverlay();
                }
                // If the tab is borrowed by another tab bar, remove it from
                // that tab bar and restore that tab bar's previous tab.
                if (dragData.tempPanel) {
                    var tabBar = dragData.tempPanel.tabBar;
                    tabBar.detachAt(tabBar.currentIndex);
                    tabBar.currentTab = dragData.tempTab;
                }
                // Restore the tab to its original location in its owner panel.
                var item = dragData.item;
                var itemTab = item.widget.tab;
                var ownBar = item.panel.tabBar;
                if (ownBar.currentTab !== itemTab) {
                    var tabStyle = itemTab.node.style;
                    floatTab(itemTab, false);
                    tabStyle.top = '';
                    tabStyle.left = '';
                    tabStyle.width = '';
                    ownBar.insertTab(dragData.index, itemTab);
                }
            };
            /**
             * Handle the `currentChanged` signal from a tab bar.
             */
            DockArea.prototype._p_currentChanged = function (args) {
                var tabBar = sender();
                var item = algo.find(this._items, function (it) { return it.widget.tab === args.second; });
                if (item && item.panel.tabBar === tabBar) {
                    item.panel.stackedPanel.currentWidget = item.widget;
                }
            };
            /**
             * Handle the `tabCloseRequested` signal from a tab bar.
             */
            DockArea.prototype._p_tabCloseRequested = function (args) {
                var item = algo.find(this._items, function (it) { return it.widget.tab === args.second; });
                if (item)
                    item.widget.close();
            };
            /**
             * Handle the `tabDetachRequested` signal from the tab bar.
             */
            DockArea.prototype._p_tabDetachRequested = function (args) {
                // Find the dock item for the detach operation.
                var tab = args.tab;
                var item = algo.find(this._items, function (it) { return it.widget.tab === tab; });
                if (!item) {
                    return;
                }
                // Create the drag data the first time a tab is detached.
                // The drag data will be cleared on the mouse up event.
                var tabBar = sender();
                if (!this._dragData) {
                    var prevTab = tabBar.previousTab;
                    this._dragData = {
                        item: item,
                        index: args.index,
                        offsetX: 0,
                        offsetY: 0,
                        prevTab: prevTab,
                        lastHitPanel: null,
                        cursorGrab: null,
                        tempPanel: null,
                        tempTab: null,
                    };
                }
                // Update the drag data with the current tab geometry.
                var dragData = this._dragData;
                dragData.offsetX = Math.floor(0.4 * this._tabWidth);
                dragData.offsetY = Math.floor(0.6 * tab.node.offsetHeight);
                // Grab the cursor for the drag operation.
                dragData.cursorGrab = overrideCursor('default');
                // The tab being detached will have one of two states:
                //
                // 1) The tab is being detached from its owner tab bar. The current
                //    index is unset before detaching the tab so that the content
                //    widget does not change during the drag operation.
                // 2) The tab is being detached from a tab bar which was borrowing
                //    the tab temporarily. Its previously selected tab is restored.
                if (item.panel.tabBar === tabBar) {
                    tabBar.currentIndex = -1;
                    tabBar.detachAt(args.index);
                }
                else {
                    tabBar.detachAt(args.index);
                    tabBar.currentTab = dragData.tempTab;
                }
                // Clear the temp panel and tab
                dragData.tempPanel = null;
                dragData.tempTab = null;
                // Setup the initial style and position for the floating tab.
                var style = tab.node.style;
                style.left = args.clientX - dragData.offsetX + 'px';
                style.top = args.clientY - dragData.offsetY + 'px';
                style.width = this._tabWidth + 'px';
                style.zIndex = '';
                // Add the floating tab to the document body.
                floatTab(tab, true);
                document.body.appendChild(tab.node);
                // Attach the necessary mouse event listeners.
                document.addEventListener('mouseup', this, true);
                document.addEventListener('mousemove', this, true);
                document.addEventListener('contextmenu', this, true);
            };
            /**
             * Handle the `widgetRemoved` signal from a stack widget.
             */
            DockArea.prototype._p_widgetRemoved = function (args) {
                if (this._ignoreRemoved) {
                    return;
                }
                var i = algo.findIndex(this._items, function (it) { return it.widget === args.second; });
                if (i === -1) {
                    return;
                }
                this._abortDrag();
                var item = algo.removeAt(this._items, i);
                item.panel.tabBar.removeTab(item.widget.tab);
                if (item.panel.stackedPanel.count === 0) {
                    this._removePanel(item.panel);
                }
            };
            return DockArea;
        })(widgets.Widget);
        widgets.DockArea = DockArea;
        /**
         * Set or remove the floating class on the given tab.
         */
        function floatTab(tab, on) {
            if (on) {
                tab.addClass(FLOATING_CLASS);
            }
            else {
                tab.removeClass(FLOATING_CLASS);
            }
        }
        /**
         * Iterate over the DockPanels starting with the given root splitter.
         *
         * Iteration stops when the callback returns anything but undefined.
         */
        function iterPanels(root, cb) {
            for (var i = 0, n = root.count; i < n; ++i) {
                var result;
                var panel = root.widgetAt(i);
                if (panel instanceof DockPanel) {
                    result = cb(panel);
                }
                else {
                    result = iterPanels(panel, cb);
                }
                if (result !== void 0) {
                    return result;
                }
            }
            return void 0;
        }
        /**
         * Iterate over the DockSplitters starting with the given root splitter.
         *
         * Iteration stops when the callback returns anything but undefined.
         */
        function iterSplitters(root, cb) {
            var result = cb(root);
            if (result !== void 0) {
                return result;
            }
            for (var i = 0, n = root.count; i < n; ++i) {
                var panel = root.widgetAt(i);
                if (panel instanceof DockSplitter) {
                    result = iterSplitters(panel, cb);
                    if (result !== void 0) {
                        return result;
                    }
                }
            }
            return void 0;
        }
        /**
         * The split modes used to indicate a dock panel split direction.
         */
        var SplitMode;
        (function (SplitMode) {
            SplitMode[SplitMode["Top"] = 0] = "Top";
            SplitMode[SplitMode["Left"] = 1] = "Left";
            SplitMode[SplitMode["Right"] = 2] = "Right";
            SplitMode[SplitMode["Bottom"] = 3] = "Bottom";
            SplitMode[SplitMode["Invalid"] = 4] = "Invalid";
        })(SplitMode || (SplitMode = {}));
        /**
         * A panel used by a DockArea.
         *
         * A dock panel acts as a simple container for a tab bar and stack
         * panel, plus a bit of logic to manage a drop indicator overlay.
         * The dock area manages the tab bar and stack panel directly, as
         * there is not always a 1:1 association between a tab and panel.
         *
         * This class is not part of the public Phosphor API.
         */
        var DockPanel = (function (_super) {
            __extends(DockPanel, _super);
            /**
             * Construct a new dock panel.
             */
            function DockPanel() {
                _super.call(this);
                this._overlayTimer = 0;
                this._overlayHidden = true;
                this._overlayNode = null;
                this.addClass(DOCK_PANEL_CLASS);
                this._tabBar = new widgets.TabBar();
                this._stackedPanel = new widgets.StackedPanel();
                this._overlayNode = this.createOverlay();
                var layout = new widgets.BoxLayout(widgets.Direction.TopToBottom, 0);
                layout.addWidget(this._tabBar);
                layout.addWidget(this._stackedPanel);
                this.layout = layout;
                this.setFlag(widgets.WidgetFlag.DisallowLayoutChange);
                this.node.appendChild(this._overlayNode);
            }
            Object.defineProperty(DockPanel.prototype, "tabBar", {
                /**
                 * Get the tab bar child of the dock panel.
                 */
                get: function () {
                    return this._tabBar;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DockPanel.prototype, "stackedPanel", {
                /**
                 * Get the stack panel child of the dock panel.
                 */
                get: function () {
                    return this._stackedPanel;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Dispose of the resources held by the panel.
             */
            DockPanel.prototype.dispose = function () {
                this._clearOverlayTimer();
                this._tabBar = null;
                this._stackedPanel = null;
                this._overlayNode = null;
                _super.prototype.dispose.call(this);
            };
            /**
             * Compute the split mode for the given client position.
             */
            DockPanel.prototype.splitModeAt = function (clientX, clientY) {
                var rect = this.node.getBoundingClientRect();
                var fracX = (clientX - rect.left) / rect.width;
                var fracY = (clientY - rect.top) / rect.height;
                if (fracX < 0.0 || fracX > 1.0 || fracY < 0.0 || fracY > 1.0) {
                    return SplitMode.Invalid;
                }
                var mode;
                var normX = fracX > 0.5 ? 1 - fracX : fracX;
                var normY = fracY > 0.5 ? 1 - fracY : fracY;
                if (normX < normY) {
                    mode = fracX <= 0.5 ? SplitMode.Left : SplitMode.Right;
                }
                else {
                    mode = fracY <= 0.5 ? SplitMode.Top : SplitMode.Bottom;
                }
                return mode;
            };
            /**
             * Show the dock overlay for the given client position.
             *
             * If the overlay is already visible, it will be adjusted.
             */
            DockPanel.prototype.showOverlay = function (clientX, clientY) {
                this._clearOverlayTimer();
                var box = this.boxSizing;
                var top = box.paddingTop;
                var left = box.paddingLeft;
                var right = box.paddingRight;
                var bottom = box.paddingBottom;
                switch (this.splitModeAt(clientX, clientY)) {
                    case SplitMode.Left:
                        right = this.width / 2;
                        break;
                    case SplitMode.Right:
                        left = this.width / 2;
                        break;
                    case SplitMode.Top:
                        bottom = this.height / 2;
                        break;
                    case SplitMode.Bottom:
                        top = this.height / 2;
                        break;
                }
                // The first time the overlay is made visible, it is positioned at
                // the cursor with zero size before being displayed. This allows
                // for a nice transition to the normally computed size. Since the
                // elements starts with display: none, a restyle must be forced.
                var style = this._overlayNode.style;
                if (this._overlayHidden) {
                    this._overlayHidden = false;
                    var rect = this.node.getBoundingClientRect();
                    style.top = clientY - rect.top + 'px';
                    style.left = clientX - rect.left + 'px';
                    style.right = rect.right - clientX + 'px';
                    style.bottom = rect.bottom - clientY + 'px';
                    style.display = '';
                    this._overlayNode.offsetWidth; // force layout
                }
                style.opacity = '1';
                style.top = top + 'px';
                style.left = left + 'px';
                style.right = right + 'px';
                style.bottom = bottom + 'px';
            };
            /**
             * Hide the dock overlay.
             *
             * If the overlay is already hidden, this is a no-op.
             */
            DockPanel.prototype.hideOverlay = function () {
                var _this = this;
                if (this._overlayHidden) {
                    return;
                }
                this._clearOverlayTimer();
                this._overlayHidden = true;
                this._overlayNode.style.opacity = '0';
                this._overlayTimer = setTimeout(function () {
                    _this._overlayTimer = 0;
                    _this._overlayNode.style.display = 'none';
                }, 150);
            };
            /**
             * Create the overlay node for the dock panel.
             */
            DockPanel.prototype.createOverlay = function () {
                var overlay = document.createElement('div');
                overlay.className = OVERLAY_CLASS;
                overlay.style.display = 'none';
                return overlay;
            };
            /**
             * Clear the overlay timer.
             */
            DockPanel.prototype._clearOverlayTimer = function () {
                if (this._overlayTimer) {
                    clearTimeout(this._overlayTimer);
                    this._overlayTimer = 0;
                }
            };
            return DockPanel;
        })(widgets.Widget);
        /**
         * A split panel used by a DockArea.
         *
         * This class is not part of the public Phosphor API.
         */
        var DockSplitter = (function (_super) {
            __extends(DockSplitter, _super);
            /**
             * Construct a new dock splitter.
             */
            function DockSplitter(orientation) {
                _super.call(this, orientation);
                this.addClass(DOCK_SPLITTER_CLASS);
            }
            return DockSplitter;
        })(widgets.SplitPanel);
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var signal = phosphor.core.signal;
        /**
         * An item which can be added to a menu or menu bar.
         */
        var MenuItem = (function () {
            /**
             * Construct a new menu item.
             */
            function MenuItem(options) {
                this._text = '';
                this._mnemonic = '';
                this._shortcut = '';
                this._className = '';
                this._enabled = true;
                this._visible = true;
                this._type = 'normal';
                this._checked = false;
                this._submenu = null;
                if (options)
                    this._initFrom(options);
            }
            Object.defineProperty(MenuItem.prototype, "type", {
                /**
                 * Get the type of the menu item: 'normal' | 'check' | 'separator'.
                 */
                get: function () {
                    return this._type;
                },
                /**
                 * Set the type of the menu item: 'normal' | 'check' | 'separator'.
                 */
                set: function (type) {
                    if (type === this._type) {
                        return;
                    }
                    if (type !== 'normal' && type !== 'check' && type !== 'separator') {
                        throw new Error('invalid menu item type: ' + type);
                    }
                    this._type = type;
                    this._checked = false;
                    this.changed.emit(void 0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuItem.prototype, "text", {
                /**
                 * Get the text for the menu item.
                 */
                get: function () {
                    return this._text;
                },
                /**
                 * Set the text for the menu item.
                 */
                set: function (text) {
                    if (text === this._text) {
                        return;
                    }
                    this._text = text;
                    this.changed.emit(void 0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuItem.prototype, "mnemonic", {
                /**
                 * Get the mnemonic key for the menu item.
                 */
                get: function () {
                    return this._mnemonic;
                },
                /**
                 * Set the mnemonic key for the menu item.
                 */
                set: function (mnemonic) {
                    if (mnemonic === this._mnemonic || mnemonic.length > 1) {
                        return;
                    }
                    this._mnemonic = mnemonic;
                    this.changed.emit(void 0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuItem.prototype, "shortcut", {
                /**
                 * Get the shortcut key for the menu item (decoration only).
                 */
                get: function () {
                    return this._shortcut;
                },
                /**
                 * Set the shortcut key for the menu item (decoration only).
                 */
                set: function (shortcut) {
                    if (shortcut === this._shortcut) {
                        return;
                    }
                    this._shortcut = shortcut;
                    this.changed.emit(void 0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuItem.prototype, "enabled", {
                /**
                 * Get whether the menu item is enabled.
                 */
                get: function () {
                    return this._enabled;
                },
                /**
                 * Set whether the menu item is enabled.
                 */
                set: function (enabled) {
                    if (enabled === this._enabled) {
                        return;
                    }
                    this._enabled = enabled;
                    this.changed.emit(void 0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuItem.prototype, "visible", {
                /**
                 * Get whether the menu item is visible.
                 */
                get: function () {
                    return this._visible;
                },
                /**
                 * Set whether the menu item is visible.
                 */
                set: function (visible) {
                    if (visible === this._visible) {
                        return;
                    }
                    this._visible = visible;
                    this.changed.emit(void 0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuItem.prototype, "checked", {
                /**
                 * Get whether the 'check' type menu item is checked.
                 */
                get: function () {
                    return this._checked;
                },
                /**
                 * Set whether the 'check' type menu item is checked.
                 */
                set: function (checked) {
                    if (this._type !== 'check' || checked === this._checked) {
                        return;
                    }
                    this._checked = checked;
                    this.changed.emit(void 0);
                    this.toggled.emit(checked);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuItem.prototype, "submenu", {
                /**
                 * Get the submenu for the menu item.
                 */
                get: function () {
                    return this._submenu;
                },
                /**
                 * Set the submenu for the menu item.
                 */
                set: function (submenu) {
                    if (submenu === this._submenu) {
                        return;
                    }
                    this._submenu = submenu;
                    this.changed.emit(void 0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuItem.prototype, "className", {
                /**
                 * Get the class name for the menu item.
                 */
                get: function () {
                    return this._className;
                },
                /**
                 * Set the class name for the menu item.
                 */
                set: function (name) {
                    if (name === this._className) {
                        return;
                    }
                    this._className = name;
                    this.changed.emit(void 0);
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Trigger the menu item.
             *
             * This will emit the `triggered` signal.
             *
             * If the item is a `check` type, it will also be toggled.
             */
            MenuItem.prototype.trigger = function () {
                if (this._type === 'check') {
                    this.checked = !this.checked;
                }
                this.triggered.emit(this.checked);
            };
            /**
             * Initialize the menu item from the given options object.
             */
            MenuItem.prototype._initFrom = function (options) {
                if (options.type !== void 0) {
                    this.type = options.type;
                }
                if (options.text !== void 0) {
                    this._text = options.text;
                }
                if (options.mnemonic !== void 0) {
                    this.mnemonic = options.mnemonic;
                }
                if (options.shortcut !== void 0) {
                    this._shortcut = options.shortcut;
                }
                if (options.enabled !== void 0) {
                    this._enabled = options.enabled;
                }
                if (options.visible !== void 0) {
                    this._visible = options.visible;
                }
                if (options.checked !== void 0) {
                    this.checked = options.checked;
                }
                if (options.submenu !== void 0) {
                    this._submenu = options.submenu;
                }
                if (options.className !== void 0) {
                    this._className = options.className;
                }
            };
            __decorate([
                signal
            ], MenuItem.prototype, "changed");
            __decorate([
                signal
            ], MenuItem.prototype, "toggled");
            __decorate([
                signal
            ], MenuItem.prototype, "triggered");
            return MenuItem;
        })();
        widgets.MenuItem = MenuItem;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var algo = phosphor.collections.algorithm;
        var NodeBase = phosphor.core.NodeBase;
        var clearSignalData = phosphor.core.clearSignalData;
        var sender = phosphor.core.sender;
        var signal = phosphor.core.signal;
        var Size = phosphor.utility.Size;
        var clientViewportRect = phosphor.utility.clientViewportRect;
        var createBoxSizing = phosphor.utility.createBoxSizing;
        var hitTest = phosphor.utility.hitTest;
        /**
         * The class name added to menu instances.
         */
        var MENU_CLASS = 'p-Menu';
        /**
         * The class name added to a menu content node.
         */
        var CONTENT_CLASS = 'p-Menu-content';
        /**
         * The class name assigned to a menu item.
         */
        var MENU_ITEM_CLASS = 'p-Menu-item';
        /**
         * The class name added to a menu item icon cell.
         */
        var ICON_CLASS = 'p-Menu-item-icon';
        /**
         * The class name added to a menu item text cell.
         */
        var TEXT_CLASS = 'p-Menu-item-text';
        /**
         * The class name added to a menu item shortcut cell.
         */
        var SHORTCUT_CLASS = 'p-Menu-item-shortcut';
        /**
         * The class name added to a menu item submenu icon cell.
         */
        var SUBMENU_ICON_CLASS = 'p-Menu-item-submenu-icon';
        /**
         * The class name added to a check type menu item.
         */
        var CHECK_TYPE_CLASS = 'p-mod-check-type';
        /**
         * The class name added to a separator type menu item.
         */
        var SEPARATOR_TYPE_CLASS = 'p-mod-separator-type';
        /**
         * The class name added to active menu items.
         */
        var ACTIVE_CLASS = 'p-mod-active';
        /**
         * The class name added to a disabled menu item.
         */
        var DISABLED_CLASS = 'p-mod-disabled';
        /**
         * The class name added to a hidden menu item.
         */
        var HIDDEN_CLASS = 'p-mod-hidden';
        /**
         * The class name added to a force hidden menu item.
         */
        var FORCE_HIDDEN_CLASS = 'p-mod-force-hidden';
        /**
         * The class name added to a checked menu item.
         */
        var CHECKED_CLASS = 'p-mod-checked';
        /**
         * The class name added to a menu item with a submenu.
         */
        var HAS_SUBMENU_CLASS = 'p-mod-has-submenu';
        /**
         * The delay, in ms, for opening a submenu.
         */
        var OPEN_DELAY = 300;
        /**
         * The delay, in ms, for closing a submenu.
         */
        var CLOSE_DELAY = 300;
        /**
         * The horizontal overlap to use for submenus.
         */
        var SUBMENU_OVERLAP = 3;
        /**
         * An object which displays menu items as a popup menu.
         */
        var Menu = (function (_super) {
            __extends(Menu, _super);
            /**
             * Construct a new menu.
             */
            function Menu(items) {
                var _this = this;
                _super.call(this);
                this._openTimer = 0;
                this._closeTimer = 0;
                this._activeIndex = -1;
                this._parentMenu = null;
                this._childMenu = null;
                this._childItem = null;
                this._items = [];
                this._nodes = [];
                this.addClass(MENU_CLASS);
                if (items)
                    items.forEach(function (it) { return _this.addItem(it); });
            }
            /**
             * Create the DOM node for a menu.
             */
            Menu.createNode = function () {
                var node = document.createElement('div');
                var content = document.createElement('ul');
                content.className = CONTENT_CLASS;
                node.appendChild(content);
                return node;
            };
            /**
             * Find the root menu of a menu hierarchy.
             */
            Menu.rootMenu = function (menu) {
                while (menu._parentMenu) {
                    menu = menu._parentMenu;
                }
                return menu;
            };
            /**
             * Find the leaf menu of a menu hierarchy.
             */
            Menu.leafMenu = function (menu) {
                while (menu._childMenu) {
                    menu = menu._childMenu;
                }
                return menu;
            };
            /**
             * Dispose of the resources held by the menu.
             */
            Menu.prototype.dispose = function () {
                this.close();
                clearSignalData(this);
                this._items = null;
                this._nodes = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(Menu.prototype, "parentMenu", {
                /**
                 * Get the parent menu of the menu.
                 *
                 * This will be null if the menu is not an open submenu.
                 */
                get: function () {
                    return this._parentMenu;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Menu.prototype, "childMenu", {
                /**
                 * Get the child menu of the menu.
                 *
                 * This will be null if the menu does not have an open submenu.
                 */
                get: function () {
                    return this._childMenu;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Menu.prototype, "activeIndex", {
                /**
                 * Get the index of the active (highlighted) menu item.
                 */
                get: function () {
                    return this._activeIndex;
                },
                /**
                 * Set the index of the active (highlighted) menu item.
                 *
                 * Only a non-separator item can be set as the active item.
                 */
                set: function (index) {
                    var ok = isSelectable(this._items[index]);
                    this._setActiveIndex(ok ? index : -1);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Menu.prototype, "activeItem", {
                /**
                 * Get the active (highlighted) menu item.
                 */
                get: function () {
                    return this._items[this._activeIndex];
                },
                /**
                 * Set the active (highlighted) menu item.
                 *
                 * Only a non-separator item can be set as the active item.
                 */
                set: function (item) {
                    this.activeIndex = this.indexOf(item);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Menu.prototype, "count", {
                /**
                 * Get the number of menu items in the menu.
                 */
                get: function () {
                    return this._items.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the menu item at the given index.
             */
            Menu.prototype.itemAt = function (index) {
                return this._items[index];
            };
            /**
             * Get the index of the given menu item.
             */
            Menu.prototype.indexOf = function (item) {
                return algo.indexOf(this._items, item);
            };
            /**
             * Add a menu item to the end of the menu.
             *
             * Returns the new index of the item.
             */
            Menu.prototype.addItem = function (item) {
                return this.insertItem(this.count, item);
            };
            /**
             * Insert a menu item into the menu at the given index.
             *
             * Returns the new index of the item.
             */
            Menu.prototype.insertItem = function (index, item) {
                this.removeItem(item);
                if (this._activeIndex !== -1) {
                    this._reset();
                }
                var node = this.createItemNode(item);
                index = algo.insert(this._items, index, item);
                algo.insert(this._nodes, index, node);
                item.changed.connect(this._p_changed, this);
                node.addEventListener('mouseenter', this);
                this.insertItemNode(index, node);
                this._collapseSeparators();
                return index;
            };
            /**
             * Remove and return the menu item at the given index.
             */
            Menu.prototype.removeAt = function (index) {
                if (this._activeIndex !== -1) {
                    this._reset();
                }
                var item = algo.removeAt(this._items, index);
                var node = algo.removeAt(this._nodes, index);
                if (item) {
                    item.changed.disconnect(this._p_changed, this);
                }
                if (node) {
                    node.removeEventListener('mouseenter', this);
                    this.removeItemNode(node);
                }
                this._collapseSeparators();
                return item;
            };
            /**
             * Remove the given menu item from the menu.
             *
             * Returns the index of the removed item.
             */
            Menu.prototype.removeItem = function (item) {
                var index = this.indexOf(item);
                if (index !== -1)
                    this.removeAt(index);
                return index;
            };
            /**
             * Remove all menu items from the menu.
             */
            Menu.prototype.clearItems = function () {
                while (this.count) {
                    this.removeAt(this.count - 1);
                }
            };
            /**
             * Activate the next non-separator menu item.
             *
             * This is equivalent to pressing the down arrow key.
             */
            Menu.prototype.activateNextItem = function () {
                var fromIndex = this._activeIndex + 1;
                var i = algo.findIndex(this._items, isSelectable, fromIndex, true);
                this._setActiveIndex(i);
            };
            /**
             * Activate the previous non-separator menu item.
             *
             * This is equivalent to pressing the up arrow key.
             */
            Menu.prototype.activatePreviousItem = function () {
                var fromIndex = Math.max(-1, this._activeIndex - 1);
                var i = algo.findLastIndex(this._items, isSelectable, fromIndex, true);
                this._setActiveIndex(i);
            };
            /**
             * Activate the next menu item with the given mnemonic key.
             *
             * This is equivalent to pressing the mnemonic key.
             */
            Menu.prototype.activateMnemonicItem = function (key) {
                key = key.toUpperCase();
                var i = algo.findIndex(this._items, function (it) {
                    return isKeyable(it) && it.mnemonic.toUpperCase() === key;
                }, this._activeIndex + 1, true);
                this._setActiveIndex(i);
            };
            /**
             * Open the submenu of the active menu item.
             *
             * This is equivalent to pressing the right arrow key.
             *
             * Returns true if the item was opened, false otherwise.
             */
            Menu.prototype.openActiveItem = function () {
                var index = this._activeIndex;
                var item = this._items[index];
                if (!item || !item.submenu || !item.enabled) {
                    return false;
                }
                this._openChildMenu(item, this._nodes[index], false);
                this._childMenu.activateNextItem();
                return true;
            };
            /**
             * Trigger (or open) the active menu item.
             *
             * This is equivalent to pressing the enter key.
             *
             * Returns true if the item was triggered, false otherwise.
             */
            Menu.prototype.triggerActiveItem = function () {
                var index = this._activeIndex;
                var item = this._items[index];
                if (!item || !item.enabled) {
                    return false;
                }
                if (item.submenu) {
                    this._openChildMenu(item, this._nodes[index], false);
                    this._childMenu.activateNextItem();
                }
                else {
                    Menu.rootMenu(this).close();
                    item.trigger();
                }
                return true;
            };
            /**
             * Popup the menu at the specified location.
             *
             * The menu will be opened at the given location unless it will not
             * fully fit on the screen. If it will not fit, it will be adjusted
             * to fit naturally on the screen. The last two optional parameters
             * control whether the provided coordinate value must be obeyed.
             *
             * When the menu is opened as a popup menu, it will handle all key
             * events related to menu navigation as well as closing the menu
             * when the mouse is pressed outside of the menu hierarchy. To
             * prevent these actions, use the 'open' method instead.
             */
            Menu.prototype.popup = function (x, y, forceX, forceY) {
                if (forceX === void 0) { forceX = false; }
                if (forceY === void 0) { forceY = false; }
                var node = this.node;
                if (node.parentNode) {
                    return;
                }
                node.addEventListener('mouseup', this);
                node.addEventListener('mouseleave', this);
                node.addEventListener('contextmenu', this);
                document.addEventListener('keydown', this, true);
                document.addEventListener('keypress', this, true);
                document.addEventListener('mousedown', this, true);
                openRootMenu(this, x, y, forceX, forceY);
            };
            /**
             * Open the menu at the specified location.
             *
             * The menu will be opened at the given location unless it will not
             * fully fit on the screen. If it will not fit, it will be adjusted
             * to fit naturally on the screen. The last two optional parameters
             * control whether the provided coordinate value must be obeyed.
             *
             * When the menu is opened with this method, it will not handle key
             * events for navigation, nor will it close itself when the mouse is
             * pressed outside the menu hierarchy. This is useful when using the
             * menu from a menubar, where this menubar should handle these tasks.
             * Use the `popup` method for the alternative behavior.
             */
            Menu.prototype.open = function (x, y, forceX, forceY) {
                if (forceX === void 0) { forceX = false; }
                if (forceY === void 0) { forceY = false; }
                var node = this.node;
                if (node.parentNode) {
                    return;
                }
                node.addEventListener('mouseup', this);
                node.addEventListener('mouseleave', this);
                node.addEventListener('contextmenu', this);
                openRootMenu(this, x, y, forceX, forceY);
            };
            /**
             * Close the menu and remove its node from the DOM.
             */
            Menu.prototype.close = function () {
                var node = this.node;
                if (!node.parentNode) {
                    return;
                }
                node.parentNode.removeChild(node);
                node.removeEventListener('mouseup', this);
                node.removeEventListener('mouseleave', this);
                node.removeEventListener('contextmenu', this);
                document.removeEventListener('keydown', this, true);
                document.removeEventListener('keypress', this, true);
                document.removeEventListener('mousedown', this, true);
                this._reset();
                this._removeFromParent();
                this.closed.emit(void 0);
            };
            /**
             * Handle the DOM events for the menu.
             */
            Menu.prototype.handleEvent = function (event) {
                switch (event.type) {
                    case 'mouseenter':
                        this._evtMouseEnter(event);
                        break;
                    case 'mouseleave':
                        this._evtMouseLeave(event);
                        break;
                    case 'mousedown':
                        this._evtMouseDown(event);
                        break;
                    case 'mouseup':
                        this._evtMouseUp(event);
                        break;
                    case 'contextmenu':
                        this._evtContextMenu(event);
                        break;
                    case 'keydown':
                        this._evtKeyDown(event);
                        break;
                    case 'keypress':
                        this._evtKeyPress(event);
                        break;
                }
            };
            /**
             * Create the DOM node for a MenuItem.
             *
             * This can be reimplemented to create custom menu item nodes.
             */
            Menu.prototype.createItemNode = function (item) {
                var node = document.createElement('li');
                var icon = document.createElement('span');
                var text = document.createElement('span');
                var shortcut = document.createElement('span');
                var submenu = document.createElement('span');
                icon.className = ICON_CLASS;
                text.className = TEXT_CLASS;
                shortcut.className = SHORTCUT_CLASS;
                submenu.className = SUBMENU_ICON_CLASS;
                node.appendChild(icon);
                node.appendChild(text);
                node.appendChild(shortcut);
                node.appendChild(submenu);
                this.initItemNode(item, node);
                return node;
            };
            /**
             * Initialize the DOM node for the given menu item.
             *
             * This method should be reimplemented if a subclass reimplements the
             * `createItemNode` method. It should initialize the node using the
             * given menu item. It will be called any time the item changes.
             */
            Menu.prototype.initItemNode = function (item, node) {
                var parts = [MENU_ITEM_CLASS];
                if (item.className) {
                    parts.push(item.className);
                }
                if (item.type === 'check') {
                    parts.push(CHECK_TYPE_CLASS);
                }
                else if (item.type === 'separator') {
                    parts.push(SEPARATOR_TYPE_CLASS);
                }
                if (item.checked) {
                    parts.push(CHECKED_CLASS);
                }
                if (!item.enabled) {
                    parts.push(DISABLED_CLASS);
                }
                if (!item.visible) {
                    parts.push(HIDDEN_CLASS);
                }
                if (item.submenu) {
                    parts.push(HAS_SUBMENU_CLASS);
                }
                node.className = parts.join(' ');
                node.children[1].textContent = item.text;
                node.children[2].textContent = item.shortcut;
            };
            /**
             * A method invoked when a menu item is inserted into the menu.
             *
             * This method should be reimplemented if a subclass reimplements the
             * `createNode` method. It should insert the item node into the menu
             * at the specified location.
             */
            Menu.prototype.insertItemNode = function (index, node) {
                var content = this.node.firstChild;
                content.insertBefore(node, content.childNodes[index]);
            };
            /**
             * A method invoked when a menu item is removed from the menu.
             *
             * This method should be reimplemented if a subclass reimplements the
             * `createNode` method. It should remove the item node from the menu.
             */
            Menu.prototype.removeItemNode = function (node) {
                var content = this.node.firstChild;
                content.removeChild(node);
            };
            /**
             * Handle the 'mouseenter' event for the menu.
             *
             * This event listener is attached to the child item nodes.
             */
            Menu.prototype._evtMouseEnter = function (event) {
                // Ensure the ancestor chain is properly highlighted.
                this._syncAncestors();
                // Schedule a close for the open child menu, if any.
                this._closeChildMenu();
                // Cancel the previous open request, if any.
                this._cancelPendingOpen();
                // Find the item index corresponding to the node.
                var node = event.currentTarget;
                var index = algo.indexOf(this._nodes, node);
                // Clear the active item if the node is not tracked.
                if (index === -1) {
                    this._setActiveIndex(-1);
                    return;
                }
                // Clear the active item if the target item is a separator.
                var item = this._items[index];
                if (item.type === 'separator') {
                    this._setActiveIndex(-1);
                    return;
                }
                // Otherwise, activate the new item.
                this._setActiveIndex(index);
                // If the item has a submenu, it should be opened. If the item
                // is already open, the close request from above is cancelled.
                // Otherwise, the new item is scheduled to be opened.
                if (item.submenu && item.enabled) {
                    if (item === this._childItem) {
                        this._cancelPendingClose();
                    }
                    else {
                        this._openChildMenu(item, node, true);
                    }
                }
            };
            /**
             * Handle the 'mouseleave' event for the menu.
             *
             * This event listener is only attached to the menu node.
             */
            Menu.prototype._evtMouseLeave = function (event) {
                this._cancelPendingOpen();
                var child = this._childMenu;
                if (!child || !hitTest(child.node, event.clientX, event.clientY)) {
                    this._setActiveIndex(-1);
                    this._closeChildMenu();
                }
            };
            /**
             * Handle the 'mouseup' event for the menu.
             *
             * This event listener is attached to the menu node.
             */
            Menu.prototype._evtMouseUp = function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.button !== 0) {
                    return;
                }
                var x = event.clientX;
                var y = event.clientY;
                var i = algo.findIndex(this._nodes, function (node) { return hitTest(node, x, y); });
                if (i === this._activeIndex) {
                    this.triggerActiveItem();
                }
            };
            /**
             * Handle the 'contextmenu' event for the menu.
             *
             * This event listener is attached to the menu node and disables
             * the default browser context menu.
             */
            Menu.prototype._evtContextMenu = function (event) {
                event.preventDefault();
                event.stopPropagation();
            };
            /**
             * Handle the 'mousedown' event for the menu.
             *
             * This event listener is attached to the document for a popup menu.
             */
            Menu.prototype._evtMouseDown = function (event) {
                var menu = this;
                var hit = false;
                var x = event.clientX;
                var y = event.clientY;
                while (!hit && menu) {
                    hit = hitTest(menu.node, x, y);
                    menu = menu._childMenu;
                }
                if (!hit)
                    this.close();
            };
            /**
             * Handle the key down event for the menu.
             *
             * This event listener is attached to the document for a popup menu.
             */
            Menu.prototype._evtKeyDown = function (event) {
                event.stopPropagation();
                var leaf = Menu.leafMenu(this);
                switch (event.keyCode) {
                    case 13:
                        event.preventDefault();
                        leaf.triggerActiveItem();
                        break;
                    case 27:
                        event.preventDefault();
                        leaf.close();
                        break;
                    case 37:
                        event.preventDefault();
                        if (leaf !== this)
                            leaf.close();
                        break;
                    case 38:
                        event.preventDefault();
                        leaf.activatePreviousItem();
                        break;
                    case 39:
                        event.preventDefault();
                        leaf.openActiveItem();
                        break;
                    case 40:
                        event.preventDefault();
                        leaf.activateNextItem();
                        break;
                }
            };
            /**
             * Handle the 'keypress' event for the menu.
             *
             * This event listener is attached to the document for a popup menu.
             */
            Menu.prototype._evtKeyPress = function (event) {
                event.preventDefault();
                event.stopPropagation();
                var str = String.fromCharCode(event.charCode);
                Menu.leafMenu(this).activateMnemonicItem(str);
            };
            /**
             * Set the active item index for the menu.
             *
             * This updates the class name of the relevant item nodes.
             */
            Menu.prototype._setActiveIndex = function (index) {
                var curr = this._nodes[this._activeIndex];
                var next = this._nodes[index];
                this._activeIndex = index;
                if (curr === next) {
                    return;
                }
                if (curr)
                    curr.classList.remove(ACTIVE_CLASS);
                if (next)
                    next.classList.add(ACTIVE_CLASS);
            };
            /**
             * Synchronize the active item hierarchy starting with the parent.
             *
             * This ensures that the proper child items are activated for the
             * ancestor menu hierarchy and that any pending open or close
             * tasks are cleared.
             */
            Menu.prototype._syncAncestors = function () {
                var menu = this._parentMenu;
                while (menu) {
                    menu._cancelPendingOpen();
                    menu._cancelPendingClose();
                    menu._syncChildItem();
                    menu = menu._parentMenu;
                }
            };
            /**
             * Synchronize the active item with the item for the child menu.
             *
             * This ensures that the active item is the child menu item.
             */
            Menu.prototype._syncChildItem = function () {
                var index = this.indexOf(this._childItem);
                if (index !== -1) {
                    this._setActiveIndex(index);
                }
            };
            /**
             * Open the menu item's submenu using the node for location.
             *
             * If the given item is already open, this is a no-op.
             *
             * Any pending open operation will be cancelled before opening
             * the menu or queueing the delayed task to open the menu.
             */
            Menu.prototype._openChildMenu = function (item, node, delayed) {
                var _this = this;
                if (item === this._childItem) {
                    return;
                }
                this._cancelPendingOpen();
                if (delayed) {
                    this._openTimer = setTimeout(function () {
                        var menu = item.submenu;
                        _this._openTimer = 0;
                        _this._childItem = item;
                        _this._childMenu = menu;
                        menu._parentMenu = _this;
                        menu._openAsSubmenu(node);
                    }, OPEN_DELAY);
                }
                else {
                    var menu = item.submenu;
                    this._childItem = item;
                    this._childMenu = menu;
                    menu._parentMenu = this;
                    menu._openAsSubmenu(node);
                }
            };
            /**
             * Open the menu as a child menu.
             */
            Menu.prototype._openAsSubmenu = function (item) {
                var node = this.node;
                node.addEventListener('mouseup', this);
                node.addEventListener('mouseleave', this);
                node.addEventListener('contextmenu', this);
                openSubmenu(this, item);
            };
            /**
             * Close the currently open child menu using a delayed task.
             *
             * If a task is pending or if there is no child menu, this is a no-op.
             */
            Menu.prototype._closeChildMenu = function () {
                var _this = this;
                if (this._closeTimer || !this._childMenu) {
                    return;
                }
                this._closeTimer = setTimeout(function () {
                    _this._closeTimer = 0;
                    if (_this._childMenu) {
                        _this._childMenu.close();
                        _this._childMenu = null;
                        _this._childItem = null;
                    }
                }, CLOSE_DELAY);
            };
            /**
             * Reset the state of the menu.
             *
             * This deactivates the current item and closes the child menu.
             */
            Menu.prototype._reset = function () {
                this._cancelPendingOpen();
                this._cancelPendingClose();
                this._setActiveIndex(-1);
                if (this._childMenu) {
                    this._childMenu.close();
                    this._childMenu = null;
                    this._childItem = null;
                }
            };
            /**
             * Remove the menu from its parent menu.
             */
            Menu.prototype._removeFromParent = function () {
                var parent = this._parentMenu;
                if (!parent) {
                    return;
                }
                this._parentMenu = null;
                parent._cancelPendingOpen();
                parent._cancelPendingClose();
                parent._childMenu = null;
                parent._childItem = null;
            };
            /**
             * Cancel any pending child menu open task.
             */
            Menu.prototype._cancelPendingOpen = function () {
                if (this._openTimer) {
                    clearTimeout(this._openTimer);
                    this._openTimer = 0;
                }
            };
            /**
             * Cancel any pending child menu close task.
             */
            Menu.prototype._cancelPendingClose = function () {
                if (this._closeTimer) {
                    clearTimeout(this._closeTimer);
                    this._closeTimer = 0;
                }
            };
            /**
             * Collapse neighboring visible separators.
             *
             * This force-hides select separator nodes such that there are never
             * multiple visible separator siblings. It also force-hides all
             * leading and trailing separator nodes.
             */
            Menu.prototype._collapseSeparators = function () {
                var items = this._items;
                var nodes = this._nodes;
                var hideSeparator = true;
                var lastIndex = algo.findLastIndex(items, isVisibleItem);
                for (var i = 0, n = items.length; i < n; ++i) {
                    var item = items[i];
                    if (item.type === 'separator') {
                        if (hideSeparator || i > lastIndex) {
                            nodes[i].classList.add(FORCE_HIDDEN_CLASS);
                        }
                        else if (item.visible) {
                            nodes[i].classList.remove(FORCE_HIDDEN_CLASS);
                            hideSeparator = true;
                        }
                    }
                    else if (item.visible) {
                        hideSeparator = false;
                    }
                }
            };
            /**
             * Handle the `changed` signal from a menu item.
             */
            Menu.prototype._p_changed = function () {
                var item = sender();
                var i = this.indexOf(item);
                if (i === -1) {
                    return;
                }
                if (i === this._activeIndex) {
                    this._reset();
                }
                this.initItemNode(item, this._nodes[i]);
                this._collapseSeparators();
            };
            __decorate([
                signal
            ], Menu.prototype, "closed");
            return Menu;
        })(NodeBase);
        widgets.Menu = Menu;
        /**
         * Test whether the menu item is a visible non-separator item.
         */
        function isVisibleItem(item) {
            return item && item.type !== 'separator' && item.visible;
        }
        /**
         * Test whether the menu item is selectable.
         *
         * Returns true if the item is a visible non-separator item.
         */
        function isSelectable(item) {
            return isVisibleItem(item);
        }
        /**
         * Test whether the menu item is keyable for a mnemonic.
         *
         * Returns true if the item is selectable and enabled.
         */
        function isKeyable(item) {
            return isSelectable(item) && item.enabled;
        }
        /**
         * Mount the menu as hidden and compute its optimal size.
         */
        function measureMenu(menu, vpRect, minY) {
            var node = menu.node;
            var style = node.style;
            style.top = '';
            style.left = '';
            style.width = '';
            style.height = '';
            style.visibility = 'hidden';
            document.body.appendChild(menu.node);
            var rect = node.getBoundingClientRect();
            var width = Math.ceil(rect.width);
            var height = Math.ceil(rect.height);
            var maxHeight = vpRect.height - minY;
            if (height > maxHeight) {
                height = maxHeight;
                width += 17; // adjust for scrollbar
            }
            return new Size(width, height);
        }
        /**
         * Show the menu with the specified geometry.
         */
        function showMenu(menu, x, y, w, h) {
            var style = menu.node.style;
            style.top = Math.max(0, y) + 'px';
            style.left = Math.max(0, x) + 'px';
            style.width = w + 'px';
            style.height = h + 'px';
            style.visibility = '';
        }
        /**
         * Open the menu as a root menu at the target location.
         */
        function openRootMenu(menu, x, y, forceX, forceY) {
            var vpRect = clientViewportRect();
            var size = measureMenu(menu, vpRect, forceY ? y : 0);
            if (!forceX && (x + size.width > vpRect.right)) {
                x = vpRect.right - size.width;
            }
            if (!forceY && (y + size.height > vpRect.bottom)) {
                if (y > vpRect.bottom) {
                    y = vpRect.bottom - size.height;
                }
                else {
                    y = y - size.height;
                }
            }
            showMenu(menu, x, y, size.width, size.height);
        }
        /**
         * Open a the menu as a submenu using the item node for positioning.
         */
        function openSubmenu(menu, item) {
            var vpRect = clientViewportRect();
            var size = measureMenu(menu, vpRect, 0);
            var box = createBoxSizing(menu.node);
            var itemRect = item.getBoundingClientRect();
            var x = itemRect.right - SUBMENU_OVERLAP;
            var y = itemRect.top - box.borderTop - box.paddingTop;
            if (x + size.width > vpRect.right) {
                x = itemRect.left + SUBMENU_OVERLAP - size.width;
            }
            if (y + size.height > vpRect.bottom) {
                y = itemRect.bottom + box.borderBottom + box.paddingBottom - size.height;
            }
            showMenu(menu, x, y, size.width, size.height);
        }
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var algo = phosphor.collections.algorithm;
        var sender = phosphor.core.sender;
        var Size = phosphor.utility.Size;
        var hitTest = phosphor.utility.hitTest;
        /**
         * The class name added to a menu bar widget.
         */
        var MENU_BAR_CLASS = 'p-MenuBar';
        /**
         * The class name added to a menu bar content node.
         */
        var CONTENT_CLASS = 'p-MenuBar-content';
        /**
         * The class name assigned to an open menu bar menu.
         */
        var MENU_CLASS = 'p-MenuBar-menu';
        /**
         * The class name assigned to a menu item.
         */
        var MENU_ITEM_CLASS = 'p-MenuBar-item';
        /**
         * The class name added to a menu item icon cell.
         */
        var ICON_CLASS = 'p-MenuBar-item-icon';
        /**
         * The class name added to a menu item text cell.
         */
        var TEXT_CLASS = 'p-MenuBar-item-text';
        /**
         * The class name added to a separator type menu item.
         */
        var SEPARATOR_TYPE_CLASS = 'p-mod-separator-type';
        /**
         * The class name added to active menu items.
         */
        var ACTIVE_CLASS = 'p-mod-active';
        /**
         * The class name added to active menu items.
         */
        var SELECTED_CLASS = 'p-mod-selected';
        /**
         * The class name added to a disabled menu item.
         */
        var DISABLED_CLASS = 'p-mod-disabled';
        /**
         * The class name added to a hidden menu item.
         */
        var HIDDEN_CLASS = 'p-mod-hidden';
        /**
         * The class name added to a force hidden menu item.
         */
        var FORCE_HIDDEN_CLASS = 'p-mod-force-hidden';
        /**
         * A leaf widget which displays menu items as a menu bar.
         */
        var MenuBar = (function (_super) {
            __extends(MenuBar, _super);
            /**
             * Construct a new menu bar.
             */
            function MenuBar(items) {
                var _this = this;
                _super.call(this);
                this._activeIndex = -1;
                this._childMenu = null;
                this._items = [];
                this._nodes = [];
                this._state = MBState.Inactive;
                this.addClass(MENU_BAR_CLASS);
                this.verticalSizePolicy = widgets.SizePolicy.Fixed;
                this.setFlag(widgets.WidgetFlag.DisallowLayoutChange);
                if (items)
                    items.forEach(function (it) { return _this.addItem(it); });
            }
            /**
             * Create the DOM node for a menu bar.
             */
            MenuBar.createNode = function () {
                var node = document.createElement('div');
                var content = document.createElement('ul');
                content.className = CONTENT_CLASS;
                node.appendChild(content);
                return node;
            };
            /**
             * Dispose of the resources held by the panel.
             */
            MenuBar.prototype.dispose = function () {
                this._closeChildMenu();
                this._items = null;
                this._nodes = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(MenuBar.prototype, "childMenu", {
                /**
                 * Get the child menu of the menu bar.
                 *
                 * This will be null if the menu bar does not have an open menu.
                 */
                get: function () {
                    return this._childMenu;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuBar.prototype, "activeIndex", {
                /**
                 * Get the index of the active (highlighted) menu item.
                 */
                get: function () {
                    return this._activeIndex;
                },
                /**
                 * Set the index of the active (highlighted) menu item.
                 *
                 * Only an enabled non-separator item can be set as the active item.
                 */
                set: function (index) {
                    var ok = isSelectable(this._items[index]);
                    this._setActiveIndex(ok ? index : -1);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuBar.prototype, "activeItem", {
                /**
                 * Get the active (highlighted) menu item.
                 */
                get: function () {
                    return this._items[this._activeIndex];
                },
                /**
                 * Set the active (highlighted) menu item.
                 *
                 * Only an enabled non-separator item can be set as the active item.
                 */
                set: function (item) {
                    this.activeIndex = this.indexOf(item);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MenuBar.prototype, "count", {
                /**
                 * Get the number of menu items in the menu bar.
                 */
                get: function () {
                    return this._items.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the menu item at the given index.
             */
            MenuBar.prototype.itemAt = function (index) {
                return this._items[index];
            };
            /**
             * Get the index of the given menu item.
             */
            MenuBar.prototype.indexOf = function (item) {
                return algo.indexOf(this._items, item);
            };
            /**
             * Add a menu item to the end of the menu bar.
             *
             * Returns the new index of the item.
             */
            MenuBar.prototype.addItem = function (item) {
                return this.insertItem(this.count, item);
            };
            /**
             * Insert a menu item into the menu bar at the given index.
             *
             * Returns the new index of the item.
             */
            MenuBar.prototype.insertItem = function (index, item) {
                this.removeItem(item);
                if (this._activeIndex !== -1) {
                    this._setState(MBState.Inactive);
                    this._setActiveIndex(-1);
                }
                var node = this.createItemNode(item);
                index = algo.insert(this._items, index, item);
                algo.insert(this._nodes, index, node);
                item.changed.connect(this._p_changed, this);
                this.insertItemNode(index, node);
                this._collapseSeparators();
                return index;
            };
            /**
             * Remove and return the menu item at the given index.
             */
            MenuBar.prototype.removeAt = function (index) {
                if (this._activeIndex !== -1) {
                    this._setState(MBState.Inactive);
                    this._setActiveIndex(-1);
                }
                var item = algo.removeAt(this._items, index);
                var node = algo.removeAt(this._nodes, index);
                if (item) {
                    item.changed.disconnect(this._p_changed, this);
                }
                if (node) {
                    this.removeItemNode(node);
                }
                this._collapseSeparators();
                return item;
            };
            /**
             * Remove the given menu item from the menu bar.
             *
             * Returns the index of the removed item.
             */
            MenuBar.prototype.removeItem = function (item) {
                var index = this.indexOf(item);
                if (index !== -1)
                    this.removeAt(index);
                return index;
            };
            /**
             * Remove all menu items from the menu bar.
             */
            MenuBar.prototype.clearItems = function () {
                while (this.count) {
                    this.removeAt(this.count - 1);
                }
            };
            /**
             * Activate the next non-separator menu item.
             *
             * This is equivalent to pressing the right arrow key.
             */
            MenuBar.prototype.activateNextItem = function () {
                var fromIndex = this._activeIndex + 1;
                var i = algo.findIndex(this._items, isSelectable, fromIndex, true);
                this._setActiveIndex(i);
                var menu = this._childMenu;
                if (menu)
                    menu.activateNextItem();
            };
            /**
             * Activate the previous non-separator menu item.
             *
             * This is equivalent to pressing the left arrow key.
             */
            MenuBar.prototype.activatePreviousItem = function () {
                var fromIndex = Math.max(-1, this._activeIndex - 1);
                var i = algo.findLastIndex(this._items, isSelectable, fromIndex, true);
                this._setActiveIndex(i);
                var menu = this._childMenu;
                if (menu)
                    menu.activateNextItem();
            };
            /**
             * Activate the next menu item with the given mnemonic key.
             *
             * This is equivalent to pressing the mnemonic key.
             */
            MenuBar.prototype.activateMnemonicItem = function (key) {
                key = key.toUpperCase();
                var i = algo.findIndex(this._items, function (it) {
                    return isSelectable(it) && it.mnemonic.toUpperCase() === key;
                }, this._activeIndex + 1, true);
                this._setActiveIndex(i);
                var menu = this._childMenu;
                if (menu)
                    menu.activateNextItem();
            };
            /**
             * Open the submenu of the active menu item.
             *
             * This is equivalent to pressing the down arrow key.
             *
             * Returns true if the item was opened, false otherwise.
             */
            MenuBar.prototype.openActiveItem = function () {
                var index = this._activeIndex;
                var item = this._items[index];
                if (!item) {
                    return false;
                }
                this._setState(MBState.Active);
                this._setActiveIndex(index);
                var menu = this._childMenu;
                if (menu)
                    menu.activateNextItem();
                return true;
            };
            /**
             * Compute the size hint for the menu bar.
             */
            MenuBar.prototype.sizeHint = function () {
                return this.minSizeHint();
            };
            /**
             * Compute the minimum size hint for the menu bar.
             */
            MenuBar.prototype.minSizeHint = function () {
                return new Size(0, this.boxSizing.minHeight);
            };
            /**
             * Handle the DOM events for the menu bar.
             */
            MenuBar.prototype.handleEvent = function (event) {
                switch (event.type) {
                    case 'mousedown':
                        this._evtMouseDown(event);
                        break;
                    case 'mousemove':
                        this._evtMouseMove(event);
                        break;
                    case 'mouseleave':
                        this._evtMouseLeave(event);
                        break;
                    case 'keydown':
                        this._evtKeyDown(event);
                        break;
                    case 'keypress':
                        this._evtKeyPress(event);
                        break;
                }
            };
            /**
             * Create the DOM node for a MenuItem.
             *
             * This can be reimplemented to create custom menu item nodes.
             */
            MenuBar.prototype.createItemNode = function (item) {
                var node = document.createElement('li');
                var icon = document.createElement('span');
                var text = document.createElement('span');
                icon.className = ICON_CLASS;
                text.className = TEXT_CLASS;
                node.appendChild(icon);
                node.appendChild(text);
                this.initItemNode(item, node);
                return node;
            };
            /**
             * Initialize the DOM node for the given menu item.
             *
             * This method should be reimplemented if a subclass reimplements the
             * `createItemNode` method. It should initialize the node using the
             * given menu item. It will be called any time the item changes.
             */
            MenuBar.prototype.initItemNode = function (item, node) {
                var parts = [MENU_ITEM_CLASS];
                if (item.className) {
                    parts.push(item.className);
                }
                if (item.type === 'separator') {
                    parts.push(SEPARATOR_TYPE_CLASS);
                }
                if (!item.enabled) {
                    parts.push(DISABLED_CLASS);
                }
                if (!item.visible) {
                    parts.push(HIDDEN_CLASS);
                }
                node.className = parts.join(' ');
                node.children[1].textContent = item.text;
            };
            /**
             * A method invoked when a menu item is inserted into the menu.
             *
             * This method should be reimplemented if a subclass reimplements the
             * `createNode` method. It should insert the item node into the menu
             * at the specified location.
             */
            MenuBar.prototype.insertItemNode = function (index, node) {
                var content = this.node.firstChild;
                content.insertBefore(node, content.childNodes[index]);
            };
            /**
             * A method invoked when a menu item is removed from the menu.
             *
             * This method should be reimplemented if a subclass reimplements the
             * `createNode` method. It should remove the item node from the menu.
             */
            MenuBar.prototype.removeItemNode = function (node) {
                var content = this.node.firstChild;
                content.removeChild(node);
            };
            /**
             * A method invoked on the 'after-attach' message.
             */
            MenuBar.prototype.onAfterAttach = function (msg) {
                this.node.addEventListener('mousedown', this);
                this.node.addEventListener('mousemove', this);
                this.node.addEventListener('mouseleave', this);
            };
            /**
             * A method invoked on the 'after-detach' message.
             */
            MenuBar.prototype.onAfterDetach = function (msg) {
                this.node.removeEventListener('mousedown', this);
                this.node.removeEventListener('mousemove', this);
                this.node.removeEventListener('mouseleave', this);
            };
            /**
             * Handle the 'mousedown' event for the menu bar.
             */
            MenuBar.prototype._evtMouseDown = function (event) {
                var x = event.clientX;
                var y = event.clientY;
                if (this._state === MBState.Inactive) {
                    if (event.button !== 0) {
                        return;
                    }
                    var index = algo.findIndex(this._nodes, function (n) { return hitTest(n, x, y); });
                    if (!isSelectable(this._items[index])) {
                        return;
                    }
                    this._setState(MBState.Active);
                    this._setActiveIndex(index);
                }
                else {
                    if (hitTestMenus(this._childMenu, x, y)) {
                        return;
                    }
                    this._setState(MBState.Inactive);
                    var index = algo.findIndex(this._nodes, function (n) { return hitTest(n, x, y); });
                    var ok = isSelectable(this._items[index]);
                    this._setActiveIndex(ok ? index : -1);
                }
            };
            /**
             * Handle the 'mousemove' event for the menu bar.
             */
            MenuBar.prototype._evtMouseMove = function (event) {
                var x = event.clientX;
                var y = event.clientY;
                var index = algo.findIndex(this._nodes, function (n) { return hitTest(n, x, y); });
                if (index === this._activeIndex) {
                    return;
                }
                if (index === -1 && this._state === MBState.Active) {
                    return;
                }
                var ok = isSelectable(this._items[index]);
                this._setActiveIndex(ok ? index : -1);
            };
            /**
             * Handle the 'mouseleave' event for the menu bar.
             */
            MenuBar.prototype._evtMouseLeave = function (event) {
                if (this._state === MBState.Inactive) {
                    this._setActiveIndex(-1);
                }
            };
            /**
             * Handle the 'keydown' event for the menu bar.
             */
            MenuBar.prototype._evtKeyDown = function (event) {
                event.stopPropagation();
                var menu = this._childMenu;
                var leaf = menu && widgets.Menu.leafMenu(menu);
                switch (event.keyCode) {
                    case 13:
                        event.preventDefault();
                        if (leaf)
                            leaf.triggerActiveItem();
                        break;
                    case 27:
                        event.preventDefault();
                        if (leaf && leaf !== menu) {
                            leaf.close();
                        }
                        else {
                            this._setState(MBState.Inactive);
                            this._setActiveIndex(-1);
                        }
                        break;
                    case 37:
                        event.preventDefault();
                        if (leaf && leaf !== menu) {
                            leaf.close();
                        }
                        else {
                            this.activatePreviousItem();
                        }
                        break;
                    case 38:
                        event.preventDefault();
                        if (leaf)
                            leaf.activatePreviousItem();
                        break;
                    case 39:
                        event.preventDefault();
                        if (!leaf || !leaf.openActiveItem()) {
                            this.activateNextItem();
                        }
                        break;
                    case 40:
                        event.preventDefault();
                        if (leaf)
                            leaf.activateNextItem();
                        break;
                }
            };
            /**
             * Handle the 'keypress' event for the menu bar.
             */
            MenuBar.prototype._evtKeyPress = function (event) {
                event.preventDefault();
                event.stopPropagation();
                var str = String.fromCharCode(event.charCode);
                if (this._childMenu) {
                    widgets.Menu.leafMenu(this._childMenu).activateMnemonicItem(str);
                }
                else {
                    this.activateMnemonicItem(str);
                }
            };
            /**
             * Set the active item index for the menu bar.
             *
             * If the index points to an item, it is assumed to be selectable.
             *
             * This will take the appropriate action based on the menu bar state.
             */
            MenuBar.prototype._setActiveIndex = function (index) {
                var curr = this._nodes[this._activeIndex];
                var next = this._nodes[index];
                this._activeIndex = index;
                if (curr) {
                    curr.classList.remove(ACTIVE_CLASS);
                    curr.classList.remove(SELECTED_CLASS);
                }
                if (next) {
                    next.classList.add(ACTIVE_CLASS);
                }
                if (next && this._state !== MBState.Inactive) {
                    next.classList.add(SELECTED_CLASS);
                }
                this._closeChildMenu();
                if (!next || this._state !== MBState.Active) {
                    return;
                }
                var item = this._items[index];
                if (!item.submenu) {
                    return;
                }
                this._openChildMenu(item.submenu, next);
            };
            /**
             * Open the menu item's submenu using the node for location.
             */
            MenuBar.prototype._openChildMenu = function (menu, node) {
                var rect = node.getBoundingClientRect();
                this._childMenu = menu;
                menu.addClass(MENU_CLASS);
                menu.open(rect.left, rect.bottom, false, true);
                menu.closed.connect(this._p_closed, this);
            };
            /**
             * Close the current child menu, if one exists.
             */
            MenuBar.prototype._closeChildMenu = function () {
                if (this._childMenu) {
                    this._childMenu.closed.disconnect(this._p_closed, this);
                    this._childMenu.removeClass(MENU_CLASS);
                    this._childMenu.close();
                    this._childMenu = null;
                }
            };
            /**
             * Set the state mode for the menu bar.
             *
             * This will update the menu bar event listeners accordingly.
             */
            MenuBar.prototype._setState = function (state) {
                if (state === this._state) {
                    return;
                }
                if (state === MBState.Inactive) {
                    this._useInactiveListeners();
                }
                else {
                    this._useActiveListeners();
                }
                this._state = state;
            };
            /**
             * Update the event listeners for the inactive state.
             */
            MenuBar.prototype._useInactiveListeners = function () {
                var _this = this;
                setTimeout(function () {
                    _this.node.addEventListener('mousedown', _this);
                    document.removeEventListener('mousedown', _this, true);
                    document.removeEventListener('keydown', _this, true);
                    document.removeEventListener('keypress', _this, true);
                }, 0);
            };
            /**
             * Update the event listeners for the active and open states.
             */
            MenuBar.prototype._useActiveListeners = function () {
                var _this = this;
                setTimeout(function () {
                    _this.node.removeEventListener('mousedown', _this);
                    document.addEventListener('mousedown', _this, true);
                    document.addEventListener('keydown', _this, true);
                    document.addEventListener('keypress', _this, true);
                }, 0);
            };
            /**
             * Collapse neighboring visible separators.
             *
             * This force-hides select separator nodes such that there are never
             * multiple visible separator siblings. It also force-hides all any
             * leading and trailing separator nodes.
             */
            MenuBar.prototype._collapseSeparators = function () {
                var items = this._items;
                var nodes = this._nodes;
                var hideSeparator = true;
                var lastIndex = algo.findLastIndex(items, isVisibleItem);
                for (var i = 0, n = items.length; i < n; ++i) {
                    var item = items[i];
                    if (item.type === 'separator') {
                        if (hideSeparator || i > lastIndex) {
                            nodes[i].classList.add(FORCE_HIDDEN_CLASS);
                        }
                        else if (item.visible) {
                            nodes[i].classList.remove(FORCE_HIDDEN_CLASS);
                            hideSeparator = true;
                        }
                    }
                    else if (item.visible) {
                        hideSeparator = false;
                    }
                }
            };
            /**
             * Handle the `closed` signal from the child menu.
             */
            MenuBar.prototype._p_closed = function () {
                var menu = sender();
                menu.closed.disconnect(this._p_closed, this);
                menu.removeClass(MENU_CLASS);
                this._childMenu = null;
                this._setState(MBState.Inactive);
                this._setActiveIndex(-1);
            };
            /**
             * Handle the `changed` signal from a menu item.
             */
            MenuBar.prototype._p_changed = function () {
                var item = sender();
                var i = this.indexOf(item);
                if (i === -1) {
                    return;
                }
                if (i === this._activeIndex) {
                    this._setState(MBState.Inactive);
                    this._setActiveIndex(-1);
                }
                this.initItemNode(item, this._nodes[i]);
                this._collapseSeparators();
            };
            return MenuBar;
        })(widgets.Widget);
        widgets.MenuBar = MenuBar;
        /**
         * An internal enum describing the current state of the menu bar.
         */
        var MBState;
        (function (MBState) {
            MBState[MBState["Inactive"] = 0] = "Inactive";
            MBState[MBState["Active"] = 1] = "Active";
        })(MBState || (MBState = {}));
        ;
        /**
         * Test whether the menu item is a visible non-separator item.
         */
        function isVisibleItem(item) {
            return item && item.type !== 'separator' && item.visible;
        }
        /**
         * Test whether the menu bar item is selectable.
         *
         * Returns true if the item is a visible and enabled non-separator item.
         */
        function isSelectable(item) {
            return isVisibleItem(item) && item.enabled;
        }
        /**
         * Hit test the chain menus for the given client position.
         */
        function hitTestMenus(menu, x, y) {
            while (menu) {
                if (hitTest(menu.node, x, y)) {
                    return true;
                }
                menu = menu.childMenu;
            }
            return false;
        }
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var Message = phosphor.core.Message;
        var sendMessage = phosphor.core.sendMessage;
        var emptyObject = phosphor.utility.emptyObject;
        var render = phosphor.virtualdom.render;
        /**
         * The class name added to RenderWidget instances.
         */
        var RENDER_WIDGET_CLASS = 'p-RenderWidget';
        /**
         * A singleton 'before-render' message.
         */
        var MSG_BEFORE_RENDER = new Message('before-render');
        /**
         * A singleton 'after-render' message.
         */
        var MSG_AFTER_RENDER = new Message('after-render');
        // TODO - render null on detach to dispose vdom content?
        /**
         * A leaf widget which renders its content using the virtual DOM.
         *
         * This widget is used to embed virtual DOM content into a widget
         * hierarchy. A subclass should reimplement the `render` method to
         * generate the content for the widget. It should also reimplement
         * the `sizeHint` method to return a reasonable natural size.
         */
        var RenderWidget = (function (_super) {
            __extends(RenderWidget, _super);
            /**
             * Construct a new render widget.
             */
            function RenderWidget() {
                _super.call(this);
                this._refs = emptyObject;
                this.addClass(RENDER_WIDGET_CLASS);
                this.setFlag(widgets.WidgetFlag.DisallowLayoutChange);
            }
            /**
             * Dispose of the resources held by the widget.
             */
            RenderWidget.prototype.dispose = function () {
                this._refs = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(RenderWidget.prototype, "refs", {
                /**
                 * Get the current refs mapping for the widget.
                 */
                get: function () {
                    return this._refs;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Process a message sent to the widget.
             */
            RenderWidget.prototype.processMessage = function (msg) {
                switch (msg.type) {
                    case 'before-render':
                        this.onBeforeRender(msg);
                        break;
                    case 'after-render':
                        this.onAfterRender(msg);
                        break;
                    default:
                        _super.prototype.processMessage.call(this, msg);
                }
            };
            /**
             * Create the virtual DOM content for the widget.
             *
             * The rendered content is used to populate the widget's node.
             *
             * The default implementation returns `null`.
             */
            RenderWidget.prototype.render = function () {
                return null;
            };
            /**
             * A method invoked on an 'update-request' message.
             *
             * This renders the virtual DOM content into the widget's node.
             */
            RenderWidget.prototype.onUpdateRequest = function (msg) {
                sendMessage(this, MSG_BEFORE_RENDER);
                this._refs = render(this.render(), this.node);
                sendMessage(this, MSG_AFTER_RENDER);
            };
            /**
             * A method invoked on an 'after-attach' message.
             */
            RenderWidget.prototype.onAfterAttach = function (msg) {
                this.update(true);
            };
            /**
             * A method invoked on a 'before-render' message.
             *
             * The default implementation is a no-op.
             */
            RenderWidget.prototype.onBeforeRender = function (msg) { };
            /**
             * A method invoked on an 'after-render' message.
             *
             * The default implementation is a no-op.
             */
            RenderWidget.prototype.onAfterRender = function (msg) { };
            return RenderWidget;
        })(widgets.Widget);
        widgets.RenderWidget = RenderWidget;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var signal = phosphor.core.signal;
        var Size = phosphor.utility.Size;
        var overrideCursor = phosphor.utility.overrideCursor;
        /**
         * The class name added to ScrollBar instances.
         */
        var SCROLLBAR_CLASS = 'p-ScrollBar';
        /**
         * The class name assigned to a scroll bar slider.
         */
        var SLIDER_CLASS = 'p-ScrollBar-slider';
        /**
         * The class name added to an active scroll bar.
         */
        var ACTIVE_CLASS = 'p-mod-active';
        /**
         * The class name added to a horizontal scroll bar.
         */
        var HORIZONTAL_CLASS = 'p-mod-horizontal';
        /**
         * The class name added to a vertical scroll bar.
         */
        var VERTICAL_CLASS = 'p-mod-vertical';
        /**
         * A widget which provides a horizontal or vertical scroll bar.
         */
        var ScrollBar = (function (_super) {
            __extends(ScrollBar, _super);
            /**
             * Construct a new scroll bar.
             *
             * @param orientation - The orientation of the scroll bar.
             */
            function ScrollBar(orientation) {
                if (orientation === void 0) { orientation = widgets.Orientation.Vertical; }
                _super.call(this);
                this._value = 0;
                this._minimum = 0;
                this._maximum = 99;
                this._pageSize = 1;
                this._sliderMinSize = -1;
                this._dragData = null;
                this.addClass(SCROLLBAR_CLASS);
                this._orientation = orientation;
                this.setFlag(widgets.WidgetFlag.DisallowLayoutChange);
                if (orientation === widgets.Orientation.Horizontal) {
                    this.addClass(HORIZONTAL_CLASS);
                    this.setSizePolicy(widgets.SizePolicy.Expanding, widgets.SizePolicy.Fixed);
                }
                else {
                    this.addClass(VERTICAL_CLASS);
                    this.setSizePolicy(widgets.SizePolicy.Fixed, widgets.SizePolicy.Expanding);
                }
            }
            /**
             * Create the DOM node for a scroll bar.
             */
            ScrollBar.createNode = function () {
                var node = document.createElement('div');
                var slider = document.createElement('div');
                slider.className = SLIDER_CLASS;
                node.appendChild(slider);
                return node;
            };
            Object.defineProperty(ScrollBar.prototype, "orientation", {
                /**
                 * Get the orientation of the scroll bar.
                 */
                get: function () {
                    return this._orientation;
                },
                /**
                 * Set the orientation of the scroll bar.
                 */
                set: function (orientation) {
                    if (orientation === this._orientation) {
                        return;
                    }
                    this._sliderMinSize = -1;
                    this._orientation = orientation;
                    if (orientation === widgets.Orientation.Horizontal) {
                        this.removeClass(VERTICAL_CLASS);
                        this.addClass(HORIZONTAL_CLASS);
                        this.setSizePolicy(widgets.SizePolicy.Expanding, widgets.SizePolicy.Fixed);
                    }
                    else {
                        this.removeClass(HORIZONTAL_CLASS);
                        this.addClass(VERTICAL_CLASS);
                        this.setSizePolicy(widgets.SizePolicy.Fixed, widgets.SizePolicy.Expanding);
                    }
                    this.invalidateBoxSizing();
                    this.update();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ScrollBar.prototype, "minimum", {
                /**
                 * Get the minimum value of the scroll bar.
                 */
                get: function () {
                    return this._minimum;
                },
                /**
                 * Set the minimum value of the scroll bar.
                 */
                set: function (minimum) {
                    if (minimum === this._minimum) {
                        return;
                    }
                    this._minimum = minimum;
                    this._maximum = Math.max(minimum, this._maximum);
                    this._value = Math.max(minimum, Math.min(this._value, this._maximum));
                    this.update();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ScrollBar.prototype, "maximum", {
                /**
                 * Get the maximum value of the scroll bar.
                 */
                get: function () {
                    return this._maximum;
                },
                /**
                 * Set the maximum value of the scroll bar.
                 */
                set: function (maximum) {
                    if (maximum === this._maximum) {
                        return;
                    }
                    this._maximum = maximum;
                    this._minimum = Math.min(this._minimum, maximum);
                    this._value = Math.max(this._minimum, Math.min(this._value, maximum));
                    this.update();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ScrollBar.prototype, "value", {
                /**
                 * Get the current value of the scroll bar.
                 */
                get: function () {
                    return this._value;
                },
                /**
                 * Set the current value of the scroll bar.
                 */
                set: function (value) {
                    value = Math.max(this._minimum, Math.min(value, this._maximum));
                    if (value === this._value) {
                        return;
                    }
                    this._value = value;
                    this.update();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ScrollBar.prototype, "pageSize", {
                /**
                 * Get the page size of the scroll bar.
                 */
                get: function () {
                    return this._pageSize;
                },
                /**
                 * Set the page size of the scroll bar.
                 *
                 * The page size controls the size of the slider control in relation
                 * to the current scroll bar range. It should be set to a value which
                 * represents a single "page" of content. This is the amount that the
                 * slider will move when the user clicks inside the scroll bar track.
                 */
                set: function (size) {
                    size = Math.max(0, size);
                    if (size === this._pageSize) {
                        return;
                    }
                    this._pageSize = size;
                    this.update();
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Calculate the preferred size for the scroll bar.
             */
            ScrollBar.prototype.sizeHint = function () {
                var size;
                if (this._orientation === widgets.Orientation.Horizontal) {
                    size = new Size(0, this.boxSizing.minHeight);
                }
                else {
                    size = new Size(this.boxSizing.minWidth, 0);
                }
                return size;
            };
            /**
             * Handle the DOM events for the scroll bar.
             */
            ScrollBar.prototype.handleEvent = function (event) {
                switch (event.type) {
                    case 'mousedown':
                        this._evtMouseDown(event);
                        break;
                    case 'mousemove':
                        this._evtMouseMove(event);
                        break;
                    case 'mouseup':
                        this._evtMouseUp(event);
                        break;
                }
            };
            /**
             * A method invoked on an 'after-attach' message.
             */
            ScrollBar.prototype.onAfterAttach = function (msg) {
                this.node.addEventListener('mousedown', this);
                this._sliderMinSize = -1;
            };
            /**
             * A method invoked on an 'after-detach' message.
             */
            ScrollBar.prototype.onAfterDetach = function (msg) {
                this.node.removeEventListener('mousedown', this);
            };
            /**
             * A method invoked on a 'resize' message.
             */
            ScrollBar.prototype.onResize = function (msg) {
                this.update(true);
            };
            /**
             * A method invoked on an 'update-request' message.
             */
            ScrollBar.prototype.onUpdateRequest = function (msg) {
                // Hide the slider if there is no room to scroll.
                var style = this.node.firstChild.style;
                if (this._minimum === this._maximum) {
                    style.display = 'none';
                    return;
                }
                // Compute the effective geometry of the scroll bar track.
                var trackPos;
                var trackSize;
                var box = this.boxSizing;
                if (this._orientation === widgets.Orientation.Horizontal) {
                    trackPos = box.paddingLeft;
                    trackSize = this.width - box.horizontalSum;
                }
                else {
                    trackPos = box.paddingTop;
                    trackSize = this.height - box.verticalSum;
                }
                // Compute the size of the slider bounded by its minimum.
                var minSize = this._getSliderMinSize();
                var span = this._maximum - this._minimum;
                var size = (this._pageSize * trackSize) / (span + this._pageSize);
                size = Math.max(minSize, size);
                // Compute the position of slider bounded by the track limit.
                var pos = (this._value / span) * (trackSize - size);
                if (size + pos > trackSize) {
                    pos = trackSize - size;
                }
                // Hide the slider if it cannot fit in the available space.
                if (pos < 0) {
                    style.display = 'none';
                    return;
                }
                // Update the position and size of the slider.
                style.display = '';
                if (this._orientation === widgets.Orientation.Horizontal) {
                    style.top = '';
                    style.left = trackPos + pos + 'px';
                    style.width = size + 'px';
                    style.height = '';
                }
                else {
                    style.top = trackPos + pos + 'px';
                    style.left = '';
                    style.width = '';
                    style.height = size + 'px';
                }
            };
            /**
             * Handle the 'mousedown' event for the scroll bar.
             */
            ScrollBar.prototype._evtMouseDown = function (event) {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                // Compute the geometry of the slider track and slider. The mouse
                // and slider positions are normalized to local track coordinates.
                var mousePos;
                var trackSize;
                var sliderPos;
                var sliderEnd;
                var sliderSize;
                var box = this.boxSizing;
                var rect = this.node.getBoundingClientRect();
                var slider = this.node.firstChild;
                var sliderRect = slider.getBoundingClientRect();
                if (this._orientation === widgets.Orientation.Horizontal) {
                    mousePos = event.clientX - rect.left - box.paddingLeft;
                    trackSize = this.width - box.horizontalSum;
                    sliderPos = sliderRect.left - rect.left - box.paddingLeft;
                    sliderEnd = sliderRect.right - rect.left - box.paddingLeft;
                    sliderSize = sliderRect.width;
                }
                else {
                    mousePos = event.clientY - rect.top - box.paddingTop;
                    trackSize = this.height - box.verticalSum;
                    sliderPos = sliderRect.top - rect.top - box.paddingTop;
                    sliderEnd = sliderRect.bottom - rect.top - box.paddingTop;
                    sliderSize = sliderRect.height;
                }
                // If the shift key is pressed and the position of the mouse does
                // not not intersect the slider, scroll directly to the indicated
                // position such that the middle of the slider is located at the
                // mouse position.
                if (event.shiftKey && (mousePos < sliderPos || mousePos >= sliderEnd)) {
                    var perc = (mousePos - sliderSize / 2) / (trackSize - sliderSize);
                    this._scrollTo(perc * (this._maximum - this._minimum));
                    return;
                }
                // If the mouse position is less than the slider, page down.
                if (mousePos < sliderPos) {
                    this._scrollTo(this._value - this._pageSize);
                    return;
                }
                // If the mouse position is greater than the slider, page up.
                if (mousePos >= sliderEnd) {
                    this._scrollTo(this._value + this._pageSize);
                    return;
                }
                // Otherwise, the mouse is over the slider and the drag is started.
                this.addClass(ACTIVE_CLASS);
                var pressOffset = mousePos - sliderPos;
                var cursorGrab = overrideCursor('default');
                this._dragData = { pressOffset: pressOffset, cursorGrab: cursorGrab };
                document.addEventListener('mousemove', this, true);
                document.addEventListener('mouseup', this, true);
            };
            /**
             * Handle the 'mousemove' event for the scroll bar.
             */
            ScrollBar.prototype._evtMouseMove = function (event) {
                var mousePos;
                var trackSize;
                var sliderSize;
                var box = this.boxSizing;
                var rect = this.node.getBoundingClientRect();
                var slider = this.node.firstChild;
                var sliderRect = slider.getBoundingClientRect();
                if (this._orientation === widgets.Orientation.Horizontal) {
                    mousePos = event.clientX - rect.left - box.paddingLeft;
                    trackSize = this.width - box.horizontalSum;
                    sliderSize = sliderRect.width;
                }
                else {
                    mousePos = event.clientY - rect.top - box.paddingTop;
                    trackSize = this.height - box.verticalSum;
                    sliderSize = sliderRect.height;
                }
                var pressOffset = this._dragData.pressOffset;
                var perc = (mousePos - pressOffset) / (trackSize - sliderSize);
                this._scrollTo(perc * (this._maximum - this._minimum));
            };
            /**
             * Handle the 'mouseup' event for the scroll bar.
             */
            ScrollBar.prototype._evtMouseUp = function (event) {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                document.removeEventListener('mousemove', this, true);
                document.removeEventListener('mouseup', this, true);
                this.removeClass(ACTIVE_CLASS);
                if (this._dragData) {
                    this._dragData.cursorGrab.dispose();
                    this._dragData = null;
                }
            };
            /**
             * Scroll to the given value expressed in scroll coordinates.
             *
             * The given value will be clamped to the scroll bar range. If the
             * adjusted value is different from the current value, the scroll
             * bar will be updated and the `sliderMoved` signal will be emitted.
             */
            ScrollBar.prototype._scrollTo = function (value) {
                value = Math.max(this._minimum, Math.min(value, this._maximum));
                if (value === this._value) {
                    return;
                }
                this._value = value;
                this.update(true);
                this.sliderMoved.emit(value);
            };
            /**
             * Get the minimum size of the slider for the current orientation.
             *
             * This computes the value once and caches it, which ensures that
             * multiple calls to this method are quick. The cached value can
             * be cleared by setting the `_sliderMinSize` property to `-1`.
             */
            ScrollBar.prototype._getSliderMinSize = function () {
                if (this._sliderMinSize === -1) {
                    var style = window.getComputedStyle(this.node.firstChild);
                    if (this._orientation === widgets.Orientation.Horizontal) {
                        this._sliderMinSize = parseInt(style.minWidth, 10) || 0;
                    }
                    else {
                        this._sliderMinSize = parseInt(style.minHeight, 10) || 0;
                    }
                }
                return this._sliderMinSize;
            };
            __decorate([
                signal
            ], ScrollBar.prototype, "sliderMoved");
            return ScrollBar;
        })(widgets.Widget);
        widgets.ScrollBar = ScrollBar;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var NodeBase = phosphor.core.NodeBase;
        /**
         * The class name added to Tab instances.
         */
        var TAB_CLASS = 'p-Tab';
        /**
         * The class name assigned to a tab text sub element.
         */
        var TEXT_CLASS = 'p-Tab-text';
        /**
         * The class name assigned to a tab icon sub element.
         */
        var ICON_CLASS = 'p-Tab-icon';
        /**
         * The class name assigned to a tab close icon sub element.
         */
        var CLOSE_ICON_CLASS = 'p-Tab-close-icon';
        /**
         * The class name added to the selected tab.
         */
        var SELECTED_CLASS = 'p-mod-selected';
        /**
         * The class name added to a closable tab.
         */
        var CLOSABLE_CLASS = 'p-mod-closable';
        /**
         * An object which manages a node for a tab bar.
         */
        var Tab = (function (_super) {
            __extends(Tab, _super);
            /**
             * Construct a new tab.
             */
            function Tab(text) {
                _super.call(this);
                this.addClass(TAB_CLASS);
                if (text)
                    this.text = text;
            }
            /**
             * Create the DOM node for a tab.
             */
            Tab.createNode = function () {
                var node = document.createElement('li');
                var icon = document.createElement('span');
                var text = document.createElement('span');
                var closeIcon = document.createElement('span');
                icon.className = ICON_CLASS;
                text.className = TEXT_CLASS;
                closeIcon.className = CLOSE_ICON_CLASS;
                node.appendChild(icon);
                node.appendChild(text);
                node.appendChild(closeIcon);
                return node;
            };
            Object.defineProperty(Tab.prototype, "text", {
                /**
                 * Get the text for the tab.
                 */
                get: function () {
                    return this.node.children[1].textContent;
                },
                /**
                 * Set the text for the tab.
                 */
                set: function (text) {
                    this.node.children[1].textContent = text;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tab.prototype, "selected", {
                /**
                 * Get whether the tab is selected.
                 */
                get: function () {
                    return this.hasClass(SELECTED_CLASS);
                },
                /**
                 * Set whether the tab is selected.
                 */
                set: function (selected) {
                    if (selected) {
                        this.addClass(SELECTED_CLASS);
                    }
                    else {
                        this.removeClass(SELECTED_CLASS);
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tab.prototype, "closable", {
                /**
                 * Get whether the tab is closable.
                 */
                get: function () {
                    return this.hasClass(CLOSABLE_CLASS);
                },
                /**
                 * Set whether the tab is closable.
                 */
                set: function (closable) {
                    if (closable) {
                        this.addClass(CLOSABLE_CLASS);
                    }
                    else {
                        this.removeClass(CLOSABLE_CLASS);
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tab.prototype, "closeIconNode", {
                /**
                 * Get the DOM node for the tab close icon.
                 */
                get: function () {
                    return this.node.lastChild;
                },
                enumerable: true,
                configurable: true
            });
            return Tab;
        })(NodeBase);
        widgets.Tab = Tab;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var algo = phosphor.collections.algorithm;
        var signal = phosphor.core.signal;
        var Pair = phosphor.utility.Pair;
        var Size = phosphor.utility.Size;
        var hitTest = phosphor.utility.hitTest;
        var overrideCursor = phosphor.utility.overrideCursor;
        /**
         * The class name added to TabBar instances.
         */
        var TAB_BAR_CLASS = 'p-TabBar';
        /**
         * The class name added to the tab bar header div.
         */
        var HEADER_CLASS = 'p-TabBar-header';
        /**
         * The class name added to the tab bar content list.
         */
        var CONTENT_CLASS = 'p-TabBar-content';
        /**
         * The class name added to the tab bar footer div.
         */
        var FOOTER_CLASS = 'p-TabBar-footer';
        /**
         * The class name added to the content div when transitioning tabs.
         */
        var TRANSITION_CLASS = 'p-mod-transition';
        /**
         * The class name added to a tab being inserted.
         */
        var INSERTING_CLASS = 'p-mod-inserting';
        /**
         * The class name added to a tab being removed.
         */
        var REMOVING_CLASS = 'p-mod-removing';
        /**
         * The overlap threshold before swapping tabs.
         */
        var OVERLAP_THRESHOLD = 0.6;
        /**
         * The start drag distance threshold.
         */
        var DRAG_THRESHOLD = 5;
        /**
         * The detach distance threshold.
         */
        var DETACH_THRESHOLD = 20;
        /**
         * The tab transition duration.
         */
        var TRANSITION_DURATION = 150;
        /**
         * The size of a collapsed tab stub.
         */
        var TAB_STUB_SIZE = 7;
        /**
         * A leaf widget which displays a row of tabs.
         */
        var TabBar = (function (_super) {
            __extends(TabBar, _super);
            /**
             * Construct a new tab bar.
             */
            function TabBar(options) {
                _super.call(this);
                this._tabWidth = 175;
                this._tabOverlap = 0;
                this._minTabWidth = 45;
                this._tabs = [];
                this._tabsMovable = true;
                this._currentTab = null;
                this._previousTab = null;
                this._dragData = null;
                this.addClass(TAB_BAR_CLASS);
                this.verticalSizePolicy = widgets.SizePolicy.Fixed;
                this.setFlag(widgets.WidgetFlag.DisallowLayoutChange);
                if (options)
                    this._initFrom(options);
            }
            /**
             * Create the DOM node for a tab bar.
             */
            TabBar.createNode = function () {
                var node = document.createElement('div');
                var header = document.createElement('div');
                var content = document.createElement('ul');
                var footer = document.createElement('div');
                header.className = HEADER_CLASS;
                content.className = CONTENT_CLASS;
                footer.className = FOOTER_CLASS;
                node.appendChild(header);
                node.appendChild(content);
                node.appendChild(footer);
                return node;
            };
            /*
             * Dispose of the resources held by the widget.
             */
            TabBar.prototype.dispose = function () {
                this._releaseMouse();
                this._previousTab = null;
                this._currentTab = null;
                this._tabs = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(TabBar.prototype, "currentIndex", {
                /**
                 * Get the currently selected tab index.
                 */
                get: function () {
                    return this.indexOf(this.currentTab);
                },
                /**
                 * Set the currently selected tab index.
                 */
                set: function (index) {
                    var prev = this._currentTab;
                    var next = this.tabAt(index) || null;
                    if (prev === next) {
                        return;
                    }
                    if (prev)
                        prev.selected = false;
                    if (next)
                        next.selected = true;
                    this._currentTab = next;
                    this._previousTab = prev;
                    this._updateTabZOrder();
                    this.currentChanged.emit(new Pair(next ? index : -1, next));
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabBar.prototype, "currentTab", {
                /**
                 * Get the currently selected tab.
                 */
                get: function () {
                    return this._currentTab;
                },
                /**
                 * Set the currently selected tab.
                 */
                set: function (tab) {
                    this.currentIndex = this.indexOf(tab);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabBar.prototype, "previousTab", {
                /**
                 * Get the previously selected tab.
                 */
                get: function () {
                    return this._previousTab;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabBar.prototype, "tabsMovable", {
                /**
                 * Get whether the tabs are movable by the user.
                 */
                get: function () {
                    return this._tabsMovable;
                },
                /**
                 * Set whether the tabs are movable by the user.
                 */
                set: function (movable) {
                    if (movable === this._tabsMovable) {
                        return;
                    }
                    this._tabsMovable = movable;
                    if (!movable) {
                        this._releaseMouse();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabBar.prototype, "tabWidth", {
                /**
                 * Get the preferred tab width.
                 *
                 * Tabs will be sized to this width if possible, but never larger.
                 */
                get: function () {
                    return this._tabWidth;
                },
                /**
                 * Set the preferred tab width.
                 *
                 * Tabs will be sized to this width if possible, but never larger.
                 */
                set: function (width) {
                    width = Math.max(0, width);
                    if (width === this._tabWidth) {
                        return;
                    }
                    this._tabWidth = width;
                    if (this.isAttached) {
                        this.updateGeometry();
                        this.update();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabBar.prototype, "minTabWidth", {
                /**
                 * Get the minimum tab width.
                 *
                 * Tabs will never be sized smaller than this amount.
                 */
                get: function () {
                    return this._minTabWidth;
                },
                /**
                 * Set the minimum tab width.
                 *
                 * Tabs will never be sized smaller than this amount.
                 */
                set: function (width) {
                    width = Math.max(0, width);
                    if (width === this._minTabWidth) {
                        return;
                    }
                    this._minTabWidth = width;
                    if (this.isAttached) {
                        this.updateGeometry();
                        this.update();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabBar.prototype, "tabOverlap", {
                /**
                 * Get the tab overlap amount.
                 *
                 * A positive value will cause neighboring tabs to overlap.
                 * A negative value will insert empty space between tabs.
                 */
                get: function () {
                    return this._tabOverlap;
                },
                /**
                 * Set the tab overlap amount.
                 *
                 * A positive value will cause neighboring tabs to overlap.
                 * A negative value will insert empty space between tabs.
                 */
                set: function (overlap) {
                    if (overlap === this._tabOverlap) {
                        return;
                    }
                    this._tabOverlap = overlap;
                    if (this.isAttached) {
                        this.updateGeometry();
                        this.update();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabBar.prototype, "count", {
                /**
                 * Get the number of tabs in the tab bar.
                 */
                get: function () {
                    return this._tabs.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the tab at the given index.
             */
            TabBar.prototype.tabAt = function (index) {
                return this._tabs[index];
            };
            /**
             * Get the index of the given tab.
             */
            TabBar.prototype.indexOf = function (tab) {
                return algo.indexOf(this._tabs, tab);
            };
            /**
             * Add a tab to the end of the tab bar.
             *
             * Returns the index of the tab.
             */
            TabBar.prototype.addTab = function (tab) {
                return this.insertTab(this.count, tab);
            };
            /**
             * Insert a tab into the tab bar at the given index.
             *
             * Returns the index of the tab.
             */
            TabBar.prototype.insertTab = function (index, tab) {
                var fromIndex = this.indexOf(tab);
                if (fromIndex !== -1) {
                    index = this._moveTab(fromIndex, index);
                }
                else {
                    index = this._insertTab(index, tab, true);
                }
                return index;
            };
            /**
             * Move a tab from one index to another.
             *
             * Returns the new tab index.
             */
            TabBar.prototype.moveTab = function (fromIndex, toIndex) {
                return this._moveTab(fromIndex, toIndex);
            };
            /**
             * Remove and return the tab at the given index.
             *
             * Returns `undefined` if the index is out of range.
             */
            TabBar.prototype.removeAt = function (index) {
                return this._removeTab(index, true);
            };
            /**
             * Remove a tab from the tab bar and return its index.
             *
             * Returns -1 if the tab is not in the tab bar.
             */
            TabBar.prototype.removeTab = function (tab) {
                var i = this.indexOf(tab);
                if (i !== -1)
                    this._removeTab(i, true);
                return i;
            };
            /**
             * Remove all of the tabs from the tab bar.
             */
            TabBar.prototype.clearTabs = function () {
                while (this.count) {
                    this._removeTab(this.count - 1, false);
                }
            };
            /**
             * Add a tab to the tab bar at the given client X position.
             *
             * This method is intended for use by code which supports tear-off
             * tab interfaces. It will insert the tab at the specified location
             * without a transition and grab the mouse to continue the tab drag.
             * It assumes that the left mouse button is currently pressed.
             *
             * This is a no-op if the tab is already added to the tab bar.
             */
            TabBar.prototype.attachTab = function (tab, clientX) {
                // Do nothing if the tab is already attached to the tab bar.
                if (this.indexOf(tab) !== -1) {
                    return;
                }
                // Compute the insert index for the given client position.
                var contentNode = this.contentNode;
                var contentRect = contentNode.getBoundingClientRect();
                var localX = clientX - contentRect.left;
                var index = localX / (this._tabLayoutWidth() - this._tabOverlap);
                index = Math.max(0, Math.min(Math.round(index), this.count));
                // Insert and select the tab and install the mouse listeners.
                this._insertTab(index, tab, false);
                this.currentIndex = index;
                document.addEventListener('mouseup', this, true);
                document.addEventListener('mousemove', this, true);
                // Bail early if the tabs are not movable.
                if (!this._tabsMovable) {
                    return;
                }
                // Setup the drag data object.
                var tlw = this._tabLayoutWidth();
                var offsetX = Math.floor(0.4 * tlw);
                var clientY = contentRect.top + Math.floor(0.5 * contentRect.height);
                var cursorGrab = overrideCursor('default');
                this._dragData = {
                    node: tab.node,
                    pressX: clientX,
                    pressY: clientY,
                    offsetX: offsetX,
                    contentRect: contentRect,
                    cursorGrab: cursorGrab,
                    dragActive: true,
                    detachRequested: false,
                };
                // Move the tab to its target position.
                var tgtLeft = localX - offsetX;
                var maxLeft = contentRect.width - tlw;
                var tabLeft = Math.max(0, Math.min(tgtLeft, maxLeft));
                var tabStyle = tab.node.style;
                contentNode.classList.add(TRANSITION_CLASS);
                tabStyle.transition = 'none';
                tabStyle.left = tabLeft + 'px';
                this.update(true);
            };
            /**
             * Detach and return the tab at the given index.
             *
             * This method is intended for use by code which supports tear-off
             * tab interfaces. It will remove the tab at the specified index
             * without a transition.
             *
             * Returns `undefined` if the index is invalid.
             */
            TabBar.prototype.detachAt = function (index) {
                return this._removeTab(index, false);
            };
            /**
             * Compute the size hint for the tab bar.
             */
            TabBar.prototype.sizeHint = function () {
                var width = 0;
                var count = this.count;
                if (count > 0) {
                    width = this._tabWidth * count - this._tabOverlap * (count - 1);
                }
                return new Size(width, this.boxSizing.minHeight);
            };
            /**
             * Compute the minimum size hint for the tab bar.
             */
            TabBar.prototype.minSizeHint = function () {
                var width = 0;
                var count = this.count;
                if (count > 0) {
                    width = this._minTabWidth + TAB_STUB_SIZE * (count - 1);
                }
                return new Size(width, this.boxSizing.minHeight);
            };
            /**
             * Handle the DOM events for the tab bar.
             */
            TabBar.prototype.handleEvent = function (event) {
                switch (event.type) {
                    case 'click':
                        this._evtClick(event);
                        break;
                    case 'mousedown':
                        this._evtMouseDown(event);
                        break;
                    case 'mousemove':
                        this._evtMouseMove(event);
                        break;
                    case 'mouseup':
                        this._evtMouseUp(event);
                        break;
                }
            };
            Object.defineProperty(TabBar.prototype, "contentNode", {
                /**
                 * Get the content node for the tab bar.
                 */
                get: function () {
                    return this.node.firstChild.nextSibling;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * A method invoked on an 'after-attach' message.
             */
            TabBar.prototype.onAfterAttach = function (msg) {
                var node = this.node;
                node.addEventListener('mousedown', this);
                node.addEventListener('click', this);
            };
            /**
             * A method invoked on an 'after-dettach' message.
             */
            TabBar.prototype.onAfterDetach = function (msg) {
                var node = this.node;
                node.removeEventListener('mousedown', this);
                node.removeEventListener('click', this);
            };
            /**
             * A method invoked on a 'resize' message.
             */
            TabBar.prototype.onResize = function (msg) {
                this.update(true);
            };
            /**
             * A method invoked on an 'update-request' message.
             */
            TabBar.prototype.onUpdateRequest = function (msg) {
                var dragNode = null;
                if (this._dragData && this._dragData.dragActive) {
                    dragNode = this._dragData.node;
                }
                var left = 0;
                var tabs = this._tabs;
                var width = this.width;
                var overlap = this._tabOverlap;
                var tlw = this._tabLayoutWidth();
                for (var i = 0, n = tabs.length; i < n; ++i) {
                    var node = tabs[i].node;
                    var style = node.style;
                    if (node !== dragNode) {
                        var offset = tlw + TAB_STUB_SIZE * (n - i - 1);
                        if ((left + offset) > width) {
                            left = Math.max(0, width - offset);
                        }
                        style.left = left + 'px';
                    }
                    style.width = tlw + 'px';
                    left += tlw - overlap;
                }
            };
            /**
             * Handle the 'click' event for the tab bar.
             */
            TabBar.prototype._evtClick = function (event) {
                // Do nothing if it's not a left click.
                if (event.button !== 0) {
                    return;
                }
                // Do nothing if the click is not on a tab.
                var index = this._hitTest(event.clientX, event.clientY);
                if (index < 0) {
                    return;
                }
                // Clicking on a tab stops the event propagation.
                event.preventDefault();
                event.stopPropagation();
                // If the click was on the close icon of a closable tab,
                // emit the `tabCloseRequested` signal.
                var tab = this._tabs[index];
                if (tab.closable && tab.closeIconNode === event.target) {
                    this.tabCloseRequested.emit(new Pair(index, tab));
                }
            };
            /**
             * Handle the 'mousedown' event for the tab bar.
             */
            TabBar.prototype._evtMouseDown = function (event) {
                // Do nothing if it's not a left mouse press.
                if (event.button !== 0) {
                    return;
                }
                // Do nothing of the press is not on a tab.
                var clientX = event.clientX;
                var clientY = event.clientY;
                var index = this._hitTest(clientX, clientY);
                if (index < 0) {
                    return;
                }
                // Pressing on a tab stops the event propagation.
                event.preventDefault();
                event.stopPropagation();
                // Do nothing further if the press was on the tab close icon.
                var tab = this._tabs[index];
                if (tab.closeIconNode === event.target) {
                    return;
                }
                // Setup the drag data if the tabs are movable.
                if (this._tabsMovable) {
                    var offsetX = clientX - tab.node.getBoundingClientRect().left;
                    this._dragData = {
                        node: tab.node,
                        pressX: clientX,
                        pressY: clientY,
                        offsetX: offsetX,
                        contentRect: null,
                        cursorGrab: null,
                        dragActive: false,
                        detachRequested: false,
                    };
                }
                // Select the tab and install the other mouse event listeners.
                this.currentIndex = index;
                document.addEventListener('mouseup', this, true);
                document.addEventListener('mousemove', this, true);
            };
            /**
             * Handle the 'mousemove' event for the tab bar.
             */
            TabBar.prototype._evtMouseMove = function (event) {
                // Mouse move events are never propagated since this handler is
                // only installed when during a left-mouse-drag operation. Bail
                // early if the tabs are not movable or there is no drag data.
                event.preventDefault();
                event.stopPropagation();
                if (!this._tabsMovable || !this._dragData) {
                    return;
                }
                // Setup common variables
                var clientX = event.clientX;
                var clientY = event.clientY;
                var data = this._dragData;
                // Check to see if the drag threshold has been exceeded, and
                // start the tab drag operation the first time that occurrs.
                if (!data.dragActive) {
                    var dx = Math.abs(clientX - data.pressX);
                    var dy = Math.abs(clientY - data.pressY);
                    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
                        return;
                    }
                    // Fill in the missing drag data.
                    var contentNode = this.contentNode;
                    data.contentRect = contentNode.getBoundingClientRect();
                    data.cursorGrab = overrideCursor('default');
                    data.dragActive = true;
                    // Setup the styles for the drag.
                    contentNode.classList.add(TRANSITION_CLASS);
                    data.node.style.transition = 'none';
                }
                // Check to see if the detach threshold has been exceeded, and
                // emit the detach request signal the first time that occurrs.
                if (!data.detachRequested) {
                    if (!inBounds(data.contentRect, DETACH_THRESHOLD, clientX, clientY)) {
                        // Update the data nad emit the `tabDetachRequested` signal.
                        data.detachRequested = true;
                        this.tabDetachRequested.emit({
                            tab: this.currentTab,
                            index: this.currentIndex,
                            clientX: clientX,
                            clientY: clientY,
                        });
                        // If the drag data is null, it means the mouse was released due
                        // to the tab being detached and the move operation has ended.
                        if (!this._dragData) {
                            return;
                        }
                    }
                }
                // Compute the natural position of the current tab, absent any
                // influence from the mouse drag.
                var index = this.currentIndex;
                var tlw = this._tabLayoutWidth();
                var naturalX = index * (tlw - this._tabOverlap);
                // Compute the upper and lower bound on the natural tab position
                // which would cause the tab to swap position with its neighbor.
                var lowerBound = naturalX - tlw * OVERLAP_THRESHOLD;
                var upperBound = naturalX + tlw * OVERLAP_THRESHOLD;
                // Compute the actual target mouse position of the tab.
                var localX = clientX - data.contentRect.left - data.offsetX;
                var targetX = Math.max(0, Math.min(localX, data.contentRect.width - tlw));
                // Swap the position of the tab if it exceeds a threshold.
                if (targetX < lowerBound) {
                    this._moveTab(index, index - 1);
                }
                else if (targetX > upperBound) {
                    this._moveTab(index, index + 1);
                }
                // Move the tab to its target position.
                data.node.style.left = targetX + 'px';
            };
            /**
             * Handle the 'mouseup' event for the tab bar.
             */
            TabBar.prototype._evtMouseUp = function (event) {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                this._releaseMouse();
            };
            /**
             * Release the current mouse grab for the tab bar.
             */
            TabBar.prototype._releaseMouse = function () {
                var _this = this;
                // Do nothing if the mouse has already been released.
                var data = this._dragData;
                if (!data) {
                    return;
                }
                // Clear the drag data and remove the extra listeners.
                this._dragData = null;
                document.removeEventListener('mouseup', this, true);
                document.removeEventListener('mousemove', this, true);
                // Reset the state and layout to the non-drag state.
                if (data.dragActive) {
                    data.cursorGrab.dispose();
                    data.node.style.transition = '';
                    this._withTransition(function () { return _this.update(true); });
                }
            };
            /**
             * Insert a new tab into the tab bar at the given index.
             *
             * This method assumes that the tab has not already been added.
             */
            TabBar.prototype._insertTab = function (index, tab, animate) {
                var _this = this;
                // Insert the tab into the array.
                index = algo.insert(this._tabs, index, tab);
                // Ensure the tab is deselected and add it to the DOM.
                tab.selected = false;
                this.contentNode.appendChild(tab.node);
                // Select this tab if there are no selected tabs. Otherwise,
                // update the tab Z-order to account for the new tab.
                if (!this._currentTab) {
                    this.currentTab = tab;
                }
                else {
                    this._updateTabZOrder();
                }
                // If the tab bar is not attached, there is nothing left to do.
                if (!this.isAttached) {
                    return index;
                }
                // Animate the tab insert and and layout as appropriate.
                if (animate) {
                    this._withTransition(function () {
                        tab.addClass(INSERTING_CLASS);
                        _this.update(true);
                    }, function () {
                        tab.removeClass(INSERTING_CLASS);
                    });
                }
                else {
                    this._withTransition(function () { return _this.update(true); });
                }
                // Notify the layout system that the widget geometry is dirty.
                this.updateGeometry();
                return index;
            };
            /**
             * Move an item to a new index in the tab bar.
             *
             * Returns the new index of the tab, or -1.
             */
            TabBar.prototype._moveTab = function (fromIndex, toIndex) {
                var _this = this;
                // Move the tab to its new location.
                toIndex = algo.move(this._tabs, fromIndex, toIndex);
                // Bail if the index is invalid.
                if (toIndex === -1) {
                    return -1;
                }
                // Update the tab Z-order to account for the new order.
                this._updateTabZOrder();
                // Emit the `tabMoved` signal.
                this.tabMoved.emit(new Pair(fromIndex, toIndex));
                // If the tab bar is not attached, there is nothing left to do.
                if (!this.isAttached) {
                    return toIndex;
                }
                // Animate the tab layout update.
                this._withTransition(function () { return _this.update(true); });
                return toIndex;
            };
            /**
             * Remove and return the tab at the given index.
             *
             * Returns `undefined` if the index is invalid.
             */
            TabBar.prototype._removeTab = function (index, animate) {
                var _this = this;
                // Remove the tab from the tabs array.
                var tabs = this._tabs;
                var tab = algo.removeAt(tabs, index);
                // Bail early if the index is invalid.
                if (!tab) {
                    return void 0;
                }
                // The mouse is always released when removing a tab. Attempting
                // to gracefully handle the rare case of removing a tab while
                // a drag is in progress it is not worth the effort.
                this._releaseMouse();
                // Ensure the tab is deselected and at the bottom of the Z-order.
                tab.selected = false;
                tab.node.style.zIndex = '0';
                // If the tab is the current tab, select the next best tab by
                // starting with the previous tab, then the next sibling, and
                // finally the previous sibling. Otherwise, update the state
                // and tab Z-order as appropriate.
                if (tab === this._currentTab) {
                    var next = this._previousTab || tabs[index] || tabs[index - 1];
                    this._currentTab = null;
                    this._previousTab = null;
                    if (next) {
                        this.currentTab = next;
                    }
                    else {
                        this.currentChanged.emit(new Pair(-1, void 0));
                    }
                }
                else if (tab === this._previousTab) {
                    this._previousTab = null;
                    this._updateTabZOrder();
                }
                else {
                    this._updateTabZOrder();
                }
                // If the tab bar is not attached, remove the node immediately.
                var content = this.contentNode;
                if (!this.isAttached) {
                    safeRemove(content, tab.node);
                    return tab;
                }
                // Animate the tab remove as appropriate.
                if (animate) {
                    this._withTransition(function () {
                        tab.addClass(REMOVING_CLASS);
                        _this.update(true);
                    }, function () {
                        tab.removeClass(REMOVING_CLASS);
                        safeRemove(content, tab.node);
                    });
                }
                else {
                    safeRemove(content, tab.node);
                    this._withTransition(function () { return _this.update(true); });
                }
                // Notify the layout system that the widget geometry is dirty.
                this.updateGeometry();
                return tab;
            };
            /**
             * Get the index of the tab which covers the given client position.
             *
             * Returns -1 if the client position does not intersect a tab.
             */
            TabBar.prototype._hitTest = function (clientX, clientY) {
                var tabs = this._tabs;
                for (var i = 0, n = tabs.length; i < n; ++i) {
                    if (hitTest(tabs[i].node, clientX, clientY)) {
                        return i;
                    }
                }
                return -1;
            };
            /**
             * Compute the layout width of a tab.
             *
             * This computes a tab size as close as possible to the preferred
             * tab size, taking into account the minimum tab width, the current
             * tab bar width, and the tab overlap setting.
             */
            TabBar.prototype._tabLayoutWidth = function () {
                var count = this.count;
                if (count === 0) {
                    return 0;
                }
                var totalOverlap = this._tabOverlap * (count - 1);
                var totalWidth = this._tabWidth * count - totalOverlap;
                if (this.width >= totalWidth) {
                    return this._tabWidth;
                }
                return Math.max(this._minTabWidth, (this.width + totalOverlap) / count);
            };
            /**
             * Update the Z-indices of the tabs for the current tab order.
             */
            TabBar.prototype._updateTabZOrder = function () {
                var tabs = this._tabs;
                var k = tabs.length - 1;
                var current = this._currentTab;
                for (var i = 0, n = tabs.length; i < n; ++i) {
                    var tab = tabs[i];
                    if (tab === current) {
                        tab.node.style.zIndex = n + '';
                    }
                    else {
                        tab.node.style.zIndex = k-- + '';
                    }
                }
            };
            /**
             * A helper function to execute an animated transition.
             *
             * This will add the transition class to the tab bar for the global
             * transition duration. The optional `onEnter` callback is invoked
             * immediately after the transition class is added. The optional
             * `onExit` callback will be invoked after the transition duration
             * has expired and the transition class is removed from the tab bar.
             *
             * If there is an active drag in progress, the transition class
             * will not be removed from the on exit.
             */
            TabBar.prototype._withTransition = function (onEnter, onExit) {
                var _this = this;
                var content = this.contentNode;
                content.classList.add(TRANSITION_CLASS);
                if (onEnter) {
                    onEnter();
                }
                setTimeout(function () {
                    if (!_this._dragData || !_this._dragData.dragActive) {
                        content.classList.remove(TRANSITION_CLASS);
                    }
                    if (onExit) {
                        onExit();
                    }
                }, TRANSITION_DURATION);
            };
            /**
             * Initialize the tab bar state from an options object.
             */
            TabBar.prototype._initFrom = function (options) {
                if (options.tabsMovable !== void 0) {
                    this.tabsMovable = options.tabsMovable;
                }
                if (options.tabWidth !== void 0) {
                    this.tabWidth = options.tabWidth;
                }
                if (options.minTabWidth !== void 0) {
                    this.minTabWidth = options.minTabWidth;
                }
                if (options.tabOverlap !== void 0) {
                    this.tabOverlap = options.tabOverlap;
                }
            };
            __decorate([
                signal
            ], TabBar.prototype, "tabMoved");
            __decorate([
                signal
            ], TabBar.prototype, "currentChanged");
            __decorate([
                signal
            ], TabBar.prototype, "tabCloseRequested");
            __decorate([
                signal
            ], TabBar.prototype, "tabDetachRequested");
            return TabBar;
        })(widgets.Widget);
        widgets.TabBar = TabBar;
        /**
         * Test whether a point lies within an expanded rect.
         */
        function inBounds(r, v, x, y) {
            if (x < r.left - v) {
                return false;
            }
            if (x >= r.right + v) {
                return false;
            }
            if (y < r.top - v) {
                return false;
            }
            if (y >= r.bottom + v) {
                return false;
            }
            return true;
        }
        /**
         * Safely remove a child node from its parent.
         *
         * This is a no-op if either node is null or if the given parent
         * node does not match the child node true parent.
         */
        function safeRemove(parent, child) {
            if (parent && child && child.parentNode === parent) {
                parent.removeChild(child);
            }
        }
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var widgets;
    (function (widgets) {
        var signal = phosphor.core.signal;
        var Pair = phosphor.utility.Pair;
        /**
         * The class name added to tab panel instances.
         */
        var TAB_PANEL_CLASS = 'p-TabPanel';
        /**
         * A panel which provides a tabbed container for child widgets.
         *
         * The TabPanel provides a convenient combination of a TabBar and a
         * StackedPanel which allows the user to toggle between widgets by
         * selecting the tab associated with a widget.
         */
        var TabPanel = (function (_super) {
            __extends(TabPanel, _super);
            /**
             * Construct a new tab panel.
             */
            function TabPanel() {
                _super.call(this);
                this.addClass(TAB_PANEL_CLASS);
                this.layout = new widgets.BoxLayout(widgets.Direction.TopToBottom, 0);
                this.setFlag(widgets.WidgetFlag.DisallowLayoutChange);
                var bar = this._tabBar = new widgets.TabBar();
                bar.tabMoved.connect(this._p_tabMoved, this);
                bar.currentChanged.connect(this._p_currentChanged, this);
                bar.tabCloseRequested.connect(this._p_tabCloseRequested, this);
                var stack = this._stackedPanel = new widgets.StackedPanel();
                stack.widgetRemoved.connect(this._p_widgetRemoved, this);
                this.layout.addWidget(bar);
                this.layout.addWidget(stack);
            }
            /**
             * Dispose of the resources held by the panel.
             */
            TabPanel.prototype.dispose = function () {
                this._tabBar = null;
                this._stackedPanel = null;
                _super.prototype.dispose.call(this);
            };
            Object.defineProperty(TabPanel.prototype, "currentIndex", {
                /**
                 * Get the index of the currently selected widget.
                 */
                get: function () {
                    return this._stackedPanel.currentIndex;
                },
                /**
                 * Set the index of the currently selected widget.
                 */
                set: function (index) {
                    this._tabBar.currentIndex = index;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabPanel.prototype, "currentWidget", {
                /**
                 * Get the currently selected widget.
                 */
                get: function () {
                    return this._stackedPanel.currentWidget;
                },
                /**
                 * Set the currently selected widget.
                 */
                set: function (widget) {
                    this._tabBar.currentIndex = this.indexOf(widget);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabPanel.prototype, "tabsMovable", {
                /**
                 * Get whether the tabs are movable by the user.
                 */
                get: function () {
                    return this._tabBar.tabsMovable;
                },
                /**
                 * Set whether the tabs are movable by the user.
                 */
                set: function (movable) {
                    this._tabBar.tabsMovable = movable;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabPanel.prototype, "tabBar", {
                /**
                 * Get the tab bar used by the panel.
                 */
                get: function () {
                    return this._tabBar;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TabPanel.prototype, "count", {
                /**
                 * Get the number of widgets in the panel.
                 */
                get: function () {
                    return this._stackedPanel.count;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Get the index of the given widget.
             */
            TabPanel.prototype.indexOf = function (widget) {
                return this._stackedPanel.indexOf(widget);
            };
            /**
             * Get the widget at the given index.
             *
             * Returns `undefined` if there is no widget at the given index.
             */
            TabPanel.prototype.widgetAt = function (index) {
                return this._stackedPanel.widgetAt(index);
            };
            /**
             * Add a tabbable widget to the end of the panel.
             *
             * If the widget already exists in the panel, it will be moved.
             *
             * Returns the index of the added widget.
             */
            TabPanel.prototype.addWidget = function (widget, alignment) {
                return this.insertWidget(this.count, widget, alignment);
            };
            /**
             * Insert a tabbable widget into the panel at the given index.
             *
             * If the widget already exists in the panel, it will be moved.
             *
             * Returns the index of the added widget.
             */
            TabPanel.prototype.insertWidget = function (index, widget, alignment) {
                index = this._stackedPanel.insertWidget(index, widget, alignment);
                return this._tabBar.insertTab(index, widget.tab);
            };
            /**
             * Move a widget from one index to another.
             *
             * Returns the new index of the widget.
             */
            TabPanel.prototype.moveWidget = function (fromIndex, toIndex) {
                return this._tabBar.moveTab(fromIndex, toIndex);
            };
            /**
             * Handle the `tabMoved` signal from the tab bar.
             */
            TabPanel.prototype._p_tabMoved = function (args) {
                this._stackedPanel.moveWidget(args.first, args.second);
            };
            /**
             * Handle the `currentChanged` signal from the tab bar.
             */
            TabPanel.prototype._p_currentChanged = function (args) {
                this._stackedPanel.currentIndex = args.first;
                var widget = this._stackedPanel.currentWidget;
                this.currentChanged.emit(new Pair(args.first, widget));
            };
            /**
             * Handle the `tabCloseRequested` signal from the tab bar.
             */
            TabPanel.prototype._p_tabCloseRequested = function (args) {
                this._stackedPanel.widgetAt(args.first).close();
            };
            /**
             * Handle the `widgetRemoved` signal from the stacked panel.
             */
            TabPanel.prototype._p_widgetRemoved = function (args) {
                this._tabBar.removeAt(args.first);
            };
            __decorate([
                signal
            ], TabPanel.prototype, "currentChanged");
            return TabPanel;
        })(widgets.Widget);
        widgets.TabPanel = TabPanel;
    })(widgets = phosphor.widgets || (phosphor.widgets = {}));
})(phosphor || (phosphor = {})); // module phosphor.widgets



/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var shell;
    (function (shell) {
        var Token = phosphor.di.Token;
        /**
         * The interface token for IPluginList.
         */
        shell.IPluginList = new Token('phosphor.shell.IPluginList');
    })(shell = phosphor.shell || (phosphor.shell = {}));
})(phosphor || (phosphor = {})); // module phosphor.shell

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var shell;
    (function (shell) {
        var Token = phosphor.di.Token;
        /**
         * The interface token for IShellView.
         */
        shell.IShellView = new Token('phosphor.shell.IShellView');
    })(shell = phosphor.shell || (phosphor.shell = {}));
})(phosphor || (phosphor = {})); // module phosphor.shell

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var shell;
    (function (shell) {
        var installMessageFilter = phosphor.core.installMessageFilter;
        var removeMessageFilter = phosphor.core.removeMessageFilter;
        /**
         * Enable auto-hiding for the given widget.
         *
         * When auto-hiding is enabled, the widget will be automatically hidden
         * when it has no visible children, and shown when it has at least one
         * visible child.
         */
        function enableAutoHide(widget) {
            installMessageFilter(widget, filter);
            refresh(widget);
        }
        shell.enableAutoHide = enableAutoHide;
        /**
         * Disable auto-hiding for the given widget.
         *
         * This removes the effect of calling `enableAutoHide`. The current
         * visible state of the widget will not be changed by this method.
         */
        function disableAutoHide(widget) {
            removeMessageFilter(widget, filter);
        }
        shell.disableAutoHide = disableAutoHide;
        /**
         * Refresh the auto-hide visible state for the given widget.
         */
        function refresh(widget) {
            widget.setVisible(hasVisibleChild(widget));
        }
        /**
         * Test whether a widget has at least one visible child.
         */
        function hasVisibleChild(widget) {
            for (var i = 0, n = widget.childCount; i < n; ++i) {
                if (!widget.childAt(i).isHidden) {
                    return true;
                }
            }
            return false;
        }
        /**
         * A message filter which implements auto-hide functionality.
         */
        var AutoHideFilter = (function () {
            function AutoHideFilter() {
            }
            /**
             * Filter a message sent to a message handler.
             */
            AutoHideFilter.prototype.filterMessage = function (handler, msg) {
                switch (msg.type) {
                    case 'child-added':
                    case 'child-removed':
                    case 'child-shown':
                    case 'child-hidden':
                        refresh(handler);
                        break;
                }
                return false;
            };
            return AutoHideFilter;
        })();
        /**
         * A singleton instance of AutoHideFilter.
         */
        var filter = new AutoHideFilter();
    })(shell = phosphor.shell || (phosphor.shell = {}));
})(phosphor || (phosphor = {})); // module phosphor.shell

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var shell;
    (function (shell_1) {
        var Container = phosphor.di.Container;
        var IContainer = phosphor.di.IContainer;
        var createBoxSizing = phosphor.utility.createBoxSizing;
        /**
         * A class which manages bootstrapping an application.
         *
         * An application will typically define its own Bootstrapper subclass
         * which overrides the necessary methods to customize the application.
         */
        var Bootstrapper = (function () {
            /**
             * Construct a new bootstrapper.
             */
            function Bootstrapper() {
                this._shell = null;
                this._container = null;
                this._pluginList = null;
            }
            Object.defineProperty(Bootstrapper.prototype, "container", {
                /**
                 * Get the dependency injection container for the application.
                 *
                 * This is created by the `createContainer` method.
                 */
                get: function () {
                    return this._container;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Bootstrapper.prototype, "pluginList", {
                /**
                 * Get the plugin list for the application.
                 *
                 * This is created by the `createPluginList` method.
                 */
                get: function () {
                    return this._pluginList;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Bootstrapper.prototype, "shell", {
                /**
                 * Get the top-level shell view for the application.
                 *
                 * This is created by the `createShell` method.
                 */
                get: function () {
                    return this._shell;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Run the bootstrapper.
             *
             * This invokes the various bootstrap methods in the proper order
             * and updates the internal state of the bootstrapper.
             *
             * This method should not be reimplemented.
             */
            Bootstrapper.prototype.run = function () {
                var _this = this;
                this._container = this.createContainer();
                this.configureContainer();
                this._shell = this.createShell();
                this.configureShell();
                this._pluginList = this.createPluginList();
                this.configurePlugins().then(function () {
                    _this.finalize();
                }).catch(function (ex) {
                    console.error('plugin initialization failed', ex);
                });
            };
            /**
             * Create the dependency injection container for the application.
             *
             * This can be reimplemented by subclasses as needed.
             *
             * The default implementation creates an instance of `Container`.
             */
            Bootstrapper.prototype.createContainer = function () {
                return new Container();
            };
            /**
             * Create the application plugin list.
             *
             * This can be reimplmented by subclasses as needed.
             *
             * The default implementation resolves an `IPluginList`.
             */
            Bootstrapper.prototype.createPluginList = function () {
                return this.container.resolve(shell_1.IPluginList);
            };
            /**
             * Create the application shell widget.
             *
             * This can be reimplemented by subclasses as needed.
             *
             * The default implementation resolves an `IShellView`.
             */
            Bootstrapper.prototype.createShell = function () {
                return this.container.resolve(shell_1.IShellView);
            };
            /**
             * Configure the application dependency injection container.
             *
             * This can be reimplemented by subclasses as needed.
             */
            Bootstrapper.prototype.configureContainer = function () {
                var container = this.container;
                if (!container.isRegistered(IContainer)) {
                    container.registerInstance(IContainer, container);
                }
                if (!container.isRegistered(shell_1.IPluginList)) {
                    container.registerType(shell_1.IPluginList, shell_1.PluginList);
                }
                if (!container.isRegistered(shell_1.IShellView)) {
                    container.registerType(shell_1.IShellView, shell_1.ShellView);
                }
            };
            /**
             * Configure the application plugins.
             *
             * Subclasses should reimplement this method to add the application
             * plugins to the plugin list. This should return a promise which
             * resolves once all plugins are initialized.
             *
             * The default implementation returns an empty resolved promise.
             */
            Bootstrapper.prototype.configurePlugins = function () {
                return Promise.resolve();
            };
            /**
             * Configure the application shell widget.
             *
             * This can be reimplemented by subclasses as needed.
             */
            Bootstrapper.prototype.configureShell = function () { };
            /**
             * Finalize the bootstrapping process.
             *
             * This is called after all plugins are resolved and intialized.
             *
             * It is the last method called in the bootstrapping process.
             *
             * This can be reimplemented by subclasses as needed.
             *
             * The default implementation attaches the shell widget to the DOM
             * using the "main" element or `document.body`, and adds a window
             * resize event handler which refits the shell on window resize.
             */
            Bootstrapper.prototype.finalize = function () {
                var shell = this.shell;
                var elem = document.getElementById('main') || document.body;
                var box = createBoxSizing(elem);
                var fit = function () { return shell.fit(void 0, void 0, box); };
                window.addEventListener('resize', fit);
                shell.attach(elem);
                shell.show();
                fit();
            };
            return Bootstrapper;
        })();
        shell_1.Bootstrapper = Bootstrapper;
    })(shell = phosphor.shell || (phosphor.shell = {}));
})(phosphor || (phosphor = {})); // module phosphor.shell

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var shell;
    (function (shell) {
        var algo = phosphor.collections.algorithm;
        /**
         * An object which manages items in a menu or menu bar.
         */
        var MenuManager = (function () {
            /**
             * Construct a new menu manager.
             *
             * The provided menu should be empty.
             */
            function MenuManager(menu) {
                this._ranks = [];
                this._menu = menu;
            }
            /**
             * Add a menu item to the menu.
             *
             * Menu items are ordered from lowest to highest rank. The default
             * rank is `100`. If the item has already been added to the manager,
             * it will first be removed.
             */
            MenuManager.prototype.addItem = function (item, rank) {
                if (rank === void 0) { rank = 100; }
                this.removeItem(item);
                var index = algo.upperBound(this._ranks, rank, cmp);
                algo.insert(this._ranks, index, rank);
                this._menu.insertItem(index, item);
            };
            /**
             * Remove a menu item from the menu.
             *
             * If the item has not been added to the manager, this is a no-op.
             */
            MenuManager.prototype.removeItem = function (item) {
                var index = this._menu.removeItem(item);
                if (index !== -1)
                    algo.removeAt(this._ranks, index);
            };
            return MenuManager;
        })();
        shell.MenuManager = MenuManager;
        /**
         * A numeric comparator.
         */
        function cmp(a, b) {
            return a - b;
        }
    })(shell = phosphor.shell || (phosphor.shell = {}));
})(phosphor || (phosphor = {})); // module phosphor.shell

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var shell;
    (function (shell) {
        var IContainer = phosphor.di.IContainer;
        /**
         * A concrete implementation of IPluginList.
         */
        var PluginList = (function () {
            /**
             * Construct a new plugin list.
             */
            function PluginList(container) {
                this._plugins = [];
                this._container = container;
            }
            /**
             * Add an array of plugins or plugin promises to the plugin list.
             *
             * When all plugins are resolved, the `initialize` method of each
             * plugin is called and the plugin is added to the list.
             *
             * Returns a promise which resolves when all plugins are added.
             */
            PluginList.prototype.add = function (plugins) {
                var _this = this;
                return Promise.all(plugins).then(function (resolved) {
                    resolved.forEach(function (plugin) { return _this._addPlugin(plugin); });
                });
            };
            /**
             * Invoke the given callback for each resolved plugin in the list.
             */
            PluginList.prototype.forEach = function (callback) {
                return this._plugins.forEach(function (plugin) { return callback(plugin); });
            };
            /**
             * Initialize a plugin and add it to the plugins list.
             */
            PluginList.prototype._addPlugin = function (plugin) {
                plugin.initialize(this._container);
                this._plugins.push(plugin);
            };
            /**
             * The injection dependencies for the plugin list.
             */
            PluginList.$inject = [IContainer];
            return PluginList;
        })();
        shell.PluginList = PluginList;
    })(shell = phosphor.shell || (phosphor.shell = {}));
})(phosphor || (phosphor = {})); // module phosphor.shell

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var shell;
    (function (shell) {
        var algo = phosphor.collections.algorithm;
        var Pair = phosphor.utility.Pair;
        var BoxLayout = phosphor.widgets.BoxLayout;
        var Widget = phosphor.widgets.Widget;
        var WidgetFlag = phosphor.widgets.WidgetFlag;
        /**
         * The class name added to shell panel instances.
         */
        var SHELL_PANEL_CLASS = 'p-ShellPanel';
        /**
         * A content panel for a shell view.
         */
        var ShellPanel = (function (_super) {
            __extends(ShellPanel, _super);
            /**
             * Construct a new shell view.
             */
            function ShellPanel(direction) {
                _super.call(this);
                this._pairs = [];
                this.addClass(SHELL_PANEL_CLASS);
                this.layout = new BoxLayout(direction, 0);
                this.setFlag(WidgetFlag.DisallowLayoutChange);
            }
            /**
             * Dispose of the resources held by the widget.
             */
            ShellPanel.prototype.dispose = function () {
                this._pairs = null;
                _super.prototype.dispose.call(this);
            };
            /**
             * Add a widget to the panel.
             */
            ShellPanel.prototype.addWidget = function (widget, options) {
                if (options === void 0) { options = {}; }
                widget.parent = null;
                var stretch = options.stretch;
                var alignment = options.alignment;
                var rank = options.rank !== void 0 ? options.rank : 100;
                var index = algo.upperBound(this._pairs, rank, pairCmp);
                algo.insert(this._pairs, index, new Pair(widget, rank));
                this.layout.insertWidget(index, widget, stretch, alignment);
            };
            /**
             * A method invoked when a 'child-removed' message is received.
             */
            ShellPanel.prototype.onChildRemoved = function (msg) {
                _super.prototype.onChildRemoved.call(this, msg);
                var index = algo.findIndex(this._pairs, function (pair) { return pair.first === msg.child; });
                if (index !== -1)
                    algo.removeAt(this._pairs, index);
            };
            return ShellPanel;
        })(Widget);
        shell.ShellPanel = ShellPanel;
        /**
         * A comparator for a rank pair.
         */
        function pairCmp(pair, rank) {
            return pair.second - rank;
        }
    })(shell = phosphor.shell || (phosphor.shell = {}));
})(phosphor || (phosphor = {})); // module phosphor.shell

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
var phosphor;
(function (phosphor) {
    var shell;
    (function (shell) {
        var BoxLayout = phosphor.widgets.BoxLayout;
        var Direction = phosphor.widgets.Direction;
        var MenuBar = phosphor.widgets.MenuBar;
        var Orientation = phosphor.widgets.Orientation;
        var SizePolicy = phosphor.widgets.SizePolicy;
        var SplitPanel = phosphor.widgets.SplitPanel;
        var Widget = phosphor.widgets.Widget;
        var WidgetFlag = phosphor.widgets.WidgetFlag;
        /**
         * The class name added to shell view instances.
         */
        var SHELL_VIEW_CLASS = 'p-ShellView';
        /**
         * The class name added to the top shell panel.
         */
        var TOP_CLASS = 'p-mod-top';
        /**
         * The class name added to the left shell panel.
         */
        var LEFT_CLASS = 'p-mod-left';
        /**
         * The class name added to the right shell panel.
         */
        var RIGHT_CLASS = 'p-mod-right';
        /**
         * The class name added to the bottom shell panel.
         */
        var BOTTOM_CLASS = 'p-mod-bottom';
        /**
         * The class name added to the center shell panel.
         */
        var CENTER_CLASS = 'p-mod-center';
        /**
         * A concrete implementation of IShellView.
         */
        var ShellView = (function (_super) {
            __extends(ShellView, _super);
            /**
             * Construct a new shell view.
             */
            function ShellView() {
                _super.call(this);
                this.addClass(SHELL_VIEW_CLASS);
                this._menuBar = new MenuBar();
                this._topPanel = new shell.ShellPanel(Direction.TopToBottom);
                this._leftPanel = new shell.ShellPanel(Direction.LeftToRight);
                this._rightPanel = new shell.ShellPanel(Direction.RightToLeft);
                this._bottomPanel = new shell.ShellPanel(Direction.BottomToTop);
                this._centerPanel = new shell.ShellPanel(Direction.TopToBottom);
                this._menuManager = new shell.MenuManager(this._menuBar);
                this._topPanel.addClass(TOP_CLASS);
                this._leftPanel.addClass(LEFT_CLASS);
                this._rightPanel.addClass(RIGHT_CLASS);
                this._bottomPanel.addClass(BOTTOM_CLASS);
                this._centerPanel.addClass(CENTER_CLASS);
                this._menuBar.hide();
                this._topPanel.verticalSizePolicy = SizePolicy.Fixed;
                shell.enableAutoHide(this._topPanel);
                shell.enableAutoHide(this._leftPanel);
                shell.enableAutoHide(this._rightPanel);
                shell.enableAutoHide(this._bottomPanel);
                var hSplitter = new SplitPanel(Orientation.Horizontal);
                var vSplitter = new SplitPanel(Orientation.Vertical);
                hSplitter.handleSize = 0;
                vSplitter.handleSize = 0;
                hSplitter.addWidget(this._leftPanel);
                hSplitter.addWidget(this._centerPanel, 1);
                hSplitter.addWidget(this._rightPanel);
                vSplitter.addWidget(hSplitter, 1);
                vSplitter.addWidget(this._bottomPanel);
                var layout = new BoxLayout(Direction.TopToBottom, 0);
                layout.addWidget(this._menuBar);
                layout.addWidget(this._topPanel);
                layout.addWidget(vSplitter, 1);
                this.layout = layout;
                this.setFlag(WidgetFlag.DisallowLayoutChange);
            }
            /**
             * Get the content areas names supported by the shell view.
             */
            ShellView.prototype.areas = function () {
                return ['top', 'left', 'right', 'bottom', 'center'];
            };
            /**
             * Add a widget to the named content area.
             *
             * This method throws an exception if the named area is not supported.
             */
            ShellView.prototype.addWidget = function (area, widget, options) {
                switch (area) {
                    case 'top':
                        this._topPanel.addWidget(widget, options);
                        break;
                    case 'left':
                        this._leftPanel.addWidget(widget, options);
                        break;
                    case 'right':
                        this._rightPanel.addWidget(widget, options);
                        break;
                    case 'bottom':
                        this._bottomPanel.addWidget(widget, options);
                        break;
                    case 'center':
                        this._centerPanel.addWidget(widget, options);
                        break;
                    default:
                        throw new Error('invalid content area: ' + area);
                }
            };
            /**
             * Add a menu item to the menu bar.
             *
             * Items are ordered from lowest to highest rank.
             *
             * If the item already exists, its position will be updated.
             */
            ShellView.prototype.addMenuItem = function (item, rank) {
                this._menuManager.addItem(item, rank);
                this._menuBar.setVisible(this._menuBar.count > 0);
            };
            /**
             * Remove a menu item from the menu bar.
             *
             * If the item does not exist, this is a no-op.
             */
            ShellView.prototype.removeMenuItem = function (item) {
                this._menuManager.removeItem(item);
                this._menuBar.setVisible(this._menuBar.count > 0);
            };
            return ShellView;
        })(Widget);
        shell.ShellView = ShellView;
    })(shell = phosphor.shell || (phosphor.shell = {}));
})(phosphor || (phosphor = {})); // module phosphor.shell
