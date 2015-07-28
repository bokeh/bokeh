declare module phosphor.collections.algorithm {
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
    function indexOf<T>(array: T[], value: T, fromIndex?: number, wrap?: boolean): number;
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
    function lastIndexOf<T>(array: T[], value: T, fromIndex?: number, wrap?: boolean): number;
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
    function findIndex<T>(array: T[], pred: IPredicate<T>, fromIndex?: number, wrap?: boolean): number;
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
    function findLastIndex<T>(array: T[], pred: IPredicate<T>, fromIndex?: number, wrap?: boolean): number;
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
    function find<T>(array: T[], pred: IPredicate<T>, fromIndex?: number, wrap?: boolean): T;
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
    function findLast<T>(array: T[], pred: IPredicate<T>, fromIndex?: number, wrap?: boolean): T;
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
    function lowerBound<T, U>(array: T[], value: U, cmp: IComparator<T, U>): number;
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
    function upperBound<T, U>(array: T[], value: U, cmp: IComparator<T, U>): number;
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
    function binaryFindIndex<T, U>(array: T[], value: U, cmp: IComparator<T, U>): number;
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
    function binaryFindLastIndex<T, U>(array: T[], value: U, cmp: IComparator<T, U>): number;
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
    function binaryFind<T, U>(array: T[], value: U, cmp: IComparator<T, U>): T;
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
    function binaryFindLast<T, U>(array: T[], value: U, cmp: IComparator<T, U>): T;
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
    function copy<T>(array: T[]): T[];
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
    function insert<T>(array: T[], index: number, value: T): number;
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
    function move<T>(array: T[], fromIndex: number, toIndex: number): number;
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
    function removeAt<T>(array: T[], index: number): T;
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
    function remove<T>(array: T[], value: T): number;
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
    function reverse<T>(array: T[], fromIndex?: number, toIndex?: number): T[];
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
    function rotate<T>(array: T[], delta: number): T[];
}

declare module phosphor.collections {
    /**
     * A circular buffer with a fixed maximum size.
     *
     * A circular buffer is a buffer with constant time access to its
     * elements and constant times inserts and deletes from the front
     * and back of the buffer. When the buffer reaches its maximum
     * size, newly added elements will overwrite existing elements.
     */
    class CircularBuffer<T> {
        /**
         * Construct a new circular buffer.
         */
        constructor(maxSize: number, items?: T[]);
        /**
         * The maximum size of the buffer.
         */
        maxSize: number;
        /**
         * The number of elements in the buffer.
         */
        size: number;
        /**
         * True if the buffer has elements, false otherwise.
         */
        empty: boolean;
        /**
         * The value at the front of the buffer.
         */
        front: T;
        /**
         * The value at the back of the buffer.
         */
        back: T;
        /**
         * Get the value at the given index.
         *
         * Returns `undefined` if the index is out of range.
         */
        get(index: number): T;
        /**
         * Set the value at the given index.
         *
         * Returns false if the index is out of range.
         */
        set(index: number, value: T): boolean;
        /**
         * Push a value onto the back of the buffer.
         *
         * If the buffer is full, the front element will be overwritten.
         */
        pushBack(value: T): void;
        /**
         * Push a value onto the front of the buffer.
         *
         * If the buffer is full, the back element will be overwritten.
         */
        pushFront(value: T): void;
        /**
         * Pop and return the value at the back of the buffer.
         */
        popBack(): T;
        /**
         * Pop and return the value at the front of the buffer.
         */
        popFront(): T;
        /**
         * Remove all values from the buffer.
         */
        clear(): void;
        /**
         * Create an array from the values in the buffer.
         */
        toArray(): T[];
        /**
         * Returns true if any value in the buffer passes the given test.
         */
        some(pred: IPredicate<T>): boolean;
        /**
         * Returns true if all values in the buffer pass the given test.
         */
        every(pred: IPredicate<T>): boolean;
        /**
         * Create an array of the values which pass the given test.
         */
        filter(pred: IPredicate<T>): T[];
        /**
         * Create an array of callback results for each value in the buffer.
         */
        map<U>(callback: ICallback<T, U>): U[];
        /**
         * Execute a callback for each element in buffer.
         *
         * Iteration will terminate if the callbacks returns a value other
         * than `undefined`. That value will be returned from this method.
         */
        forEach<U>(callback: ICallback<T, U>): U;
        /**
         * Get the value for the apparent index.
         *
         * The index is assumed to be in-range.
         */
        private _get(index);
        /**
         * Set the value for the apparent index.
         *
         * The index is assumed to be in-range.
         */
        private _set(index, value);
        /**
         * Clear and return the value at the apparent index.
         *
         * The index is assumed to be in-range.
         */
        private _rem(index);
        /**
         * Increment the offset by one.
         */
        private _incr();
        /**
         * Decrement the offset by one.
         */
        private _decr();
        private _size;
        private _offset;
        private _array;
    }
}

declare module phosphor.collections {
    /**
     * A sequence callback function.
     */
    interface ICallback<T, U> {
        /**
         * @param value The current value in the sequence.
         * @param index The index of the value in the sequence.
         * @returns The result of the callback for the value.
         */
        (value: T, index: number): U;
    }
    /**
     * A three-way comparison function.
     */
    interface IComparator<T, U> {
        /**
         * @param first The LHS of the comparison.
         * @param second The RHS of the comparison.
         * @returns
         *   - zero if `first === second`
         *   - a negative value if `first < second`
         *   - a positive value if `first > second`
         */
        (first: T, second: U): number;
    }
    /**
     * A boolean predicate function.
     */
    interface IPredicate<T> {
        /**
         * @param value The current value in the sequence.
         * @param index The index of the value in the sequence.
         * @returns `true` if the value matches the predicate, `false` otherwise.
         */
        (value: T, index: number): boolean;
    }
}

declare module phosphor.collections {
    /**
     * A canonical singly linked FIFO queue.
     */
    class Queue<T> {
        /**
         * Construct a new queue.
         */
        constructor(items?: T[]);
        /**
         * The number of elements in the queue.
         */
        size: number;
        /**
         * True if the queue has elements, false otherwise.
         */
        empty: boolean;
        /**
         * The value at the front of the queue.
         */
        front: T;
        /**
         * The value at the back of the queue.
         */
        back: T;
        /**
         * Push a value onto the back of the queue.
         */
        pushBack(value: T): void;
        /**
         * Pop and return the value at the front of the queue.
         */
        popFront(): T;
        /**
         * Remove all values from the queue.
         */
        clear(): void;
        /**
         * Create an array from the values in the queue.
         */
        toArray(): T[];
        /**
         * Returns true if any value in the queue passes the given test.
         */
        some(pred: IPredicate<T>): boolean;
        /**
         * Returns true if all values in the queue pass the given test.
         */
        every(pred: IPredicate<T>): boolean;
        /**
         * Create an array of the values which pass the given test.
         */
        filter(pred: IPredicate<T>): T[];
        /**
         * Create an array of callback results for each value in the queue.
         */
        map<U>(callback: ICallback<T, U>): U[];
        /**
         * Execute a callback for each element in queue.
         *
         * Iteration will terminate if the callbacks returns a value other
         * than `undefined`. That value will be returned from this method.
         */
        forEach<U>(callback: ICallback<T, U>): U;
        private _size;
        private _front;
        private _back;
    }
}

declare module phosphor.collections {
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
    class SectionList {
        /**
         * Get the total number of sections in the list.
         *
         * #### Notes
         * This operation has `O(1)` complexity.
         */
        count: number;
        /**
         * Get the total size of all sections in the list.
         *
         * #### Notes
         * This operation has `O(1)` complexity.
         */
        size: number;
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
        indexOf(offset: number): number;
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
        offsetOf(index: number): number;
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
        sizeOf(index: number): number;
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
        insert(index: number, count: number, size: number): void;
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
        remove(index: number, count: number): void;
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
        resize(index: number, count: number, size: number): void;
        private _root;
    }
}

declare module phosphor.utility {
    /**
     * The box sizing data for an HTML element.
     */
    interface IBoxSizing {
        /**
         * The minimum width, in pixels.
         */
        minWidth: number;
        /**
         * The minimum height, in pixels.
         */
        minHeight: number;
        /**
         * The maximum width, in pixels.
         */
        maxWidth: number;
        /**
         * The maximum height, in pixels.
         */
        maxHeight: number;
        /**
         * The top border width, in pixels.
         */
        borderTop: number;
        /**
         * The left border width, in pixels.
         */
        borderLeft: number;
        /**
         * The right border width, in pixels.
         */
        borderRight: number;
        /**
         * The bottom border width, in pixels.
         */
        borderBottom: number;
        /**
         * The top padding width, in pixels.
         */
        paddingTop: number;
        /**
         * The left padding width, in pixels.
         */
        paddingLeft: number;
        /**
         * The right padding width, in pixels.
         */
        paddingRight: number;
        /**
         * The bottom padding width, in pixels.
         */
        paddingBottom: number;
        /**
         * The sum of the vertical padding and border.
         */
        verticalSum: number;
        /**
         * The sum of the horizontal padding and border.
         */
        horizontalSum: number;
    }
    /**
     * Create a box sizing object for the given node.
     *
     * The values of the returned object are read only.
     */
    function createBoxSizing(node: HTMLElement): IBoxSizing;
}

declare module phosphor.utility {
    /**
     * Override the cursor for the entire document.
     *
     * Returns an IDisposable which will clear the override.
     */
    function overrideCursor(cursor: string): IDisposable;
}

declare module phosphor.utility {
    /**
     * An object which holds disposable resources.
     */
    interface IDisposable {
        /**
         * Dispose of the resources held by the object.
         *
         * It is not safe to use an object after it has been disposed.
         */
        dispose(): void;
    }
    /**
     * A concrete implementation of IDisposable.
     *
     * This will invoke a user provided callback when it is disposed.
     */
    class Disposable implements IDisposable {
        /**
         * Construct a new disposable.
         */
        constructor(callback: () => void);
        /**
         * Dispose the object and invoke the user provided callback.
         */
        dispose(): void;
        private _callback;
    }
}

declare module phosphor.utility {
    /**
     * A singleton frozen empty object.
     */
    var emptyObject: any;
    /**
     * A singleton frozen empty array.
     */
    var emptyArray: any[];
    /**
     * A singleton empty no-op function.
     */
    var emptyFunction: () => void;
}

declare module phosphor.utility {
    /**
     * Test whether a client position lies within a node.
     */
    function hitTest(node: HTMLElement, x: number, y: number): boolean;
}

declare module phosphor.utility {
    /**
     * A generic pair of values.
     */
    class Pair<T, U> {
        first: T;
        second: U;
        /**
         * Construct a new pair.
         */
        constructor(first: T, second: U);
    }
}

declare module phosphor.utility {
    /**
     * The position of a two dimensional object.
     */
    class Point {
        /**
         * A static zero point.
         */
        static Zero: Point;
        /**
         * A static infinite point.
         */
        static Infinite: Point;
        /**
         * Construct a new point.
         */
        constructor(x: number, y: number);
        /**
         * The X coordinate of the point.
         */
        x: number;
        /**
         * The Y coordinate of the point.
         */
        y: number;
        /**
         * Test whether the point is equivalent to another.
         */
        equals(other: Point): boolean;
        private _x;
        private _y;
    }
}

declare module phosphor.utility {
    /**
     * The position and size of a 2-dimensional object.
     */
    class Rect {
        /**
         * Construct a new rect.
         */
        constructor(x: number, y: number, width: number, height: number);
        /**
         * The X coordinate of the rect.
         *
         * This is equivalent to `left`.
         */
        x: number;
        /**
         * The Y coordinate of the rect.
         *
         * This is equivalent to `top`.
         */
        y: number;
        /**
         * The width of the rect.
         */
        width: number;
        /**
         * The height of the rect.
         */
        height: number;
        /**
         * The position of the rect.
         *
         * This is equivalent to `topLeft`.
         */
        pos: Point;
        /**
         * The size of the rect.
         */
        size: Size;
        /**
         * The top edge of the rect.
         *
         * This is equivalent to `y`.
         */
        top: number;
        /**
         * The left edge of the rect.
         *
         * This is equivalent to `x`.
         */
        left: number;
        /**
         * The right edge of the rect.
         *
         * This is equivalent to `x + width`.
         */
        right: number;
        /**
         * The bottom edge of the rect.
         *
         * This is equivalent to `y + height`.
         */
        bottom: number;
        /**
         * The position of the top left corner of the rect.
         *
         * This is equivalent to `pos`.
         */
        topLeft: Point;
        /**
         * The position of the top right corner of the rect.
         */
        topRight: Point;
        /**
         * The position bottom left corner of the rect.
         */
        bottomLeft: Point;
        /**
         * The position bottom right corner of the rect.
         */
        bottomRight: Point;
        /**
         * Test whether the rect is equivalent to another.
         */
        equals(other: Rect): boolean;
        private _x;
        private _y;
        private _width;
        private _height;
    }
}

declare module phosphor.utility {
    /**
     * The size of a 2-dimensional object.
     */
    class Size {
        /**
         * A static zero size.
         */
        static Zero: Size;
        /**
         * A static infinite size.
         */
        static Infinite: Size;
        /**
         * Construct a new size.
         */
        constructor(width: number, height: number);
        /**
         * The width of the size.
         */
        width: number;
        /**
         * The height of the size.
         */
        height: number;
        /**
         * Test whether the size is equivalent to another.
         */
        equals(other: Size): boolean;
        private _width;
        private _height;
    }
}

declare module phosphor.utility {
    /**
     * Get the currently visible viewport rect in page coordinates.
     */
    function clientViewportRect(): Rect;
}

declare module phosphor.core {
    /**
     * The base message object which can be sent to a message handler.
     */
    interface IMessage {
        /**
         * The type of the message.
         */
        type: string;
    }
}

declare module phosphor.core {
    /**
     * An object which filters messages sent to a message handler.
     */
    interface IMessageFilter {
        /**
         * Filter a message sent to a message handler.
         *
         * Returns true if the message should be filtered, false otherwise.
         */
        filterMessage(handler: IMessageHandler, msg: IMessage): boolean;
    }
}

declare module phosphor.core {
    import Queue = collections.Queue;
    /**
     * An object which processes messages.
     */
    interface IMessageHandler {
        /**
         * Process a message sent to the handler.
         */
        processMessage(msg: IMessage): void;
        /**
         * Compress a message posted to the handler.
         *
         * This optional method allows the handler to merge a posted message
         * with a message which is already pending. It should return true if
         * the message was compressed and should be dropped, or false if the
         * message should be enqueued for delivery as normal.
         */
        compressMessage?(msg: IMessage, pending: Queue<IMessage>): boolean;
    }
}

declare module phosphor.core {
    /**
     * A concrete implementation of IMessage.
     *
     * This may be subclassed to create complex message types.
     */
    class Message implements IMessage {
        /**
         * Construct a new message.
         */
        constructor(type: string);
        /**
         * The type of the message.
         */
        type: string;
        private _type;
    }
}

declare module phosphor.core {
    /**
     * Send a message to the message handler to process immediately.
     */
    function sendMessage(handler: IMessageHandler, msg: IMessage): void;
    /**
     * Post a message to the message handler to process in the future.
     */
    function postMessage(handler: IMessageHandler, msg: IMessage): void;
    /**
     * Test whether the message handler has pending messages.
     */
    function hasPendingMessages(handler: IMessageHandler): boolean;
    /**
     * Send the first pending message to the message handler.
     */
    function sendPendingMessage(handler: IMessageHandler): void;
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
    function installMessageFilter(handler: IMessageHandler, filter: IMessageFilter): void;
    /**
     * Remove a message filter added for a message handler.
     *
     * It is safe to call this function while the filter is executing.
     *
     * If the filter is not installed, this is a no-op.
     */
    function removeMessageFilter(handler: IMessageHandler, filter: IMessageFilter): void;
    /**
     * Clear all message data associated with the message handler.
     *
     * This removes all pending messages and filters for the handler.
     */
    function clearMessageData(handler: IMessageHandler): void;
}

declare module phosphor.core {
    import IDisposable = utility.IDisposable;
    /**
     * A base class for creating objects which manage a DOM node.
     */
    class NodeBase implements IDisposable {
        /**
         * Create the DOM node for a new object instance.
         *
         * This may be reimplemented to create a custom DOM node.
         */
        static createNode(): HTMLElement;
        /**
         * Construct a new node base.
         */
        constructor();
        /**
         * Dispose of the resources held by the object.
         *
         * This method only clears the reference to the DOM node, it does not
         * remove it from the DOM. Subclasses should reimplement this method
         * to perform custom cleanup.
         */
        dispose(): void;
        /**
         * Get the DOM node managed by the object.
         */
        node: HTMLElement;
        /**
         * Test whether the object's DOM node has the given class name.
         */
        hasClass(name: string): boolean;
        /**
         * Add a class name to the object's DOM node.
         */
        addClass(name: string): void;
        /**
         * Remove a class name from the object's DOM node.
         */
        removeClass(name: string): void;
        private _node;
    }
}

declare module phosphor.core {
    /**
     * An object used for type-safe inter-object communication.
     *
     * #### Example
     * ```typescript
     * class SomeClass {
     *
     *   @signal
     *   valueChanged: ISignal<number>;
     *
     * }
     * ```
     */
    interface ISignal<T> {
        /**
         * Connect a callback to the signal.
         *
         * @param callback - The function to invoke when the signal is
         *   emitted. The args object emitted with the signal is passed
         *   as the first and only argument to the function.
         *
         * @param thisArg - The object to use as the `this` context in the
         *   callback. If provided, this must be a non-primitive object.
         *
         * @returns `true` if the connection succeeds, `false` otherwise.
         *
         * #### Notes
         * Connected callbacks are invoked synchronously, in the order in
         * which they are connected.
         *
         * Signal connections are unique. If a connection already exists for
         * the given `callback` and `thisArg`, this function returns `false`.
         *
         * A newly connected callback will not be invoked until the next time
         * the signal is emitted, even if it is connected while the signal is
         * being emitted.
         *
         * #### Example
         * ```typescript
         * // connect a method
         * someObject.valueChanged.connect(myObject.onValueChanged, myObject);
         *
         * // connect a plain function
         * someObject.valueChanged.connect(myCallback);
         * ```
         */
        connect(callback: (args: T) => void, thisArg?: any): boolean;
        /**
         * Disconnect a callback from the signal.
         *
         * @param callback - The callback connected to the signal.
         *
         * @param thisArg - The `this` context for the callback.
         *
         * @returns `true` if the connection is broken, `false` otherwise.
         *
         * #### Notes
         * A disconnected callback will no longer be invoked, even if it
         * is disconnected while the signal is being emitted.
         *
         * If no connection exists for the given `callback` and `thisArg`,
         * this function returns `false`.
         *
         * #### Example
         * ```typescript
         * // disconnect a method
         * someObject.valueChanged.disconnect(myObject.onValueChanged, myObject);
         *
         * // disconnect a plain function
         * someObject.valueChanged.disconnect(myCallback);
         * ```
         */
        disconnect(callback: (args: T) => void, thisArg?: any): boolean;
        /**
         * Emit the signal and invoke the connected callbacks.
         *
         * @param args - The args object to pass to the callbacks.
         *
         * #### Notes
         * If a connected callback throws an exception, dispatching of the
         * signal will terminate immediately and the exception will be
         * propagated to the call site of this function.
         *
         * #### Example
         * ```typescript
         * someObject.valueChanged.emit(42);
         * ```
         */
        emit(args: T): void;
    }
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
    function signal(obj: any, name: string): void;
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
    function sender(): any;
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
    function disconnectSender(obj: any): void;
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
    function disconnectReceiver(obj: any): void;
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
    function clearSignalData(obj: any): void;
}

declare module phosphor.di {
    /**
     * A token object which holds compile-time type information.
     */
    class Token<T> {
        /**
         * Construct a new token.
         *
         * @param name - A human readable name for the token.
         */
        constructor(name: string);
        /**
         * Get the human readable name for the token.
         */
        name: string;
        private _name;
        private _tokenStructuralPropertyT;
    }
}

declare module phosphor.di {
    /**
     * A lightweight dependency injection container.
     */
    class Container implements IContainer {
        /**
         * Construct a new container.
         */
        constructor();
        /**
         * Test whether a type is registered with the container.
         */
        isRegistered<T>(token: Token<T>): boolean;
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
        registerType<T>(token: Token<T>, type: IInjectable<T>, lifetime?: string): void;
        /**
         * Register an instance mapping with the container.
         *
         * This is the same as a 'singleton' type registration, except
         * that the user creates the instance of the type beforehand.
         *
         * This will throw an exception if the token is already registered.
         */
        registerInstance<T>(token: Token<T>, instance: T): void;
        /**
         * Resolve an instance for the given token or type.
         *
         * An error is thrown if no type mapping is registered for the
         * token or if the injection dependencies cannot be fulfilled.
         */
        resolve<T>(token: Token<T> | IInjectable<T>): T;
        /**
         * Resolve an instance for the given token.
         *
         * An error is thrown if the token is not registered.
         */
        private _resolveToken<T>(token, key);
        /**
         * Resolve an instance of the given type.
         *
         * An error is thrown if the type dependencies cannot be fulfilled.
         */
        private _resolveType<T>(type, key);
        private _registry;
    }
}

declare module phosphor.di {
    /**
     * A class type which declares its injection dependencies.
     */
    interface IInjectable<T> {
        /**
         * The constructor signature for the class.
         */
        new (...args: any[]): T;
        /**
         * The type ids of the dependencies needed to instantiate the type.
         */
        $inject?: Token<any>[];
    }
    /**
     * An object which manages dependency injection.
     */
    interface IContainer {
        /**
         * Test whether a type is registered with the container.
         */
        isRegistered<T>(token: Token<T>): boolean;
        /**
         * Register a type mapping with the container.
         *
         * An exception will be thrown if the token is already registered.
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
        registerType<T>(token: Token<T>, type: IInjectable<T>, lifetime?: string): void;
        /**
         * Register an instance mapping with the container.
         *
         * This is the same as a 'singleton' type registration, except
         * that the user creates the instance of the type beforehand.
         *
         * This will throw an exception if the token is already registered.
         */
        registerInstance<T>(token: Token<T>, instance: T): void;
        /**
         * Resolve an instance for the given token or type.
         *
         * An error is thrown if no type mapping is registered for the
         * token or if the injection dependencies cannot be fulfilled.
         */
        resolve<T>(token: Token<T> | IInjectable<T>): T;
    }
    /**
     * The interface token for IContainer.
     */
    var IContainer: Token<IContainer>;
}

declare module phosphor.virtualdom {
    /**
     * A typedef for a factory child argument.
     */
    type FactoryChild = (string | Elem) | (string | Elem)[];
    /**
     * A factory function which creates an elem instance.
     */
    interface IFactory<T extends IData> {
        /**
         * Create an elem instance with the given children.
         */
        (...children: FactoryChild[]): Elem;
        /**
         * Create an elem instance with the given data and children.
         */
        (data: T, ...children: FactoryChild[]): Elem;
    }
    /**
     * Create an elem factory function for the given tag.
     *
     * This will typically be used to create an elem factory function for
     * a user defined component. The `virtualdom` module exports a `dom`
     * object which contains factories for the standard DOM elements.
     */
    function createFactory<T extends IData>(tag: string | IComponentClass<T>): IFactory<T>;
}

declare module phosphor.virtualdom {
    import Queue = collections.Queue;
    import IMessage = core.IMessage;
    import NodeBase = core.NodeBase;
    /**
     * A concrete implementation of IComponent.
     *
     * This class serves as a convenient base class for components which
     * manage the content of their node independent of the virtual DOM.
     */
    class BaseComponent<T extends IData> extends NodeBase implements IComponent<T> {
        /**
         * Construct a new base component.
         */
        constructor(data: T, children: Elem[]);
        /**
         * Dispose of the resources held by the component.
         */
        dispose(): void;
        /**
         * Get the current data object for the component.
         */
        data: T;
        /**
         * Get the current elem children for the component.
         */
        children: Elem[];
        /**
         * Initialize the component with new data and children.
         *
         * This is called whenever the component is re-rendered by its parent.
         *
         * It is *not* called when the component is first instantiated.
         */
        init(data: T, children: Elem[]): void;
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
        update(immediate?: boolean): void;
        /**
         * Process a message sent to the component.
         */
        processMessage(msg: IMessage): void;
        /**
         * Compress a message posted to the component.
         */
        compressMessage(msg: IMessage, pending: Queue<IMessage>): boolean;
        /**
         * A method invoked on an 'update-request' message.
         *
         * The default implementation is a no-op.
         */
        protected onUpdateRequest(msg: IMessage): void;
        /**
         * A method invoked on an 'after-attach' message.
         *
         * The default implementation is a no-op.
         */
        protected onAfterAttach(msg: IMessage): void;
        /**
         * A method invoked on a 'before-detach' message.
         *
         * The default implementation is a no-op.
         */
        protected onBeforeDetach(msg: IMessage): void;
        /**
         * A method invoked on a 'before-move' message.
         *
         * The default implementation is a no-op.
         */
        protected onBeforeMove(msg: IMessage): void;
        /**
         * A method invoked on an 'after-move' message.
         *
         * The default implementation is a no-op.
         */
        protected onAfterMove(msg: IMessage): void;
        private _data;
        private _children;
    }
}

declare module phosphor.virtualdom {
    import IMessage = core.IMessage;
    /**
     * A component which renders its content using the virtual DOM.
     *
     * User code should subclass this class and reimplement the `render`
     * method to generate the virtual DOM content for the component.
     */
    class Component<T extends IData> extends BaseComponent<T> {
        /**
         * The tag name to use when creating the component node.
         *
         * This may be reimplemented by a subclass.
         */
        static tagName: string;
        /**
         * The initial class name for the component node.
         *
         * This may be reimplemented by a subclass.
         */
        static className: string;
        /**
         * Create the DOM node for a component.
         *
         * This method creates the DOM node from the `className` and `tagName`
         * properties. A subclass will not typically reimplement this method.
         */
        static createNode(): HTMLElement;
        /**
         * Dispose of the resources held by the component.
         */
        dispose(): void;
        /**
         * Get the current refs mapping for the component.
         */
        refs: any;
        /**
         * Process a message sent to the component.
         */
        processMessage(msg: IMessage): void;
        /**
         * Create the virtual DOM content for the component.
         *
         * The rendered content is used to populate the component's node.
         *
         * The default implementation returns `null`.
         */
        protected render(): Elem | Elem[];
        /**
         * A method invoked on an 'update-request' message.
         *
         * This renders the virtual DOM content into the component's node.
         */
        protected onUpdateRequest(msg: IMessage): void;
        /**
         * A method invoked on a 'before-render' message.
         *
         * The default implementation is a no-op.
         */
        protected onBeforeRender(msg: IMessage): void;
        /**
         * A method invoked on an 'after-render' message.
         *
         * The default implementation is a no-op.
         */
        protected onAfterRender(msg: IMessage): void;
        private _refs;
    }
}

declare module phosphor.virtualdom {
    /**
     * The attributes available for all elements.
     */
    interface IElementAttributes extends IData {
        accessKey?: string;
        className?: string;
        contentEditable?: string;
        dataset?: any;
        dir?: string;
        draggable?: boolean;
        hidden?: any;
        id?: string;
        lang?: string;
        spellcheck?: boolean;
        style?: any;
        tabIndex?: number;
        title?: string;
        onabort?: (ev: UIEvent) => any;
        onbeforecopy?: (ev: DragEvent) => any;
        onbeforecut?: (ev: DragEvent) => any;
        onbeforepaste?: (ev: DragEvent) => any;
        onblur?: (ev: FocusEvent) => any;
        oncanplay?: (ev: Event) => any;
        oncanplaythrough?: (ev: Event) => any;
        onchange?: (ev: Event) => any;
        onclick?: (ev: MouseEvent) => any;
        oncontextmenu?: (ev: MouseEvent) => any;
        oncopy?: (ev: DragEvent) => any;
        oncuechange?: (ev: Event) => any;
        oncut?: (ev: DragEvent) => any;
        ondblclick?: (ev: MouseEvent) => any;
        ondrag?: (ev: DragEvent) => any;
        ondragend?: (ev: DragEvent) => any;
        ondragenter?: (ev: DragEvent) => any;
        ondragleave?: (ev: DragEvent) => any;
        ondragover?: (ev: DragEvent) => any;
        ondragstart?: (ev: DragEvent) => any;
        ondrop?: (ev: DragEvent) => any;
        ondurationchange?: (ev: Event) => any;
        onended?: (ev: Event) => any;
        onemptied?: (ev: Event) => any;
        onerror?: (ev: ErrorEvent) => any;
        onfocus?: (ev: FocusEvent) => any;
        onhelp?: (ev: Event) => any;
        oninput?: (ev: Event) => any;
        onkeydown?: (ev: KeyboardEvent) => any;
        onkeypress?: (ev: KeyboardEvent) => any;
        onkeyup?: (ev: KeyboardEvent) => any;
        onload?: (ev: Event) => any;
        onloadeddata?: (ev: Event) => any;
        onloadedmetadata?: (ev: Event) => any;
        onloadstart?: (ev: Event) => any;
        onmousedown?: (ev: MouseEvent) => any;
        onmouseenter?: (ev: MouseEvent) => any;
        onmouseleave?: (ev: MouseEvent) => any;
        onmousemove?: (ev: MouseEvent) => any;
        onmouseout?: (ev: MouseEvent) => any;
        onmouseover?: (ev: MouseEvent) => any;
        onmouseup?: (ev: MouseEvent) => any;
        onmousewheel?: (ev: MouseWheelEvent) => any;
        onpaste?: (ev: DragEvent) => any;
        onpause?: (ev: Event) => any;
        onplay?: (ev: Event) => any;
        onplaying?: (ev: Event) => any;
        onprogress?: (ev: ProgressEvent) => any;
        onratechange?: (ev: Event) => any;
        onreadystatechange?: (ev: Event) => any;
        onreset?: (ev: Event) => any;
        onscroll?: (ev: UIEvent) => any;
        onseeked?: (ev: Event) => any;
        onseeking?: (ev: Event) => any;
        onselect?: (ev: UIEvent) => any;
        onselectstart?: (ev: Event) => any;
        onstalled?: (ev: Event) => any;
        onsubmit?: (ev: Event) => any;
        onsuspend?: (ev: Event) => any;
        ontimeupdate?: (ev: Event) => any;
        onvolumechange?: (ev: Event) => any;
        onwaiting?: (ev: Event) => any;
    }
    /**
     * The attributes for <a> elements.
     */
    interface IAnchorAttributes extends IElementAttributes {
        download?: string;
        href?: string;
        hreflang?: string;
        media?: string;
        rel?: string;
        target?: string;
        type?: string;
    }
    /**
     * The attributes for <area> elements.
     */
    interface IAreaAttributes extends IElementAttributes {
        alt?: string;
        coords?: string;
        download?: string;
        href?: string;
        hreflang?: string;
        media?: string;
        rel?: string;
        shape?: string;
        target?: string;
        type?: string;
    }
    /**
     * The attributes for <button> elements.
     */
    interface IButtonAttributes extends IElementAttributes {
        autofocus?: boolean;
        disabled?: boolean;
        form?: string;
        formAction?: string;
        formEnctype?: string;
        formMethod?: string;
        formNoValidate?: boolean;
        formTarget?: string;
        name?: string;
        type?: string;
        value?: string;
    }
    /**
     * The attributes for <canvas> elements.
     */
    interface ICanvasAttributes extends IElementAttributes {
        width?: number;
        height?: number;
    }
    /**
     * The attributes for <data> elements.
     */
    interface IDataAttributes extends IElementAttributes {
        value?: string;
    }
    /**
     * The attributes for <embed> elements.
     */
    interface IEmbedAttributes extends IElementAttributes {
        height?: string;
        src?: string;
        type?: string;
        width?: string;
    }
    /**
     * The attributes for <fieldset> elements.
     */
    interface IFieldSetAttributes extends IElementAttributes {
        disabled?: boolean;
        form?: string;
        name?: string;
    }
    /**
     * The attributes for <form> elements.
     */
    interface IFormAttributes extends IElementAttributes {
        acceptCharset?: string;
        action?: string;
        autocomplete?: string;
        enctype?: string;
        method?: string;
        name?: string;
        noValidate?: boolean;
        target?: string;
    }
    /**
     * The attributes for <iframe> elements.
     */
    interface IIFrameAttributes extends IElementAttributes {
        allowFullscreen?: boolean;
        height?: string;
        name?: string;
        sandbox?: string;
        seamless?: boolean;
        src?: string;
        srcdoc?: string;
        width?: string;
    }
    /**
     * The attributes for <img> elements.
     */
    interface IImageAttributes extends IElementAttributes {
        alt?: string;
        crossOrigin?: string;
        height?: number;
        isMap?: boolean;
        src?: string;
        sizes?: string;
        srcset?: string;
        width?: number;
        useMap?: string;
    }
    /**
     * The attributes for <input> elements.
     */
    interface IInputAttributes extends IElementAttributes {
        accept?: string;
        alt?: string;
        autocomplete?: string;
        autofocus?: boolean;
        checked?: boolean;
        disabled?: boolean;
        form?: string;
        formAction?: string;
        formEnctype?: string;
        formMethod?: string;
        formNoValidate?: boolean;
        formTarget?: string;
        height?: string;
        inputMode?: string;
        list?: string;
        max?: string;
        maxLength?: number;
        min?: string;
        minLength?: number;
        multiple?: boolean;
        name?: string;
        pattern?: string;
        placeholder?: string;
        readOnly?: boolean;
        required?: boolean;
        size?: number;
        spellcheck?: boolean;
        src?: string;
        step?: string;
        type?: string;
        value?: string;
        width?: string;
    }
    /**
     * The attributes for <label> elements.
     */
    interface ILabelAttributes extends IElementAttributes {
        form?: string;
        htmlFor?: string;
    }
    /**
     * The attributes for <li> elements.
     */
    interface ILIAttributes extends IElementAttributes {
        value?: number;
    }
    /**
     * The attributes for <map> elements.
     */
    interface IMapAttributes extends IElementAttributes {
        name?: string;
    }
    /**
     * The attributes for <meter> elements.
     */
    interface IMeterAttributes extends IElementAttributes {
        high?: number;
        low?: number;
        max?: number;
        min?: number;
        optimum?: number;
        value?: number;
    }
    /**
     * The attributes for <audio> and <video> elements.
     */
    interface IMediaAttributes extends IElementAttributes {
        autoplay?: boolean;
        controls?: boolean;
        crossOrigin?: string;
        loop?: boolean;
        mediaGroup?: string;
        muted?: boolean;
        preload?: string;
        src?: string;
        volume?: number;
    }
    /**
     * The attributes for <del> and <ins> elements.
     */
    interface IModAttributes extends IElementAttributes {
        cite?: string;
        dateTime?: string;
    }
    /**
     * The attributes for <object> elements.
     */
    interface IObjectAttributes extends IElementAttributes {
        data?: string;
        form?: string;
        height?: string;
        name?: string;
        type?: string;
        typeMustMatch?: boolean;
        useMap?: string;
        width?: string;
    }
    /**
     * The attributes for <ol> elements.
     */
    interface IOListAttributes extends IElementAttributes {
        reversed?: boolean;
        start?: number;
        type?: string;
    }
    /**
     * The attributes for <optgroup> elements.
     */
    interface IOptGroupAttributes extends IElementAttributes {
        disabled?: boolean;
        label?: string;
    }
    /**
     * The attributes for <option> elements.
     */
    interface IOptionAttributes extends IElementAttributes {
        disabled?: boolean;
        label?: string;
        selected?: boolean;
        value?: string;
    }
    /**
     * The attributes for <output> elements.
     */
    interface IOutputAttributes extends IElementAttributes {
        form?: string;
        htmlFor?: string;
        name?: string;
    }
    /**
     * The attributes for <param> elements.
     */
    interface IParamAttributes extends IElementAttributes {
        name?: string;
        value?: string;
    }
    /**
     * The attributes for <progress> elements.
     */
    interface IProgressAttributes extends IElementAttributes {
        max?: number;
        value?: number;
    }
    /**
     * The attributes for <blockquote> elements.
     */
    interface IQuoteAttributes extends IElementAttributes {
        cite?: string;
    }
    /**
     * The attributes for <select> elements.
     */
    interface ISelectAttributes extends IElementAttributes {
        autofocus?: boolean;
        disabled?: boolean;
        form?: string;
        multiple?: boolean;
        name?: string;
        required?: boolean;
        size?: number;
    }
    /**
     * The attributes for <source> elements.
     */
    interface ISourceAttributes extends IElementAttributes {
        media?: string;
        sizes?: string;
        src?: string;
        srcset?: string;
        type?: string;
    }
    /**
     * The attributes for <col> elements.
     */
    interface ITableColAttributes extends IElementAttributes {
        span?: number;
    }
    /**
     * The attributes for <td> elements.
     */
    interface ITableDataCellAttributes extends IElementAttributes {
        colSpan?: number;
        headers?: number;
        rowSpan?: number;
    }
    /**
     * The attributes for <th> elements.
     */
    interface ITableHeaderCellAttributes extends IElementAttributes {
        colSpan?: number;
        headers?: string;
        rowSpan?: number;
        scope?: string;
        sorted?: string;
    }
    /**
     * The attributes for <textarea> elements.
     */
    interface ITextAreaAttributes extends IElementAttributes {
        autocomplete?: string;
        autofocus?: boolean;
        cols?: number;
        dirName?: string;
        disabled?: boolean;
        form?: string;
        inputMode?: string;
        maxLength?: number;
        minLength?: number;
        name?: string;
        placeholder?: string;
        readOnly?: boolean;
        required?: boolean;
        rows?: number;
        wrap?: string;
    }
    /**
     * The attributes for <time> elements.
     */
    interface ITimeAttributes extends IElementAttributes {
        dateTime?: string;
    }
    /**
     * The attributes for <track> elements.
     */
    interface ITrackAttributes extends IElementAttributes {
        default?: boolean;
        kind?: string;
        label?: string;
        src?: string;
        srclang?: string;
    }
    /**
     * The attributes for <video> elements.
     */
    interface IVideoAttributes extends IMediaAttributes {
        height?: number;
        poster?: string;
        width?: number;
    }
    /**
     * The virtual dom factory functions.
     */
    var dom: {
        a: IFactory<IAnchorAttributes>;
        abbr: IFactory<IElementAttributes>;
        address: IFactory<IElementAttributes>;
        area: IFactory<IAreaAttributes>;
        article: IFactory<IElementAttributes>;
        aside: IFactory<IElementAttributes>;
        audio: IFactory<IMediaAttributes>;
        b: IFactory<IElementAttributes>;
        bdi: IFactory<IElementAttributes>;
        bdo: IFactory<IElementAttributes>;
        blockquote: IFactory<IQuoteAttributes>;
        br: IFactory<IElementAttributes>;
        button: IFactory<IButtonAttributes>;
        canvas: IFactory<ICanvasAttributes>;
        caption: IFactory<IElementAttributes>;
        cite: IFactory<IElementAttributes>;
        code: IFactory<IElementAttributes>;
        col: IFactory<ITableColAttributes>;
        colgroup: IFactory<ITableColAttributes>;
        data: IFactory<IDataAttributes>;
        datalist: IFactory<IElementAttributes>;
        dd: IFactory<IElementAttributes>;
        del: IFactory<IModAttributes>;
        dfn: IFactory<IElementAttributes>;
        div: IFactory<IElementAttributes>;
        dl: IFactory<IElementAttributes>;
        dt: IFactory<IElementAttributes>;
        em: IFactory<IElementAttributes>;
        embed: IFactory<IEmbedAttributes>;
        fieldset: IFactory<IFieldSetAttributes>;
        figcaption: IFactory<IElementAttributes>;
        figure: IFactory<IElementAttributes>;
        footer: IFactory<IElementAttributes>;
        form: IFactory<IFormAttributes>;
        h1: IFactory<IElementAttributes>;
        h2: IFactory<IElementAttributes>;
        h3: IFactory<IElementAttributes>;
        h4: IFactory<IElementAttributes>;
        h5: IFactory<IElementAttributes>;
        h6: IFactory<IElementAttributes>;
        header: IFactory<IElementAttributes>;
        hr: IFactory<IElementAttributes>;
        i: IFactory<IElementAttributes>;
        iframe: IFactory<IIFrameAttributes>;
        img: IFactory<IImageAttributes>;
        input: IFactory<IInputAttributes>;
        ins: IFactory<IModAttributes>;
        kbd: IFactory<IElementAttributes>;
        label: IFactory<ILabelAttributes>;
        legend: IFactory<IElementAttributes>;
        li: IFactory<ILIAttributes>;
        main: IFactory<IElementAttributes>;
        map: IFactory<IMapAttributes>;
        mark: IFactory<IElementAttributes>;
        meter: IFactory<IMeterAttributes>;
        nav: IFactory<IElementAttributes>;
        noscript: IFactory<IElementAttributes>;
        object: IFactory<IObjectAttributes>;
        ol: IFactory<IOListAttributes>;
        optgroup: IFactory<IOptGroupAttributes>;
        option: IFactory<IOptionAttributes>;
        output: IFactory<IOutputAttributes>;
        p: IFactory<IElementAttributes>;
        param: IFactory<IElementAttributes>;
        pre: IFactory<IElementAttributes>;
        progress: IFactory<IProgressAttributes>;
        q: IFactory<IElementAttributes>;
        rp: IFactory<IElementAttributes>;
        rt: IFactory<IElementAttributes>;
        ruby: IFactory<IElementAttributes>;
        s: IFactory<IElementAttributes>;
        samp: IFactory<IElementAttributes>;
        section: IFactory<IElementAttributes>;
        select: IFactory<ISelectAttributes>;
        small: IFactory<IElementAttributes>;
        source: IFactory<ISourceAttributes>;
        span: IFactory<IElementAttributes>;
        strong: IFactory<IElementAttributes>;
        sub: IFactory<IElementAttributes>;
        summary: IFactory<IElementAttributes>;
        sup: IFactory<IElementAttributes>;
        table: IFactory<IElementAttributes>;
        tbody: IFactory<IElementAttributes>;
        td: IFactory<ITableDataCellAttributes>;
        textarea: IFactory<ITextAreaAttributes>;
        tfoot: IFactory<IElementAttributes>;
        th: IFactory<ITableHeaderCellAttributes>;
        thead: IFactory<IElementAttributes>;
        time: IFactory<ITimeAttributes>;
        title: IFactory<IElementAttributes>;
        tr: IFactory<IElementAttributes>;
        track: IFactory<ITrackAttributes>;
        u: IFactory<IElementAttributes>;
        ul: IFactory<IElementAttributes>;
        var: IFactory<IElementAttributes>;
        video: IFactory<IVideoAttributes>;
        wbr: IFactory<IElementAttributes>;
    };
}

declare module phosphor.virtualdom {
    /**
     * An enum of supported elem types.
     */
    enum ElemType {
        /**
         * The elem represents a text node.
         */
        Text = 0,
        /**
         * The elem represents an HTMLElement node.
         */
        Node = 1,
        /**
         * The elem represents a component.
         */
        Component = 2,
    }
    /**
     * A typedef for an elem tag.
     */
    type ElemTag = string | IComponentClass<any>;
    /**
     * A data object for an elem.
     */
    interface IData {
        /**
         * The key id for the elem.
         *
         * If an elem is given a key id, the generated node will not be
         * recreated during a rendering update if it moves in the render
         * tree provided the type of the node does not change.
         */
        key?: string;
        /**
         * The ref id for the elem.
         *
         * If an elem is given a ref id, the generated node or component
         * will be added to the ref mapping created by the renderer.
         */
        ref?: string;
    }
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
    class Elem {
        /**
         * The type of the elem.
         */
        type: ElemType;
        /**
         * The tag for the elem.
         *
         * The interpretation of the tag depends on the elem type:
         *   Text - the text content
         *   Node - the node tag name
         *   Component - the component constructor
         */
        tag: ElemTag;
        /**
         * The data object for the elem.
         *
         * The interpretation of the data depends on the elem type:
         *   Text - an empty object
         *   Node - the node attributes object
         *   Component - the component data object
         */
        data: IData;
        /**
         * The array of child elements.
         */
        children: Elem[];
        /**
         * Construct a new virtual elem.
         */
        constructor(type: ElemType, tag: ElemTag, data: IData, children: Elem[]);
    }
}

declare module phosphor.virtualdom {
    import IMessageHandler = core.IMessageHandler;
    import IDisposable = utility.IDisposable;
    /**
     * An object which manages its own DOM node in a virtual DOM hierarchy.
     *
     * The renderer will send a component the following messages:
     *
     *   'update-request' - Sent when the component should update.
     *
     *   'after-attach' - Sent after the node is attached to the DOM.
     *
     *   'before-detach' - Sent before the node is detached from the DOM.
     *
     *   'before-move' - Sent before the node is moved in the DOM.
     *
     *   'after-move' - Sent after the node is moved in the DOM.
     */
    interface IComponent<T extends IData> extends IDisposable, IMessageHandler {
        /**
         * The DOM node for the component.
         *
         * This must remain constant for the lifetime of the component.
         */
        node: HTMLElement;
        /**
         * Initialize the component with new data and children.
         *
         * This is called whenever the component is re-rendered by its parent.
         *
         * It is *not* called when the component is first instantiated.
         */
        init(data: T, children: Elem[]): void;
    }
    /**
     * A component class type.
     */
    interface IComponentClass<T extends IData> {
        /**
         * Construct a new component.
         */
        new (data: T, children: Elem[]): IComponent<T>;
    }
}

declare module phosphor.virtualdom {
    /**
     * Render virtual content into a host node.
     *
     * This renders the delta from the previous rendering. It assumes that
     * the contents of the host node are not manipulated by external code.
     * Modifying the host node will result in undefined rendering behavior.
     *
     * Returns an object which maps ref names to nodes and components.
     */
    function render(content: Elem | Elem[], host: Node): any;
}

declare module phosphor.widgets {
    /**
     * An enum of alignment bit flags.
     */
    enum Alignment {
        /**
         * Align with the left edge.
         */
        Left = 1,
        /**
         * Align with the right edge.
         */
        Right = 2,
        /**
         * Align with the horizontal center.
         */
        HorizontalCenter = 4,
        /**
         * Align with the top edge.
         */
        Top = 16,
        /**
         * Align with the bottom edge.
         */
        Bottom = 32,
        /**
         * Align with the vertical center.
         */
        VerticalCenter = 64,
        /**
         * Align with the horizontal and vertical center.
         */
        Center = 68,
        /**
         * A mask of horizontal alignment values.
         */
        Horizontal_Mask = 7,
        /**
         * A mask of vertical alignment values.
         */
        Vertical_Mask = 112,
    }
}

declare module phosphor.widgets {
    import Message = core.Message;
    /**
     * A class for messages related to child widgets.
     */
    class ChildMessage extends Message {
        /**
         * Construct a new child message.
         */
        constructor(type: string, child: Widget);
        /**
         * The child widget for the message.
         */
        child: Widget;
        private _child;
    }
}

declare module phosphor.widgets {
    /**
     * An enum of layout directions.
     */
    enum Direction {
        /**
         * Left to right direction.
         */
        LeftToRight = 0,
        /**
         * Right to left direction.
         */
        RightToLeft = 1,
        /**
         * Top to bottom direction.
         */
        TopToBottom = 2,
        /**
         * Bottom to top direction.
         */
        BottomToTop = 3,
    }
}

declare module phosphor.widgets {
    /**
     * An enum of docking modes for a dock area.
     */
    enum DockMode {
        /**
         * Insert the widget at the top of the dock area.
         */
        Top = 0,
        /**
         * Insert the widget at the left of the dock area.
         */
        Left = 1,
        /**
         * Insert the widget at the right of the dock area.
         */
        Right = 2,
        /**
         * Insert the widget at the bottom of the dock area.
         */
        Bottom = 3,
        /**
         * Insert the widget as a new split item above the reference.
         */
        SplitTop = 4,
        /**
         * Insert the widget as a new split item to the left of the reference.
         */
        SplitLeft = 5,
        /**
         * Insert the widget as a new split item to the right of the reference.
         */
        SplitRight = 6,
        /**
         * Insert the widget as a new split item below the reference.
         */
        SplitBottom = 7,
        /**
         * Insert the widget as a new tab before the reference.
         */
        TabBefore = 8,
        /**
         * Insert the widget as a new tab after the reference.
         */
        TabAfter = 9,
    }
}

declare module phosphor.widgets {
    import Size = utility.Size;
    /**
     * An object which manages an item in a layout.
     */
    interface ILayoutItem {
        /**
         * Test whether the item manages a widget.
         */
        isWidget: boolean;
        /**
         * Test whether the item manages empty space.
         */
        isSpacer: boolean;
        /**
         * Test whether the item should be treated as hidden.
         */
        isHidden: boolean;
        /**
         * The widget the item manages, if any.
         */
        widget: Widget;
        /**
         * The alignment for the item in its layout cell.
         */
        alignment: Alignment;
        /**
         * Test whether the item should be expanded horizontally.
         *
         * If this is true, the item will get as much space as possible
         * in the horizontal direction up to its maximum size.
         */
        expandHorizontal: boolean;
        /**
         * Test Whether the item should be expanded vertically.
         *
         * If this is true, the item will get as much space as possible
         * in the vertical direction up to its maximum size.
         */
        expandVertical: boolean;
        /**
         * Invalidate the cached data for the item.
         */
        invalidate(): void;
        /**
         * Compute the preferred size of the item.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum allowed size of the item.
         */
        minSize(): Size;
        /**
         * Compute the maximum allowed size of the item.
         */
        maxSize(): Size;
        /**
         * Set the geometry of the item using the given values.
         */
        setGeometry(x: number, y: number, width: number, height: number): void;
    }
}

declare module phosphor.widgets {
    import Message = core.Message;
    /**
     * A message class for 'move' messages.
     */
    class MoveMessage extends Message {
        /**
         * Construct a new move message.
         */
        constructor(oldX: number, oldY: number, x: number, y: number);
        /**
         * The previous X coordinate of the widget.
         */
        oldX: number;
        /**
         * The previous Y coordinate of the widget.
         */
        oldY: number;
        /**
         * The current X coordinate of the widget.
         */
        x: number;
        /**
         * The current Y coordinate of the widget.
         */
        y: number;
        /**
         * The change in X coordinate of the widget.
         */
        deltaX: number;
        /**
         * The change in Y coordinate of the widget.
         */
        deltaY: number;
        private _oldX;
        private _oldY;
        private _x;
        private _y;
    }
}

declare module phosphor.widgets {
    /**
     * An enum of layout orientations.
     */
    enum Orientation {
        /**
         * Horizontal orientation.
         */
        Horizontal = 0,
        /**
         * Vertical orientation.
         */
        Vertical = 1,
    }
}

declare module phosphor.widgets {
    import Message = core.Message;
    /**
     * A message class for 'resize' messages.
     */
    class ResizeMessage extends Message {
        /**
         * Construct a new resize message.
         */
        constructor(oldWidth: number, oldHeight: number, width: number, height: number);
        /**
         * The previous width of the widget.
         */
        oldWidth: number;
        /**
         * The previous height of the widget.
         */
        oldHeight: number;
        /**
         * The current width of the widget.
         */
        width: number;
        /**
         * The current height of the widget.
         */
        height: number;
        /**
         * The change in width of the widget.
         */
        deltaWidth: number;
        /**
         * The change in height of the widget.
         */
        deltaHeight: number;
        private _oldWidth;
        private _oldHeight;
        private _width;
        private _height;
    }
}

declare module phosphor.widgets {
    /**
     * An enum of size policy values.
     *
     * A size policy controls how layouts interpret a widget's `sizeHint`.
     */
    enum SizePolicy {
        /**
         * A policy indicating that the `sizeHint` is the only acceptable
         * size for the widget.
         */
        Fixed = 0,
        /**
         * A bit flag indicating the widget can grow beyond `sizeHint`.
         */
        GrowFlag = 1,
        /**
         * A bit flag indicating the widget can shrink below `sizeHint`.
         */
        ShrinkFlag = 2,
        /**
         * A bit flag indicating the widget should expand beyond `sizeHint`.
         */
        ExpandFlag = 4,
        /**
         * A bit flag indicating the `sizeHint` is ignored.
         */
        IgnoreFlag = 8,
        /**
         * A policy indicating that the `sizeHint` is a minimum, but the
         * widget can be expanded if needed and still be useful.
         */
        Minimum = 1,
        /**
         * A policy indicating that the `sizeHint` is a maximum, but the
         * widget can be shrunk if needed and still be useful.
         */
        Maximum = 2,
        /**
         * A policy indicating that the `sizeHint` is preferred, but the
         * widget can grow or shrink if needed and still be useful.
         *
         * This is the default size policy.
         */
        Preferred = 3,
        /**
         * A policy indicating that `sizeHint` is reasonable, but the widget
         * can shrink if needed and still be useful. It can also make use of
         * extra space and should expand as much as possible.
         */
        Expanding = 7,
        /**
         * A policy indicating that `sizeHint` is a minimum. The widget can
         * make use of extra space and should expand as much as possible.
         */
        MinimumExpanding = 5,
        /**
         * A policy indicating the `sizeHint` is ignored.
         */
        Ignored = 11,
    }
}

declare module phosphor.widgets {
    /**
     * An enum of widget bit flags.
     *
     * Widget flags are used to control various low-level behaviors of
     * a widget. They are typically not used directly by user code.
     */
    enum WidgetFlag {
        /**
         * The widget is attached to the DOM.
         */
        IsAttached = 1,
        /**
         * The widget is explicitly hidden.
         */
        IsHidden = 2,
        /**
         * The widget is visible.
         */
        IsVisible = 4,
        /**
         * The widget has been disposed.
         */
        IsDisposed = 8,
        /**
         * Changing the widget layout is disallowed.
         */
        DisallowLayoutChange = 16,
    }
}

declare module phosphor.widgets {
    import IMessage = core.IMessage;
    import IMessageHandler = core.IMessageHandler;
    import IMessageFilter = core.IMessageFilter;
    import IDisposable = utility.IDisposable;
    import Size = utility.Size;
    /**
     * The base class of phosphor layouts.
     *
     * The Layout class does not define an interface for adding widgets to
     * the layout. A subclass should define that API in a manner suitable
     * for its intended use.
     */
    class Layout implements IMessageFilter, IDisposable {
        /**
         * Construct a new layout.
         */
        constructor();
        /**
         * Dispose of the resources held by the layout.
         */
        dispose(): void;
        /**
         * Get the parent widget of the layout.
         */
        /**
         * Set the parent widget of the layout.
         *
         * The parent widget can only be set once, and is done automatically
         * when the layout is installed on a widget. This should not be set
         * directly by user code.
         */
        parent: Widget;
        /**
         * Get the number of layout items in the layout.
         *
         * This must be implemented by a subclass.
         */
        count: number;
        /**
         * Get the layout item at the given index.
         *
         * This must be implemented by a subclass.
         */
        itemAt(index: number): ILayoutItem;
        /**
         * Remove and return the layout item at the given index.
         *
         * This must be implemented by a subclass.
         */
        removeAt(index: number): ILayoutItem;
        /**
         * Compute the size hint for the layout.
         *
         * This must be implemented by a subclass.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum required size for the layout.
         *
         * This must be implemented by a subclass.
         */
        minSize(): Size;
        /**
         * Compute the maximum allowed size for the layout.
         *
         * This must be implemented by a subclass.
         */
        maxSize(): Size;
        /**
         * Get the widget at the given index.
         *
         * Returns `undefined` if there is no widget at the given index.
         */
        widgetAt(index: number): Widget;
        /**
         * Get the index of the given widget or layout item.
         *
         * Returns -1 if the widget or item does not exist in the layout.
         */
        indexOf(value: Widget | ILayoutItem): number;
        /**
         * Remove an item from the layout and return its index.
         *
         * Returns -1 if the item is not in the layout.
         */
        remove(value: Widget | ILayoutItem): number;
        /**
         * Get the alignment for the given widget.
         *
         * Returns 0 if the widget is not found in the layout.
         */
        alignment(widget: Widget): Alignment;
        /**
         * Set the alignment for the given widget.
         *
         * Returns true if the alignment was updated, false otherwise.
         */
        setAlignment(widget: Widget, alignment: Alignment): boolean;
        /**
         * Invalidate the cached layout data and enqueue an update.
         *
         * This should be reimplemented by a subclass as needed.
         */
        invalidate(): void;
        /**
         * Refresh the layout for the parent widget immediately.
         *
         * This is typically called automatically at the appropriate times.
         */
        refresh(): void;
        /**
         * Filter a message sent to a message handler.
         *
         * This implements the `IMessageFilter` interface.
         */
        filterMessage(handler: IMessageHandler, msg: IMessage): boolean;
        /**
         * Process a message dispatched to the parent widget.
         *
         * Subclasses may reimplement this method as needed.
         */
        protected processParentMessage(msg: IMessage): void;
        /**
         * A method invoked when widget layout should be updated.
         *
         * The arguments are the content boundaries for the layout which are
         * already adjusted to account for the parent widget box sizing data.
         *
         * The default implementation of this method is a no-op.
         */
        protected layout(x: number, y: number, width: number, height: number): void;
        /**
         * Ensure a child widget is parented to the layout's parent.
         *
         * This should be called by a subclass when adding a widget.
         */
        protected ensureParent(widget: Widget): void;
        /**
         * Reparent the child widgets to the layout's parent.
         *
         * This is typically called automatically at the proper times.
         */
        protected reparentChildWidgets(): void;
        private _parent;
    }
}

declare module phosphor.widgets {
    /**
     * A sizer object for the `layoutCalc` function.
     *
     * Instances of this class are used internally by the panel layouts
     * to implement their layout logic. User code will not typically use
     * this class directly.
     */
    class LayoutSizer {
        /**
         * The size hint for the sizer.
         *
         * The sizer will be given this initial size subject to its bounds.
         */
        sizeHint: number;
        /**
         * The minimum size of the sizer.
         *
         * The sizer will never be sized less than this value.
         *
         * Limits: [0, Infinity) && <= maxSize
         */
        minSize: number;
        /**
         * The maximum size of the sizer.
         *
         * The sizer will never be sized greater than this value.
         *
         * Limits: [0, Infinity] && >= minSize
         */
        maxSize: number;
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
        stretch: number;
        /**
         * Whether the sizer should consume extra space if available.
         *
         * Expansive sizers will absorb any remaining space after all
         * stretch sizers have been resized to their limits.
         */
        expansive: boolean;
        /**
         * The computed size of the sizer.
         *
         * This value is the output of the algorithm.
         */
        size: number;
        /**
         * An internal storage property for the layout algorithm.
         */
        done: boolean;
    }
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
    function layoutCalc(sizers: LayoutSizer[], space: number): void;
}

declare module phosphor.widgets {
    import Size = utility.Size;
    /**
     * A layout item which manages empty space.
     *
     * User code will not typically use this class directly.
     */
    class SpacerItem implements ILayoutItem {
        /**
         * Construct a new spacer item.
         */
        constructor(width: number, height: number, hPolicy: SizePolicy, vPolicy: SizePolicy);
        /**
         * Test whether the item manages a widget.
         */
        isWidget: boolean;
        /**
         * Test whether the item manages empty space.
         */
        isSpacer: boolean;
        /**
         * Test whether the item should be treated as hidden.
         */
        isHidden: boolean;
        /**
         * The widget the item manages, if any.
         */
        widget: Widget;
        /**
         * Get the alignment for the item in its layout cell.
         */
        alignment: Alignment;
        /**
         * Test whether the item should be expanded horizontally.
         */
        expandHorizontal: boolean;
        /**
         * Test Whether the item should be expanded vertically.
         */
        expandVertical: boolean;
        /**
         * Change the sizing of the spacer item.
         *
         * The owner layout must be invalidated to reflect the change.
         */
        setSizing(width: number, height: number, hPolicy: SizePolicy, vPolicy: SizePolicy): void;
        /**
         * Transpose the effective orientation of the spacer item.
         */
        transpose(): void;
        /**
         * Invalidate the cached data for the item.
         */
        invalidate(): void;
        /**
         * Compute the preferred size of the item.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum size of the item.
         */
        minSize(): Size;
        /**
         * Compute the maximum size of the item.
         */
        maxSize(): Size;
        /**
         * Set the geometry of the item using the given values.
         */
        setGeometry(x: number, y: number, width: number, height: number): void;
        private _size;
        private _sizePolicy;
    }
}

declare module phosphor.widgets {
    import Size = utility.Size;
    /**
     * A layout item which manages a widget.
     *
     * User code will not typically use this class directly.
     */
    class WidgetItem implements ILayoutItem {
        /**
         * Construct a new widget item.
         */
        constructor(widget: Widget, alignment?: Alignment);
        /**
         * Test whether the item manages a widget.
         */
        isWidget: boolean;
        /**
         * Test whether the item manages empty space.
         */
        isSpacer: boolean;
        /**
         * Test whether the item should be treated as hidden.
         */
        isHidden: boolean;
        /**
         * The widget the item manages, if any.
         */
        widget: Widget;
        /**
         * Get the alignment for the item in its layout cell.
         */
        /**
         * Set the alignment for the item in its layout cell.
         *
         * The owner layout must be invalidated to reflect the change.
         */
        alignment: Alignment;
        /**
         * Test whether the item should be expanded horizontally.
         */
        expandHorizontal: boolean;
        /**
         * Test Whether the item should be expanded vertically.
         */
        expandVertical: boolean;
        /**
         * Invalidate the cached data for the item.
         */
        invalidate(): void;
        /**
         * Compute the preferred size of the item.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum size of the item.
         */
        minSize(): Size;
        /**
         * Compute the maximum size of the item.
         */
        maxSize(): Size;
        /**
         * Set the geometry of the item using the given values.
         */
        setGeometry(x: number, y: number, width: number, height: number): void;
        /**
         * Update the computed sizes for the widget item.
         */
        private _updateSizes();
        private _widget;
        private _alignment;
        private _origHint;
        private _sizeHint;
        private _minSize;
        private _maxSize;
    }
}

declare module phosphor.widgets {
    import Size = utility.Size;
    /**
     * A layout which arranges widgets in a row or column.
     */
    class BoxLayout extends Layout {
        /**
         * Construct a new box layout.
         */
        constructor(direction: Direction, spacing?: number);
        /**
         * Dispose of the resources held by the layout.
         */
        dispose(): void;
        /**
         * Get the layout direction for the box layout.
         */
        /**
         * Set the layout direction for the box layout.
         */
        direction: Direction;
        /**
         * Get the inter-element fixed spacing for the box layout.
         */
        /**
         * Set the inter-element fixed spacing for the box layout.
         */
        spacing: number;
        /**
         * Get the number of layout items in the layout.
         */
        count: number;
        /**
         * Get the layout item at the specified index.
         */
        itemAt(index: number): ILayoutItem;
        /**
         * Remove and return the layout item at the specified index.
         */
        removeAt(index: number): ILayoutItem;
        /**
         * Add a widget as the last item in the layout.
         *
         * If the widget already exists in the layout, it will be moved.
         *
         * Returns the index of the added widget.
         */
        addWidget(widget: Widget, stretch?: number, alignment?: Alignment): number;
        /**
         * Insert a widget into the layout at the given index.
         *
         * If the widget already exists in the layout, it will be moved.
         *
         * Returns the index of the added widget.
         */
        insertWidget(index: number, widget: Widget, stretch?: number, alignment?: Alignment): number;
        /**
         * Add a fixed amount of spacing to the end of the layout.
         *
         * Returns the index of the added space.
         */
        addSpacing(size: number): number;
        /**
         * Insert a fixed amount of spacing at the given index.
         *
         * Returns the index of the added space.
         */
        insertSpacing(index: number, size: number): number;
        /**
         * Add stretchable space to the end of the layout.
         *
         * Returns the index of the added space.
         */
        addStretch(stretch: number): number;
        /**
         * Insert stretchable space at the given index.
         */
        insertStretch(index: number, stretch: number): number;
        /**
         * Get the stretch factor for the given widget or index.
         *
         * Returns -1 if the given widget or index is invalid.
         */
        stretch(which: Widget | number): number;
        /**
         * Set the stretch factor for the given widget or index.
         *
         * Returns true if the stretch was updated, false otherwise.
         */
        setStretch(which: Widget | number, stretch: number): boolean;
        /**
         * Invalidate the cached layout data and enqueue an update.
         */
        invalidate(): void;
        /**
         * Compute the preferred size of the layout.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum size of the layout.
         */
        minSize(): Size;
        /**
         * Compute the maximum size of the layout.
         */
        maxSize(): Size;
        /**
         * Update the geometry of the child layout items.
         */
        protected layout(x: number, y: number, width: number, height: number): void;
        /**
         * Initialize the layout items and internal sizes for the layout.
         */
        private _setupGeometry();
        /**
         * Insert a layout item at the given index.
         *
         * Returns the index of the added item.
         */
        private _insert(index, item, stretch);
        private _dirty;
        private _fixedSpace;
        private _lastSpaceIndex;
        private _minSize;
        private _maxSize;
        private _sizeHint;
        private _items;
        private _sizers;
        private _direction;
        private _spacing;
    }
}

declare module phosphor.widgets {
    import NodeBase = core.NodeBase;
    /**
     * A class which manages a handle node for a split panel.
     */
    class SplitHandle extends NodeBase {
        /**
         * Create the DOM node for a split handle.
         */
        static createNode(): HTMLElement;
        /**
         * Construct a new split handle.
         */
        constructor(orientation: Orientation);
        /**
         * Get whether the handle is hidden.
         */
        /**
         * Set whether the handle is hidden.
         */
        hidden: boolean;
        /**
         * Get the orientation of the handle.
         */
        /**
         * Set the orientation of the handle.
         */
        orientation: Orientation;
        private _hidden;
        private _orientation;
    }
}

declare module phosphor.widgets {
    import Size = utility.Size;
    /**
     * A layout which arranges widgets in resizable sections.
     */
    class SplitLayout extends Layout {
        /**
         * Construct a new split layout.
         */
        constructor(orientation: Orientation);
        /**
         * Dispose of the resources held by the layout.
         */
        dispose(): void;
        /**
         * Get the orientation of the split layout.
         */
        /**
         * Set the orientation of the split layout.
         */
        orientation: Orientation;
        /**
         * Get the size of the split handles.
         */
        /**
         * Set the the size of the split handles.
         */
        handleSize: number;
        /**
         * Get the number of layout items in the layout.
         */
        count: number;
        /**
         * Get the normalized sizes of the items in the layout.
         */
        sizes(): number[];
        /**
         * Set the relative sizes for the split items.
         *
         * Extra values are ignored, too few will yield an undefined layout.
         */
        setSizes(sizes: number[]): void;
        /**
         * Get the splitter handle at the given index.
         */
        handleAt(index: number): SplitHandle;
        /**
         * Move the handle at the given index to the offset position.
         *
         * This will move the handle as close as possible to the given
         * offset position, without violating item size constraints.
         */
        moveHandle(index: number, pos: number): void;
        /**
         * Get the layout item at the specified index.
         */
        itemAt(index: number): ILayoutItem;
        /**
         * Remove and return the layout item at the specified index.
         */
        removeAt(index: number): ILayoutItem;
        /**
         * Add a widget as the last item in the layout.
         *
         * If the widget already exists in the layout, it will be moved.
         *
         * Returns the index of the added widget.
         */
        addWidget(widget: Widget, stretch?: number, alignment?: Alignment): number;
        /**
         * Insert a widget into the layout at the given index.
         *
         * If the widget already exists in the layout, it will be moved.
         *
         * Returns the index of the added widget.
         */
        insertWidget(index: number, widget: Widget, stretch?: number, alignment?: Alignment): number;
        /**
         * Get the stretch factor for the given widget or index.
         *
         * Returns -1 if the given widget or index is invalid.
         */
        stretch(which: Widget | number): number;
        /**
         * Set the stretch factor for the given widget or index.
         *
         * Returns true if the stretch was updated, false otherwise.
         */
        setStretch(which: Widget | number, stretch: number): boolean;
        /**
         * Invalidate the cached layout data and enqueue an update.
         */
        invalidate(): void;
        /**
         * Compute the preferred size of the layout.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum size of the layout.
         */
        minSize(): Size;
        /**
         * Compute the maximum size of the layout.
         */
        maxSize(): Size;
        /**
         * Update the geometry of the child layout items.
         */
        protected layout(x: number, y: number, width: number, height: number): void;
        /**
         * Initialize the layout items and internal sizes for the layout.
         */
        private _setupGeometry();
        private _dirty;
        private _handleSize;
        private _fixedSpace;
        private _minSize;
        private _maxSize;
        private _sizeHint;
        private _items;
        private _sizers;
        private _orientation;
    }
    /**
     * A custom widget item used by a split layout.
     */
    class SplitItem extends WidgetItem {
        /**
         * Construct a new split item.
         */
        constructor(handle: SplitHandle, widget: Widget, alignment?: Alignment);
        /**
         * Get the split handle for the item.
         */
        handle: SplitHandle;
        private _handle;
    }
}

declare module phosphor.widgets {
    import ISignal = core.ISignal;
    import Pair = utility.Pair;
    import Size = utility.Size;
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
    class StackedLayout extends Layout {
        /**
         * A signal emitted when a widget is removed from the layout.
         */
        widgetRemoved: ISignal<Pair<number, Widget>>;
        /**
         * Construct a new stack layout.
         */
        constructor();
        /**
         * Dispose of the resources held by the layout.
         */
        dispose(): void;
        /**
         * Get the current index of the layout.
         */
        /**
         * Set the current index of the layout.
         */
        currentIndex: number;
        /**
         * Get the current widget in the layout.
         */
        /**
         * Set the current widget in the layout.
         */
        currentWidget: Widget;
        /**
         * Get the number of layout items in the layout.
         */
        count: number;
        /**
         * Get the layout item at the specified index.
         */
        itemAt(index: number): ILayoutItem;
        /**
         * Remove and return the layout item at the specified index.
         */
        removeAt(index: number): ILayoutItem;
        /**
         * Add a widget as the last item in the layout.
         *
         * If the widget already exists in the layout, it will be moved.
         *
         * Returns the index of the added widget.
         */
        addWidget(widget: Widget, alignment?: Alignment): number;
        /**
         * Insert a widget into the layout at the given index.
         *
         * If the widget already exists in the layout, it will be moved.
         *
         * Returns the index of the added widget.
         */
        insertWidget(index: number, widget: Widget, alignment?: Alignment): number;
        /**
         * Move a widget from one index to another.
         *
         * This method is more efficient for moving a widget than calling
         * `insertWidget` for an already added widget. It will not remove
         * the widget before moving it and will not emit `widgetRemoved`.
         *
         * Returns -1 if `fromIndex` is out of range.
         */
        moveWidget(fromIndex: number, toIndex: number): number;
        /**
         * Invalidate the cached layout data and enqueue an update.
         */
        invalidate(): void;
        /**
         * Compute the preferred size of the layout.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum size of the layout.
         */
        minSize(): Size;
        /**
         * Compute the maximum size of the layout.
         */
        maxSize(): Size;
        /**
         * Update the geometry of the child layout items.
         */
        protected layout(x: number, y: number, width: number, height: number): void;
        /**
         * Initialize the layout items and internal sizes for the layout.
         */
        private _setupGeometry();
        private _dirty;
        private _sizeHint;
        private _minSize;
        private _maxSize;
        private _items;
        private _currentItem;
    }
}

declare module phosphor.widgets {
    import Queue = collections.Queue;
    import IMessage = core.IMessage;
    import IMessageHandler = core.IMessageHandler;
    import ISignal = core.ISignal;
    import NodeBase = core.NodeBase;
    import IBoxSizing = utility.IBoxSizing;
    import Size = utility.Size;
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
    class Widget extends NodeBase implements IMessageHandler {
        /**
         * A signal emitted when the widget is disposed.
         */
        disposed: ISignal<void>;
        /**
         * Construct a new widget.
         */
        constructor();
        /**
         * Dispose of the widget and its descendants.
         */
        dispose(): void;
        /**
         * Get the X position set for the widget.
         */
        /**
         * Set the X position for the widget.
         *
         * This is equivalent to `move(x, this.y)`.
         */
        x: number;
        /**
         * Get the Y position set for the widget.
         */
        /**
         * Set the Y position for the widget.
         *
         * This is equivalent to `move(this.x, y)`.
         */
        y: number;
        /**
         * Get the width set for the widget.
         */
        /**
         * Set the width for the widget.
         *
         * This is equivalent to `resize(width, this.height)`.
         */
        width: number;
        /**
         * Get the height set for the widget.
         */
        /**
         * Set the height for the widget.
         *
         * This is equivalent to `resize(this.width, height)`.
         */
        height: number;
        /**
         * Get the horizontal size policy for the widget.
         */
        /**
         * Set the horizontal size policy for the widget.
         *
         * This is equivalent to `setSizePolicy(policy, this.verticalSizePolicy)`.
         */
        horizontalSizePolicy: SizePolicy;
        /**
         * Get the vertical size policy for the widget.
         */
        /**
         * Set the vertical size policy for the widget.
         *
         * This is equivalent to `setSizePolicy(this.horizontalPolicy, policy)`.
         */
        verticalSizePolicy: SizePolicy;
        /**
         * Get the CSS box sizing for the widget.
         *
         * This method computes the data once, then caches it. The cached
         * data can be cleared by calling the `invalidateBoxSizing` method.
         */
        boxSizing: IBoxSizing;
        /**
         * Test whether the widget's node is attached to the DOM.
         */
        isAttached: boolean;
        /**
         * Test whether the widget has been disposed.
         */
        isDisposed: boolean;
        /**
         * Test whether the widget is explicitly hidden.
         */
        isHidden: boolean;
        /**
         * Test whether the widget is visible.
         *
         * A widget is visible under the following conditions:
         *   - it is attached to the DOM
         *   - it is not explicitly hidden
         *   - it has no explicitly hidden ancestors
         */
        isVisible: boolean;
        /**
         * Get the layout manager attached to the widget.
         *
         * Returns null if the widget has no layout manager.
         */
        /**
         * Set the layout manager for the widget.
         *
         * A layout is single-use only. The current layout can be set to null
         * or to a new layout instance, but not to a layout which is already
         * installed on another widget.
         *
         * The current layout will be disposed and cannot be reused.
         */
        layout: Layout;
        /**
         * Get the parent of the widget.
         *
         * Returns null if the widget has no parent.
         */
        /**
         * Set the parent of the widget.
         *
         * Setting the parent to null will detach the widget from the DOM
         * and automatically remove it from the relevant layout manager.
         */
        parent: Widget;
        /**
         * Get the number of children in the widget.
         */
        childCount: number;
        /**
         * Get the child widget at the given index.
         *
         * Returns `undefined` if the index is out of range.
         */
        childAt(index: number): Widget;
        /**
         * Test whether the given widget flag is set.
         */
        testFlag(flag: WidgetFlag): boolean;
        /**
         * Set the given widget flag.
         */
        setFlag(flag: WidgetFlag): void;
        /**
         * Clear the given widget flag.
         */
        clearFlag(flag: WidgetFlag): void;
        /**
         * Make the widget visible to its parent.
         *
         * If the widget is not explicitly hidden, this is a no-op.
         */
        show(): void;
        /**
         * Make the widget invisible to its parent.
         *
         * If the widget is already hidden, this is a no-op.
         */
        hide(): void;
        /**
         * Show or hide the widget according to the given flag.
         */
        setVisible(visible: boolean): void;
        /**
         * Close the widget by sending it a 'close' message.
         *
         * Subclasses should reimplement `onClose` to perform custom actions.
         */
        close(): void;
        /**
         * Attach the widget's node to a host DOM element.
         *
         * The `fit` method can be called to resize the widget to fill its
         * host node. It should be called whenever the size of host node is
         * known to have changed.
         *
         * Only a root widget can be attached to a host node.
         */
        attach(host: HTMLElement): void;
        /**
         * Detach the widget's node from the DOM.
         *
         * Only a root widget can be detached from its host node.
         */
        detach(): void;
        /**
         * Resize the widget so that it fills its host node.
         *
         * Only a root widget can be fit to its host.
         *
         * If the size of the host node is known, it can be provided. This
         * will prevent a DOM geometry read and avoid a potential reflow.
         */
        fit(width?: number, height?: number, box?: IBoxSizing): void;
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
        sizeHint(): Size;
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
        minSizeHint(): Size;
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
        maxSizeHint(): Size;
        /**
         * Invalidate the cached CSS box sizing for the widget.
         *
         * User code should invoke this method when it makes a change to the
         * node's style which changes its border, padding, or size limits.
         */
        invalidateBoxSizing(): void;
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
        updateGeometry(force?: boolean): void;
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
        update(immediate?: boolean): void;
        /**
         * Move the widget to the specified X-Y coordinate.
         */
        move(x: number, y: number): void;
        /**
         * Resize the widget to the specified width and height.
         */
        resize(width: number, height: number): void;
        /**
         * Set the position and size of the widget.
         *
         * The size is clipped to the limits specified by the node's style.
         *
         * This method will send 'move' and 'resize' messages to the widget if
         * the new geometry changes the position or size of the widget's node.
         */
        setGeometry(x: number, y: number, width: number, height: number): void;
        /**
         * Set the size policy for the widget.
         */
        setSizePolicy(horizontal: SizePolicy, vertical: SizePolicy): void;
        /**
         * Process a message sent to the widget.
         *
         * This implements the IMessageHandler interface.
         *
         * Subclasses may reimplement this method as needed.
         */
        processMessage(msg: IMessage): void;
        /**
         * Compress a message posted to the widget.
         *
         * This implements the IMessageHandler interface.
         *
         * Subclasses may reimplement this method as needed.
         */
        compressMessage(msg: IMessage, pending: Queue<IMessage>): boolean;
        /**
         * A method invoked when a 'close' message is received.
         *
         * The default implementation sets the parent to null.
         */
        protected onClose(msg: IMessage): void;
        /**
         * A method invoked when a 'child-added' message is received.
         *
         * The default implementation appends the child node to the DOM.
         */
        protected onChildAdded(msg: ChildMessage): void;
        /**
         * A method invoked when a 'child-removed' message is received.
         *
         * The default implementation removes the child node from the DOM.
         */
        protected onChildRemoved(msg: ChildMessage): void;
        /**
         * A method invoked when a 'move' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onMove(msg: MoveMessage): void;
        /**
         * A method invoked when a 'resize' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onResize(msg: ResizeMessage): void;
        /**
         * A method invoked on an 'update-request' message.
         *
         * The default implementation is a no-op.
         */
        protected onUpdateRequest(msg: IMessage): void;
        /**
         * A method invoked when a 'before-show' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onBeforeShow(msg: IMessage): void;
        /**
         * A method invoked when an 'after-show' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onAfterShow(msg: IMessage): void;
        /**
         * A method invoked when a 'before-hide' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onBeforeHide(msg: IMessage): void;
        /**
         * A method invoked when an 'after-hide' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onAfterHide(msg: IMessage): void;
        /**
         * A method invoked when a 'before-attach' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onBeforeAttach(msg: IMessage): void;
        /**
         * A method invoked when an 'after-attach' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onAfterAttach(msg: IMessage): void;
        /**
         * A method invoked when a 'before-detach' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onBeforeDetach(msg: IMessage): void;
        /**
         * A method invoked when an 'after-detach' message is received.
         *
         * The default implementation is a no-op.
         */
        protected onAfterDetach(msg: IMessage): void;
        private _x;
        private _y;
        private _width;
        private _height;
        private _wflags;
        private _layout;
        private _parent;
        private _children;
        private _boxSizing;
        private _sizePolicy;
    }
}

declare module phosphor.widgets {
    /**
     * A widget which delegates to a permanently installed layout.
     *
     * This is used as a base class for common panel widgets.
     */
    class Panel extends Widget {
        /**
         * Construct a new panel.
         */
        constructor(layout: Layout);
        /**
         * Get the number of items (widgets + spacers) in the panel.
         */
        count: number;
        /**
         * Get the index of the given widget.
         *
         * Returns -1 if the widget is not found.
         */
        indexOf(widget: Widget): number;
        /**
         * Get the widget at the given index.
         *
         * Returns `undefined` if there is no widget at the given index.
         */
        widgetAt(index: number): Widget;
        /**
         * Get the alignment for the given widget.
         *
         * Returns 0 if the widget is not found in the panel.
         */
        alignment(widget: Widget): Alignment;
        /**
         * Set the alignment for the given widget.
         *
         * Returns true if the alignment was updated, false otherwise.
         */
        setAlignment(widget: Widget, alignment: Alignment): boolean;
    }
}

declare module phosphor.widgets {
    /**
     * A panel which arranges its children in a row or column.
     */
    class BoxPanel extends Panel {
        /**
         * Construct a new box panel.
         */
        constructor(direction?: Direction, spacing?: number);
        /**
         * Get the layout direction for the panel.
         */
        /**
         * Set the layout direction for the panel.
         */
        direction: Direction;
        /**
         * Get the inter-element fixed spacing for the panel.
         */
        /**
         * Set the inter-element fixed spacing for the panel.
         */
        spacing: number;
        /**
         * Add a child widget to the end of the panel.
         *
         * If the widget already exists in the panel, it will be moved.
         *
         * Returns the index of the added widget.
         */
        addWidget(widget: Widget, stretch?: number, alignment?: Alignment): number;
        /**
         * Insert a child widget into the panel at the given index.
         *
         * If the widget already exists in the panel, it will be moved.
         *
         * Returns the index of the added widget.
         */
        insertWidget(index: number, widget: Widget, stretch?: number, alignment?: Alignment): number;
        /**
         * Add a fixed amount of spacing to the end of the panel.
         *
         * Returns the index of the added space.
         */
        addSpacing(size: number): number;
        /**
         * Insert a fixed amount of spacing at the given index.
         *
         * Returns the index of the added space.
         */
        insertSpacing(index: number, size: number): number;
        /**
         * Add stretchable space to the end of the panel.
         *
         * Returns the index of the added space.
         */
        addStretch(stretch: number): number;
        /**
         * Insert stretchable space at the given index.
         *
         * Returns the index of the added space.
         */
        insertStretch(index: number, stretch: number): number;
        /**
         * Get the stretch factor for the given widget or index.
         *
         * Returns -1 if the given widget or index is invalid.
         */
        stretch(which: Widget | number): number;
        /**
         * Set the stretch factor for the given widget or index.
         *
         * Returns true if the stretch was updated, false otherwise.
         */
        setStretch(which: Widget | number, stretch: number): boolean;
    }
}

declare module phosphor.widgets {
    import IMessage = core.IMessage;
    /**
     * A panel which arranges its children into resizable sections.
     */
    class SplitPanel extends Panel {
        /**
         * Construct a new split panel.
         */
        constructor(orientation?: Orientation);
        /**
         * Dispose of the resources held by the panel.
         */
        dispose(): void;
        /**
         * Get the orientation of the split panel.
         */
        /**
         * Set the orientation of the split panel.
         */
        orientation: Orientation;
        /**
         * Get the size of the split handles.
         */
        /**
         * Set the the size of the split handles.
         */
        handleSize: number;
        /**
         * Get the normalized sizes of the widgets in the split panel.
         */
        sizes(): number[];
        /**
         * Set the relative sizes for the split panel widgets.
         *
         * Extra values are ignored, too few will yield an undefined layout.
         */
        setSizes(sizes: number[]): void;
        /**
         * Add a child widget to the end of the split panel.
         *
         * If the widget already exists in the panel, it will be moved.
         *
         * Returns the index of the added widget.
         */
        addWidget(widget: Widget, stretch?: number, alignment?: Alignment): number;
        /**
         * Insert a child widget into the split panel at the given index.
         *
         * If the widget already exists in the panel, it will be moved.
         *
         * Returns the index of the added widget.
         */
        insertWidget(index: number, widget: Widget, stretch?: number, alignment?: Alignment): number;
        /**
         * Get the stretch factor for the given widget or index.
         *
         * Returns -1 if the given widget or index is invalid.
         */
        stretch(which: Widget | number): number;
        /**
         * Set the stretch factor for the given widget or index.
         *
         * Returns true if the stretch was updated, false otherwise.
         */
        setStretch(which: Widget | number, stretch: number): boolean;
        /**
         * Handle the DOM events for the split panel.
         */
        handleEvent(event: Event): void;
        /**
         * A method invoked after the node is attached to the DOM.
         */
        protected onAfterAttach(msg: IMessage): void;
        /**
         * A method invoked after the node is detached from the DOM.
         */
        protected onAfterDetach(msg: IMessage): void;
        /**
         * Handle the 'mousedown' event for the split panel.
         */
        private _evtMouseDown(event);
        /**
         * Handle the 'mouseup' event for the split panel.
         */
        private _evtMouseUp(event);
        /**
         * Handle the 'mousemove' event for the split panel.
         */
        private _evtMouseMove(event);
        /**
         * Find the index of the handle which contains a target element.
         */
        private _findHandle(target);
        /**
         * Release the mouse grab for the split panel.
         */
        private _releaseMouse();
        private _pressData;
    }
}

declare module phosphor.widgets {
    import ISignal = core.ISignal;
    import Pair = utility.Pair;
    /**
     * A panel where only one child widget is visible at a time.
     */
    class StackedPanel extends Panel {
        /**
         * A signal emitted when a widget is removed from the panel.
         */
        widgetRemoved: ISignal<Pair<number, Widget>>;
        /**
         * Construct a new stacked panel.
         */
        constructor();
        /**
         * Get the current index of the panel.
         */
        /**
         * Set the current index of the panel.
         */
        currentIndex: number;
        /**
         * Get the current widget of the panel.
         */
        /**
         * Set the current widget of the panel.
         */
        currentWidget: Widget;
        /**
         * Add a child widget to the end of the panel.
         *
         * If the widget already exists in the panel, it will be moved.
         *
         * Returns the index of the added widget.
         */
        addWidget(widget: Widget, alignment?: Alignment): number;
        /**
         * Insert a child widget into the panel at the given index.
         *
         * If the widget already exists in the panel, it will be moved.
         *
         * Returns the index of the added widget.
         */
        insertWidget(index: number, widget: Widget, alignment?: Alignment): number;
        /**
         * Move a child widget from one index to another.
         *
         * This method is more efficient for moving a widget than calling
         * `insertWidget` for an already added widget. It will not remove
         * the widget before moving it and will not emit `widgetRemoved`.
         *
         * Returns -1 if `fromIndex` is out of range.
         */
        moveWidget(fromIndex: number, toIndex: number): number;
        /**
         * Handle the `widgetRemoved` signal for the stacked layout.
         */
        private _p_widgetRemoved(args);
    }
}

declare module phosphor.widgets {
    /**
     * A widget which can be added to a DockArea.
     */
    interface IDockWidget extends Widget {
        /**
         * The tab associated with the widget.
         */
        tab: Tab;
    }
    /**
     * A widget which provides a flexible docking layout area for widgets.
     */
    class DockArea extends Widget {
        /**
         * Construct a new dock area.
         */
        constructor();
        /**
         * Dispose of the resources held by the widget.
         */
        dispose(): void;
        /**
         * Get the width of the tabs in the dock area.
         */
        /**
         * Get the width of the tabs in the dock area.
         */
        tabWidth: number;
        /**
         * Get the minimum tab width in pixels.
         */
        /**
         * Set the minimum tab width in pixels.
         */
        minTabWidth: number;
        /**
         * Get the tab overlap amount in pixels.
         */
        /**
         * Set the tab overlap amount in pixels.
         */
        tabOverlap: number;
        /**
         * Get the handle size of the dock splitters.
         */
        /**
         * Set the handle size of the dock splitters.
         */
        handleSize: number;
        /**
         * Add a widget to the dock area.
         *
         * The widget is positioned in the area according to the given dock
         * mode and reference widget. If the dock widget is already added to
         * the area, it will be moved to the new location.
         *
         * The default mode inserts the widget on the left side of the area.
         */
        addWidget(widget: IDockWidget, mode?: DockMode, ref?: IDockWidget): void;
        /**
         * Handle the DOM events for the dock area.
         */
        handleEvent(event: Event): void;
        /**
         * Handle the 'mousemove' event for the dock area.
         *
         * This is triggered on the document during a tab move operation.
         */
        private _evtMouseMove(event);
        /**
         * Handle the 'mouseup' event for the dock area.
         *
         * This is triggered on the document during a tab move operation.
         */
        private _evtMouseUp(event);
        /**
         * Add the widget to a new root dock panel along the given orientation.
         *
         * If the widget already exists in the area, it will be removed.
         */
        private _addWidget(widget, orientation, after);
        /**
         * Add the dock widget as a new split panel next to the reference.
         *
         * If the reference does not exist in the area, this is a no-op.
         *
         * If the dock widget already exists in the area, it will be moved.
         */
        private _splitWidget(widget, ref, orientation, after);
        /**
         * Split the panel with the given widget along the given orientation.
         *
         * If the widget already exists in the area, it will be moved.
         */
        private _splitPanel(panel, widget, orientation, after);
        /**
         * Add the dock widget as a tab next to the reference.
         *
         * If the reference does not exist in the area, this is a no-op.
         *
         * If the dock widget already exists in the area, it will be moved.
         */
        private _tabifyWidget(widget, ref, after);
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
        private _ensureRoot(orientation);
        /**
         * Create a new panel and setup the signal handlers.
         */
        private _createPanel();
        /**
         * Create a new dock splitter for the dock area.
         */
        private _createSplitter(orientation);
        /**
         * Remove an empty dock panel from the hierarchy.
         *
         * This ensures that the hierarchy is kept consistent by merging an
         * ancestor splitter when it contains only a single child widget.
         */
        private _removePanel(panel);
        /**
         * Abort the tab drag operation if one is in progress.
         */
        private _abortDrag();
        /**
         * Handle the `currentChanged` signal from a tab bar.
         */
        private _p_currentChanged(args);
        /**
         * Handle the `tabCloseRequested` signal from a tab bar.
         */
        private _p_tabCloseRequested(args);
        /**
         * Handle the `tabDetachRequested` signal from the tab bar.
         */
        private _p_tabDetachRequested(args);
        /**
         * Handle the `widgetRemoved` signal from a stack widget.
         */
        private _p_widgetRemoved(args);
        private _handleSize;
        private _tabWidth;
        private _tabOverlap;
        private _minTabWidth;
        private _ignoreRemoved;
        private _root;
        private _dragData;
        private _items;
    }
}

declare module phosphor.widgets {
    import ISignal = core.ISignal;
    /**
     * An options object for initializing a menu item.
     */
    interface IMenuItemOptions {
        /**
         * The type of the menu item.
         */
        type?: string;
        /**
         * The text for the menu item.
         */
        text?: string;
        /**
         * The mnemonic for the menu item.
         */
        mnemonic?: string;
        /**
         * The shortcut combo for the menu item.
         */
        shortcut?: string;
        /**
         * Whether the menu item is enabled.
         */
        enabled?: boolean;
        /**
         * Whether the menu item is visible.
         */
        visible?: boolean;
        /**
         * Whether a 'check' type menu item is checked.
         */
        checked?: boolean;
        /**
         * The submenu for the menu item.
         */
        submenu?: Menu;
        /**
         * The extra class name to associate with the menu item.
         */
        className?: string;
    }
    /**
     * An item which can be added to a menu or menu bar.
     */
    class MenuItem {
        /**
         * A signal emitted when the state of the menu item is changed.
         */
        changed: ISignal<void>;
        /**
         * A signal emitted when a `check` type menu item is toggled.
         */
        toggled: ISignal<boolean>;
        /**
         * A signal emitted when the menu item is triggered.
         */
        triggered: ISignal<boolean>;
        /**
         * Construct a new menu item.
         */
        constructor(options?: IMenuItemOptions);
        /**
         * Get the type of the menu item: 'normal' | 'check' | 'separator'.
         */
        /**
         * Set the type of the menu item: 'normal' | 'check' | 'separator'.
         */
        type: string;
        /**
         * Get the text for the menu item.
         */
        /**
         * Set the text for the menu item.
         */
        text: string;
        /**
         * Get the mnemonic key for the menu item.
         */
        /**
         * Set the mnemonic key for the menu item.
         */
        mnemonic: string;
        /**
         * Get the shortcut key for the menu item (decoration only).
         */
        /**
         * Set the shortcut key for the menu item (decoration only).
         */
        shortcut: string;
        /**
         * Get whether the menu item is enabled.
         */
        /**
         * Set whether the menu item is enabled.
         */
        enabled: boolean;
        /**
         * Get whether the menu item is visible.
         */
        /**
         * Set whether the menu item is visible.
         */
        visible: boolean;
        /**
         * Get whether the 'check' type menu item is checked.
         */
        /**
         * Set whether the 'check' type menu item is checked.
         */
        checked: boolean;
        /**
         * Get the submenu for the menu item.
         */
        /**
         * Set the submenu for the menu item.
         */
        submenu: Menu;
        /**
         * Get the class name for the menu item.
         */
        /**
         * Set the class name for the menu item.
         */
        className: string;
        /**
         * Trigger the menu item.
         *
         * This will emit the `triggered` signal.
         *
         * If the item is a `check` type, it will also be toggled.
         */
        trigger(): void;
        /**
         * Initialize the menu item from the given options object.
         */
        private _initFrom(options);
        private _text;
        private _mnemonic;
        private _shortcut;
        private _className;
        private _enabled;
        private _visible;
        private _type;
        private _checked;
        private _submenu;
    }
}

declare module phosphor.widgets {
    import ISignal = core.ISignal;
    import NodeBase = core.NodeBase;
    /**
     * An object which displays menu items as a popup menu.
     */
    class Menu extends NodeBase {
        /**
         * Create the DOM node for a menu.
         */
        static createNode(): HTMLElement;
        /**
         * Find the root menu of a menu hierarchy.
         */
        static rootMenu(menu: Menu): Menu;
        /**
         * Find the leaf menu of a menu hierarchy.
         */
        static leafMenu(menu: Menu): Menu;
        /**
         * A signal emitted when the menu is closed.
         */
        closed: ISignal<void>;
        /**
         * Construct a new menu.
         */
        constructor(items?: MenuItem[]);
        /**
         * Dispose of the resources held by the menu.
         */
        dispose(): void;
        /**
         * Get the parent menu of the menu.
         *
         * This will be null if the menu is not an open submenu.
         */
        parentMenu: Menu;
        /**
         * Get the child menu of the menu.
         *
         * This will be null if the menu does not have an open submenu.
         */
        childMenu: Menu;
        /**
         * Get the index of the active (highlighted) menu item.
         */
        /**
         * Set the index of the active (highlighted) menu item.
         *
         * Only a non-separator item can be set as the active item.
         */
        activeIndex: number;
        /**
         * Get the active (highlighted) menu item.
         */
        /**
         * Set the active (highlighted) menu item.
         *
         * Only a non-separator item can be set as the active item.
         */
        activeItem: MenuItem;
        /**
         * Get the number of menu items in the menu.
         */
        count: number;
        /**
         * Get the menu item at the given index.
         */
        itemAt(index: number): MenuItem;
        /**
         * Get the index of the given menu item.
         */
        indexOf(item: MenuItem): number;
        /**
         * Add a menu item to the end of the menu.
         *
         * Returns the new index of the item.
         */
        addItem(item: MenuItem): number;
        /**
         * Insert a menu item into the menu at the given index.
         *
         * Returns the new index of the item.
         */
        insertItem(index: number, item: MenuItem): number;
        /**
         * Remove and return the menu item at the given index.
         */
        removeAt(index: number): MenuItem;
        /**
         * Remove the given menu item from the menu.
         *
         * Returns the index of the removed item.
         */
        removeItem(item: MenuItem): number;
        /**
         * Remove all menu items from the menu.
         */
        clearItems(): void;
        /**
         * Activate the next non-separator menu item.
         *
         * This is equivalent to pressing the down arrow key.
         */
        activateNextItem(): void;
        /**
         * Activate the previous non-separator menu item.
         *
         * This is equivalent to pressing the up arrow key.
         */
        activatePreviousItem(): void;
        /**
         * Activate the next menu item with the given mnemonic key.
         *
         * This is equivalent to pressing the mnemonic key.
         */
        activateMnemonicItem(key: string): void;
        /**
         * Open the submenu of the active menu item.
         *
         * This is equivalent to pressing the right arrow key.
         *
         * Returns true if the item was opened, false otherwise.
         */
        openActiveItem(): boolean;
        /**
         * Trigger (or open) the active menu item.
         *
         * This is equivalent to pressing the enter key.
         *
         * Returns true if the item was triggered, false otherwise.
         */
        triggerActiveItem(): boolean;
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
        popup(x: number, y: number, forceX?: boolean, forceY?: boolean): void;
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
        open(x: number, y: number, forceX?: boolean, forceY?: boolean): void;
        /**
         * Close the menu and remove its node from the DOM.
         */
        close(): void;
        /**
         * Handle the DOM events for the menu.
         */
        handleEvent(event: Event): void;
        /**
         * Create the DOM node for a MenuItem.
         *
         * This can be reimplemented to create custom menu item nodes.
         */
        protected createItemNode(item: MenuItem): HTMLElement;
        /**
         * Initialize the DOM node for the given menu item.
         *
         * This method should be reimplemented if a subclass reimplements the
         * `createItemNode` method. It should initialize the node using the
         * given menu item. It will be called any time the item changes.
         */
        protected initItemNode(item: MenuItem, node: HTMLElement): void;
        /**
         * A method invoked when a menu item is inserted into the menu.
         *
         * This method should be reimplemented if a subclass reimplements the
         * `createNode` method. It should insert the item node into the menu
         * at the specified location.
         */
        protected insertItemNode(index: number, node: HTMLElement): void;
        /**
         * A method invoked when a menu item is removed from the menu.
         *
         * This method should be reimplemented if a subclass reimplements the
         * `createNode` method. It should remove the item node from the menu.
         */
        protected removeItemNode(node: HTMLElement): void;
        /**
         * Handle the 'mouseenter' event for the menu.
         *
         * This event listener is attached to the child item nodes.
         */
        private _evtMouseEnter(event);
        /**
         * Handle the 'mouseleave' event for the menu.
         *
         * This event listener is only attached to the menu node.
         */
        private _evtMouseLeave(event);
        /**
         * Handle the 'mouseup' event for the menu.
         *
         * This event listener is attached to the menu node.
         */
        private _evtMouseUp(event);
        /**
         * Handle the 'contextmenu' event for the menu.
         *
         * This event listener is attached to the menu node and disables
         * the default browser context menu.
         */
        private _evtContextMenu(event);
        /**
         * Handle the 'mousedown' event for the menu.
         *
         * This event listener is attached to the document for a popup menu.
         */
        private _evtMouseDown(event);
        /**
         * Handle the key down event for the menu.
         *
         * This event listener is attached to the document for a popup menu.
         */
        private _evtKeyDown(event);
        /**
         * Handle the 'keypress' event for the menu.
         *
         * This event listener is attached to the document for a popup menu.
         */
        private _evtKeyPress(event);
        /**
         * Set the active item index for the menu.
         *
         * This updates the class name of the relevant item nodes.
         */
        private _setActiveIndex(index);
        /**
         * Synchronize the active item hierarchy starting with the parent.
         *
         * This ensures that the proper child items are activated for the
         * ancestor menu hierarchy and that any pending open or close
         * tasks are cleared.
         */
        private _syncAncestors();
        /**
         * Synchronize the active item with the item for the child menu.
         *
         * This ensures that the active item is the child menu item.
         */
        private _syncChildItem();
        /**
         * Open the menu item's submenu using the node for location.
         *
         * If the given item is already open, this is a no-op.
         *
         * Any pending open operation will be cancelled before opening
         * the menu or queueing the delayed task to open the menu.
         */
        private _openChildMenu(item, node, delayed);
        /**
         * Open the menu as a child menu.
         */
        private _openAsSubmenu(item);
        /**
         * Close the currently open child menu using a delayed task.
         *
         * If a task is pending or if there is no child menu, this is a no-op.
         */
        private _closeChildMenu();
        /**
         * Reset the state of the menu.
         *
         * This deactivates the current item and closes the child menu.
         */
        private _reset();
        /**
         * Remove the menu from its parent menu.
         */
        private _removeFromParent();
        /**
         * Cancel any pending child menu open task.
         */
        private _cancelPendingOpen();
        /**
         * Cancel any pending child menu close task.
         */
        private _cancelPendingClose();
        /**
         * Collapse neighboring visible separators.
         *
         * This force-hides select separator nodes such that there are never
         * multiple visible separator siblings. It also force-hides all
         * leading and trailing separator nodes.
         */
        private _collapseSeparators();
        /**
         * Handle the `changed` signal from a menu item.
         */
        private _p_changed();
        private _openTimer;
        private _closeTimer;
        private _activeIndex;
        private _parentMenu;
        private _childMenu;
        private _childItem;
        private _items;
        private _nodes;
    }
}

declare module phosphor.widgets {
    import IMessage = core.IMessage;
    import Size = utility.Size;
    /**
     * A leaf widget which displays menu items as a menu bar.
     */
    class MenuBar extends Widget {
        /**
         * Create the DOM node for a menu bar.
         */
        static createNode(): HTMLElement;
        /**
         * Construct a new menu bar.
         */
        constructor(items?: MenuItem[]);
        /**
         * Dispose of the resources held by the panel.
         */
        dispose(): void;
        /**
         * Get the child menu of the menu bar.
         *
         * This will be null if the menu bar does not have an open menu.
         */
        childMenu: Menu;
        /**
         * Get the index of the active (highlighted) menu item.
         */
        /**
         * Set the index of the active (highlighted) menu item.
         *
         * Only an enabled non-separator item can be set as the active item.
         */
        activeIndex: number;
        /**
         * Get the active (highlighted) menu item.
         */
        /**
         * Set the active (highlighted) menu item.
         *
         * Only an enabled non-separator item can be set as the active item.
         */
        activeItem: MenuItem;
        /**
         * Get the number of menu items in the menu bar.
         */
        count: number;
        /**
         * Get the menu item at the given index.
         */
        itemAt(index: number): MenuItem;
        /**
         * Get the index of the given menu item.
         */
        indexOf(item: MenuItem): number;
        /**
         * Add a menu item to the end of the menu bar.
         *
         * Returns the new index of the item.
         */
        addItem(item: MenuItem): number;
        /**
         * Insert a menu item into the menu bar at the given index.
         *
         * Returns the new index of the item.
         */
        insertItem(index: number, item: MenuItem): number;
        /**
         * Remove and return the menu item at the given index.
         */
        removeAt(index: number): MenuItem;
        /**
         * Remove the given menu item from the menu bar.
         *
         * Returns the index of the removed item.
         */
        removeItem(item: MenuItem): number;
        /**
         * Remove all menu items from the menu bar.
         */
        clearItems(): void;
        /**
         * Activate the next non-separator menu item.
         *
         * This is equivalent to pressing the right arrow key.
         */
        activateNextItem(): void;
        /**
         * Activate the previous non-separator menu item.
         *
         * This is equivalent to pressing the left arrow key.
         */
        activatePreviousItem(): void;
        /**
         * Activate the next menu item with the given mnemonic key.
         *
         * This is equivalent to pressing the mnemonic key.
         */
        activateMnemonicItem(key: string): void;
        /**
         * Open the submenu of the active menu item.
         *
         * This is equivalent to pressing the down arrow key.
         *
         * Returns true if the item was opened, false otherwise.
         */
        openActiveItem(): boolean;
        /**
         * Compute the size hint for the menu bar.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum size hint for the menu bar.
         */
        minSizeHint(): Size;
        /**
         * Handle the DOM events for the menu bar.
         */
        handleEvent(event: Event): void;
        /**
         * Create the DOM node for a MenuItem.
         *
         * This can be reimplemented to create custom menu item nodes.
         */
        protected createItemNode(item: MenuItem): HTMLElement;
        /**
         * Initialize the DOM node for the given menu item.
         *
         * This method should be reimplemented if a subclass reimplements the
         * `createItemNode` method. It should initialize the node using the
         * given menu item. It will be called any time the item changes.
         */
        protected initItemNode(item: MenuItem, node: HTMLElement): void;
        /**
         * A method invoked when a menu item is inserted into the menu.
         *
         * This method should be reimplemented if a subclass reimplements the
         * `createNode` method. It should insert the item node into the menu
         * at the specified location.
         */
        protected insertItemNode(index: number, node: HTMLElement): void;
        /**
         * A method invoked when a menu item is removed from the menu.
         *
         * This method should be reimplemented if a subclass reimplements the
         * `createNode` method. It should remove the item node from the menu.
         */
        protected removeItemNode(node: HTMLElement): void;
        /**
         * A method invoked on the 'after-attach' message.
         */
        protected onAfterAttach(msg: IMessage): void;
        /**
         * A method invoked on the 'after-detach' message.
         */
        protected onAfterDetach(msg: IMessage): void;
        /**
         * Handle the 'mousedown' event for the menu bar.
         */
        private _evtMouseDown(event);
        /**
         * Handle the 'mousemove' event for the menu bar.
         */
        private _evtMouseMove(event);
        /**
         * Handle the 'mouseleave' event for the menu bar.
         */
        private _evtMouseLeave(event);
        /**
         * Handle the 'keydown' event for the menu bar.
         */
        private _evtKeyDown(event);
        /**
         * Handle the 'keypress' event for the menu bar.
         */
        private _evtKeyPress(event);
        /**
         * Set the active item index for the menu bar.
         *
         * If the index points to an item, it is assumed to be selectable.
         *
         * This will take the appropriate action based on the menu bar state.
         */
        private _setActiveIndex(index);
        /**
         * Open the menu item's submenu using the node for location.
         */
        private _openChildMenu(menu, node);
        /**
         * Close the current child menu, if one exists.
         */
        private _closeChildMenu();
        /**
         * Set the state mode for the menu bar.
         *
         * This will update the menu bar event listeners accordingly.
         */
        private _setState(state);
        /**
         * Update the event listeners for the inactive state.
         */
        private _useInactiveListeners();
        /**
         * Update the event listeners for the active and open states.
         */
        private _useActiveListeners();
        /**
         * Collapse neighboring visible separators.
         *
         * This force-hides select separator nodes such that there are never
         * multiple visible separator siblings. It also force-hides all any
         * leading and trailing separator nodes.
         */
        private _collapseSeparators();
        /**
         * Handle the `closed` signal from the child menu.
         */
        private _p_closed();
        /**
         * Handle the `changed` signal from a menu item.
         */
        private _p_changed();
        private _activeIndex;
        private _childMenu;
        private _items;
        private _nodes;
        private _state;
    }
}

declare module phosphor.widgets {
    import IMessage = core.IMessage;
    import Elem = virtualdom.Elem;
    /**
     * A leaf widget which renders its content using the virtual DOM.
     *
     * This widget is used to embed virtual DOM content into a widget
     * hierarchy. A subclass should reimplement the `render` method to
     * generate the content for the widget. It should also reimplement
     * the `sizeHint` method to return a reasonable natural size.
     */
    class RenderWidget extends Widget {
        /**
         * Construct a new render widget.
         */
        constructor();
        /**
         * Dispose of the resources held by the widget.
         */
        dispose(): void;
        /**
         * Get the current refs mapping for the widget.
         */
        refs: any;
        /**
         * Process a message sent to the widget.
         */
        processMessage(msg: IMessage): void;
        /**
         * Create the virtual DOM content for the widget.
         *
         * The rendered content is used to populate the widget's node.
         *
         * The default implementation returns `null`.
         */
        protected render(): Elem | Elem[];
        /**
         * A method invoked on an 'update-request' message.
         *
         * This renders the virtual DOM content into the widget's node.
         */
        protected onUpdateRequest(msg: IMessage): void;
        /**
         * A method invoked on an 'after-attach' message.
         */
        protected onAfterAttach(msg: IMessage): void;
        /**
         * A method invoked on a 'before-render' message.
         *
         * The default implementation is a no-op.
         */
        protected onBeforeRender(msg: IMessage): void;
        /**
         * A method invoked on an 'after-render' message.
         *
         * The default implementation is a no-op.
         */
        protected onAfterRender(msg: IMessage): void;
        private _refs;
    }
}

declare module phosphor.widgets {
    import IMessage = core.IMessage;
    import ISignal = core.ISignal;
    import Size = utility.Size;
    /**
     * A widget which provides a horizontal or vertical scroll bar.
     */
    class ScrollBar extends Widget {
        /**
         * Create the DOM node for a scroll bar.
         */
        static createNode(): HTMLElement;
        /**
         * A signal emitted when the user moves the scroll bar slider.
         *
         * The signal parameter is the current `value` of the scroll bar.
         *
         * #### Notes
         * This signal is not emitted when `value` is changed from code.
         */
        sliderMoved: ISignal<number>;
        /**
         * Construct a new scroll bar.
         *
         * @param orientation - The orientation of the scroll bar.
         */
        constructor(orientation?: Orientation);
        /**
         * Get the orientation of the scroll bar.
         */
        /**
         * Set the orientation of the scroll bar.
         */
        orientation: Orientation;
        /**
         * Get the minimum value of the scroll bar.
         */
        /**
         * Set the minimum value of the scroll bar.
         */
        minimum: number;
        /**
         * Get the maximum value of the scroll bar.
         */
        /**
         * Set the maximum value of the scroll bar.
         */
        maximum: number;
        /**
         * Get the current value of the scroll bar.
         */
        /**
         * Set the current value of the scroll bar.
         */
        value: number;
        /**
         * Get the page size of the scroll bar.
         */
        /**
         * Set the page size of the scroll bar.
         *
         * The page size controls the size of the slider control in relation
         * to the current scroll bar range. It should be set to a value which
         * represents a single "page" of content. This is the amount that the
         * slider will move when the user clicks inside the scroll bar track.
         */
        pageSize: number;
        /**
         * Calculate the preferred size for the scroll bar.
         */
        sizeHint(): Size;
        /**
         * Handle the DOM events for the scroll bar.
         */
        handleEvent(event: Event): void;
        /**
         * A method invoked on an 'after-attach' message.
         */
        protected onAfterAttach(msg: IMessage): void;
        /**
         * A method invoked on an 'after-detach' message.
         */
        protected onAfterDetach(msg: IMessage): void;
        /**
         * A method invoked on a 'resize' message.
         */
        protected onResize(msg: ResizeMessage): void;
        /**
         * A method invoked on an 'update-request' message.
         */
        protected onUpdateRequest(msg: IMessage): void;
        /**
         * Handle the 'mousedown' event for the scroll bar.
         */
        private _evtMouseDown(event);
        /**
         * Handle the 'mousemove' event for the scroll bar.
         */
        private _evtMouseMove(event);
        /**
         * Handle the 'mouseup' event for the scroll bar.
         */
        private _evtMouseUp(event);
        /**
         * Scroll to the given value expressed in scroll coordinates.
         *
         * The given value will be clamped to the scroll bar range. If the
         * adjusted value is different from the current value, the scroll
         * bar will be updated and the `sliderMoved` signal will be emitted.
         */
        private _scrollTo(value);
        /**
         * Get the minimum size of the slider for the current orientation.
         *
         * This computes the value once and caches it, which ensures that
         * multiple calls to this method are quick. The cached value can
         * be cleared by setting the `_sliderMinSize` property to `-1`.
         */
        private _getSliderMinSize();
        private _value;
        private _minimum;
        private _maximum;
        private _pageSize;
        private _sliderMinSize;
        private _dragData;
        private _orientation;
    }
}

declare module phosphor.widgets {
    import NodeBase = core.NodeBase;
    /**
     * An object which manages a node for a tab bar.
     */
    class Tab extends NodeBase {
        /**
         * Create the DOM node for a tab.
         */
        static createNode(): HTMLElement;
        /**
         * Construct a new tab.
         */
        constructor(text?: string);
        /**
         * Get the text for the tab.
         */
        /**
         * Set the text for the tab.
         */
        text: string;
        /**
         * Get whether the tab is selected.
         */
        /**
         * Set whether the tab is selected.
         */
        selected: boolean;
        /**
         * Get whether the tab is closable.
         */
        /**
         * Set whether the tab is closable.
         */
        closable: boolean;
        /**
         * Get the DOM node for the tab close icon.
         */
        closeIconNode: HTMLElement;
    }
}

declare module phosphor.widgets {
    import IMessage = core.IMessage;
    import ISignal = core.ISignal;
    import Pair = utility.Pair;
    import Size = utility.Size;
    /**
     * The arguments object for the `tabDetachRequested` signal.
     */
    interface ITabDetachArgs {
        /**
         * The tab of interest.
         */
        tab: Tab;
        /**
         * The index of the tab.
         */
        index: number;
        /**
         * The current mouse client X position.
         */
        clientX: number;
        /**
         * The current mouse client Y position.
         */
        clientY: number;
    }
    /**
     * The options object for initializing a tab bar.
     */
    interface ITabBarOptions {
        /**
         * Wether the tabs are movable by the user.
         */
        tabsMovable?: boolean;
        /**
         * The preferred tab width.
         *
         * Tabs will be sized to this width if possible, but never larger.
         */
        tabWidth?: number;
        /**
         * The minimum tab width.
         *
         * Tabs will never be sized smaller than this amount.
         */
        minTabWidth?: number;
        /**
         * The tab overlap amount.
         *
         * A positive value will cause neighboring tabs to overlap.
         * A negative value will insert empty space between tabs.
         */
        tabOverlap?: number;
    }
    /**
     * A leaf widget which displays a row of tabs.
     */
    class TabBar extends Widget {
        /**
         * Create the DOM node for a tab bar.
         */
        static createNode(): HTMLElement;
        /**
         * A signal emitted when a tab is moved.
         */
        tabMoved: ISignal<Pair<number, number>>;
        /**
         * A signal emitted when the currently selected tab is changed.
         */
        currentChanged: ISignal<Pair<number, Tab>>;
        /**
         * A signal emitted when the user clicks a tab close icon.
         */
        tabCloseRequested: ISignal<Pair<number, Tab>>;
        /**
         * A signal emitted when a tab is dragged beyond the detach threshold.
         */
        tabDetachRequested: ISignal<ITabDetachArgs>;
        /**
         * Construct a new tab bar.
         */
        constructor(options?: ITabBarOptions);
        dispose(): void;
        /**
         * Get the currently selected tab index.
         */
        /**
         * Set the currently selected tab index.
         */
        currentIndex: number;
        /**
         * Get the currently selected tab.
         */
        /**
         * Set the currently selected tab.
         */
        currentTab: Tab;
        /**
         * Get the previously selected tab.
         */
        previousTab: Tab;
        /**
         * Get whether the tabs are movable by the user.
         */
        /**
         * Set whether the tabs are movable by the user.
         */
        tabsMovable: boolean;
        /**
         * Get the preferred tab width.
         *
         * Tabs will be sized to this width if possible, but never larger.
         */
        /**
         * Set the preferred tab width.
         *
         * Tabs will be sized to this width if possible, but never larger.
         */
        tabWidth: number;
        /**
         * Get the minimum tab width.
         *
         * Tabs will never be sized smaller than this amount.
         */
        /**
         * Set the minimum tab width.
         *
         * Tabs will never be sized smaller than this amount.
         */
        minTabWidth: number;
        /**
         * Get the tab overlap amount.
         *
         * A positive value will cause neighboring tabs to overlap.
         * A negative value will insert empty space between tabs.
         */
        /**
         * Set the tab overlap amount.
         *
         * A positive value will cause neighboring tabs to overlap.
         * A negative value will insert empty space between tabs.
         */
        tabOverlap: number;
        /**
         * Get the number of tabs in the tab bar.
         */
        count: number;
        /**
         * Get the tab at the given index.
         */
        tabAt(index: number): Tab;
        /**
         * Get the index of the given tab.
         */
        indexOf(tab: Tab): number;
        /**
         * Add a tab to the end of the tab bar.
         *
         * Returns the index of the tab.
         */
        addTab(tab: Tab): number;
        /**
         * Insert a tab into the tab bar at the given index.
         *
         * Returns the index of the tab.
         */
        insertTab(index: number, tab: Tab): number;
        /**
         * Move a tab from one index to another.
         *
         * Returns the new tab index.
         */
        moveTab(fromIndex: number, toIndex: number): number;
        /**
         * Remove and return the tab at the given index.
         *
         * Returns `undefined` if the index is out of range.
         */
        removeAt(index: number): Tab;
        /**
         * Remove a tab from the tab bar and return its index.
         *
         * Returns -1 if the tab is not in the tab bar.
         */
        removeTab(tab: Tab): number;
        /**
         * Remove all of the tabs from the tab bar.
         */
        clearTabs(): void;
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
        attachTab(tab: Tab, clientX: number): void;
        /**
         * Detach and return the tab at the given index.
         *
         * This method is intended for use by code which supports tear-off
         * tab interfaces. It will remove the tab at the specified index
         * without a transition.
         *
         * Returns `undefined` if the index is invalid.
         */
        detachAt(index: number): Tab;
        /**
         * Compute the size hint for the tab bar.
         */
        sizeHint(): Size;
        /**
         * Compute the minimum size hint for the tab bar.
         */
        minSizeHint(): Size;
        /**
         * Handle the DOM events for the tab bar.
         */
        handleEvent(event: Event): void;
        /**
         * Get the content node for the tab bar.
         */
        protected contentNode: HTMLElement;
        /**
         * A method invoked on an 'after-attach' message.
         */
        protected onAfterAttach(msg: IMessage): void;
        /**
         * A method invoked on an 'after-dettach' message.
         */
        protected onAfterDetach(msg: IMessage): void;
        /**
         * A method invoked on a 'resize' message.
         */
        protected onResize(msg: ResizeMessage): void;
        /**
         * A method invoked on an 'update-request' message.
         */
        protected onUpdateRequest(msg: IMessage): void;
        /**
         * Handle the 'click' event for the tab bar.
         */
        private _evtClick(event);
        /**
         * Handle the 'mousedown' event for the tab bar.
         */
        private _evtMouseDown(event);
        /**
         * Handle the 'mousemove' event for the tab bar.
         */
        private _evtMouseMove(event);
        /**
         * Handle the 'mouseup' event for the tab bar.
         */
        private _evtMouseUp(event);
        /**
         * Release the current mouse grab for the tab bar.
         */
        private _releaseMouse();
        /**
         * Insert a new tab into the tab bar at the given index.
         *
         * This method assumes that the tab has not already been added.
         */
        private _insertTab(index, tab, animate);
        /**
         * Move an item to a new index in the tab bar.
         *
         * Returns the new index of the tab, or -1.
         */
        private _moveTab(fromIndex, toIndex);
        /**
         * Remove and return the tab at the given index.
         *
         * Returns `undefined` if the index is invalid.
         */
        private _removeTab(index, animate);
        /**
         * Get the index of the tab which covers the given client position.
         *
         * Returns -1 if the client position does not intersect a tab.
         */
        private _hitTest(clientX, clientY);
        /**
         * Compute the layout width of a tab.
         *
         * This computes a tab size as close as possible to the preferred
         * tab size, taking into account the minimum tab width, the current
         * tab bar width, and the tab overlap setting.
         */
        private _tabLayoutWidth();
        /**
         * Update the Z-indices of the tabs for the current tab order.
         */
        private _updateTabZOrder();
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
        private _withTransition(onEnter?, onExit?);
        /**
         * Initialize the tab bar state from an options object.
         */
        private _initFrom(options);
        private _tabWidth;
        private _tabOverlap;
        private _minTabWidth;
        private _tabs;
        private _tabsMovable;
        private _currentTab;
        private _previousTab;
        private _dragData;
    }
}

declare module phosphor.widgets {
    import ISignal = core.ISignal;
    import Pair = utility.Pair;
    /**
     * A widget which can be added to a TabPanel.
     */
    interface ITabWidget extends Widget {
        /**
         * The tab associated with the widget.
         */
        tab: Tab;
    }
    /**
     * A panel which provides a tabbed container for child widgets.
     *
     * The TabPanel provides a convenient combination of a TabBar and a
     * StackedPanel which allows the user to toggle between widgets by
     * selecting the tab associated with a widget.
     */
    class TabPanel extends Widget {
        /**
         * A signal emitted when the current widget is changed.
         */
        currentChanged: ISignal<Pair<number, Widget>>;
        /**
         * Construct a new tab panel.
         */
        constructor();
        /**
         * Dispose of the resources held by the panel.
         */
        dispose(): void;
        /**
         * Get the index of the currently selected widget.
         */
        /**
         * Set the index of the currently selected widget.
         */
        currentIndex: number;
        /**
         * Get the currently selected widget.
         */
        /**
         * Set the currently selected widget.
         */
        currentWidget: Widget;
        /**
         * Get whether the tabs are movable by the user.
         */
        /**
         * Set whether the tabs are movable by the user.
         */
        tabsMovable: boolean;
        /**
         * Get the tab bar used by the panel.
         */
        tabBar: TabBar;
        /**
         * Get the number of widgets in the panel.
         */
        count: number;
        /**
         * Get the index of the given widget.
         */
        indexOf(widget: Widget): number;
        /**
         * Get the widget at the given index.
         *
         * Returns `undefined` if there is no widget at the given index.
         */
        widgetAt(index: number): Widget;
        /**
         * Add a tabbable widget to the end of the panel.
         *
         * If the widget already exists in the panel, it will be moved.
         *
         * Returns the index of the added widget.
         */
        addWidget(widget: ITabWidget, alignment?: Alignment): number;
        /**
         * Insert a tabbable widget into the panel at the given index.
         *
         * If the widget already exists in the panel, it will be moved.
         *
         * Returns the index of the added widget.
         */
        insertWidget(index: number, widget: ITabWidget, alignment?: Alignment): number;
        /**
         * Move a widget from one index to another.
         *
         * Returns the new index of the widget.
         */
        moveWidget(fromIndex: number, toIndex: number): number;
        /**
         * Handle the `tabMoved` signal from the tab bar.
         */
        private _p_tabMoved(args);
        /**
         * Handle the `currentChanged` signal from the tab bar.
         */
        private _p_currentChanged(args);
        /**
         * Handle the `tabCloseRequested` signal from the tab bar.
         */
        private _p_tabCloseRequested(args);
        /**
         * Handle the `widgetRemoved` signal from the stacked panel.
         */
        private _p_widgetRemoved(args);
        private _tabBar;
        private _stackedPanel;
    }
}

declare module phosphor.shell {
    import IContainer = di.IContainer;
    /**
     * An object which represents an application plugin.
     *
     * A plugin is typically a module with an `initialize` function.
     */
    interface IPlugin {
        /**
         * Initialize the plugin and register its content with the container.
         */
        initialize(container: IContainer): void;
    }
}

declare module phosphor.shell {
    import Token = di.Token;
    /**
     * An object which asynchronously resolves and initializes plugins.
     */
    interface IPluginList {
        /**
         * Add an array of plugins or plugin promises to the plugin list.
         *
         * When all plugins are resolved, the `initialize` method of each
         * plugin is called and the plugin is added to the list.
         *
         * Returns a promise which resolves when all plugins are added.
         */
        add(plugins: (IPlugin | Promise<IPlugin>)[]): Promise<void>;
        /**
         * Invoke a callback for each resolved plugin in the list.
         */
        forEach(callback: (plugin: IPlugin) => void): void;
    }
    /**
     * The interface token for IPluginList.
     */
    var IPluginList: Token<IPluginList>;
}

declare module phosphor.shell {
    import Token = di.Token;
    import Alignment = widgets.Alignment;
    import MenuItem = widgets.MenuItem;
    import Widget = widgets.Widget;
    /**
     * An options object for adding a widget to a shell view.
     */
    interface IWidgetOptions {
        /**
         * The layout rank for the widget.
         *
         * Widgets are arranged in ordered from lowest to highest rank
         * along the direction of layout. The default rank is `100`.
         */
        rank?: number;
        /**
         * The layout stretch factor for the widget.
         *
         * The default stretch factor is determined by the layout.
         */
        stretch?: number;
        /**
         * The layout alignment for the widget.
         *
         * The default stretch factor is determined by the layout.
         */
        alignment?: Alignment;
    }
    /**
     * A widget which provides the top-level application shell.
     *
     * A shell view serves as the main UI container for an application. It
     * provides named areas to which plugins can add their content and it
     * also controls access to shared UI resources such as the menu bar.
     */
    interface IShellView extends Widget {
        /**
         * Get the content areas names supported by the shell view.
         */
        areas(): string[];
        /**
         * Add a widget to the named content area.
         *
         * This method throws an exception if the named area is not supported.
         */
        addWidget(area: string, widget: Widget, options?: IWidgetOptions): void;
        /**
         * Add a menu item to the menu bar.
         *
         * Items are ordered from lowest to highest rank.
         *
         * If the item already exists, its position will be updated.
         */
        addMenuItem(item: MenuItem, rank?: number): void;
        /**
         * Remove a menu item from the menu bar.
         *
         * If the item does not exist, this is a no-op.
         */
        removeMenuItem(item: MenuItem): void;
    }
    /**
     * The interface token for IShellView.
     */
    var IShellView: Token<IShellView>;
}

declare module phosphor.shell {
    import Widget = widgets.Widget;
    /**
     * Enable auto-hiding for the given widget.
     *
     * When auto-hiding is enabled, the widget will be automatically hidden
     * when it has no visible children, and shown when it has at least one
     * visible child.
     */
    function enableAutoHide(widget: Widget): void;
    /**
     * Disable auto-hiding for the given widget.
     *
     * This removes the effect of calling `enableAutoHide`. The current
     * visible state of the widget will not be changed by this method.
     */
    function disableAutoHide(widget: Widget): void;
}

declare module phosphor.shell {
    import IContainer = di.IContainer;
    /**
     * A class which manages bootstrapping an application.
     *
     * An application will typically define its own Bootstrapper subclass
     * which overrides the necessary methods to customize the application.
     */
    class Bootstrapper {
        /**
         * Construct a new bootstrapper.
         */
        constructor();
        /**
         * Get the dependency injection container for the application.
         *
         * This is created by the `createContainer` method.
         */
        container: IContainer;
        /**
         * Get the plugin list for the application.
         *
         * This is created by the `createPluginList` method.
         */
        pluginList: IPluginList;
        /**
         * Get the top-level shell view for the application.
         *
         * This is created by the `createShell` method.
         */
        shell: IShellView;
        /**
         * Run the bootstrapper.
         *
         * This invokes the various bootstrap methods in the proper order
         * and updates the internal state of the bootstrapper.
         *
         * This method should not be reimplemented.
         */
        run(): void;
        /**
         * Create the dependency injection container for the application.
         *
         * This can be reimplemented by subclasses as needed.
         *
         * The default implementation creates an instance of `Container`.
         */
        protected createContainer(): IContainer;
        /**
         * Create the application plugin list.
         *
         * This can be reimplmented by subclasses as needed.
         *
         * The default implementation resolves an `IPluginList`.
         */
        protected createPluginList(): IPluginList;
        /**
         * Create the application shell widget.
         *
         * This can be reimplemented by subclasses as needed.
         *
         * The default implementation resolves an `IShellView`.
         */
        protected createShell(): IShellView;
        /**
         * Configure the application dependency injection container.
         *
         * This can be reimplemented by subclasses as needed.
         */
        protected configureContainer(): void;
        /**
         * Configure the application plugins.
         *
         * Subclasses should reimplement this method to add the application
         * plugins to the plugin list. This should return a promise which
         * resolves once all plugins are initialized.
         *
         * The default implementation returns an empty resolved promise.
         */
        protected configurePlugins(): Promise<void>;
        /**
         * Configure the application shell widget.
         *
         * This can be reimplemented by subclasses as needed.
         */
        protected configureShell(): void;
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
        protected finalize(): void;
        private _shell;
        private _container;
        private _pluginList;
    }
}

declare module phosphor.shell {
    import Menu = widgets.Menu;
    import MenuBar = widgets.MenuBar;
    import MenuItem = widgets.MenuItem;
    /**
     * An object which manages items in a menu or menu bar.
     */
    class MenuManager {
        /**
         * Construct a new menu manager.
         *
         * The provided menu should be empty.
         */
        constructor(menu: Menu | MenuBar);
        /**
         * Add a menu item to the menu.
         *
         * Menu items are ordered from lowest to highest rank. The default
         * rank is `100`. If the item has already been added to the manager,
         * it will first be removed.
         */
        addItem(item: MenuItem, rank?: number): void;
        /**
         * Remove a menu item from the menu.
         *
         * If the item has not been added to the manager, this is a no-op.
         */
        removeItem(item: MenuItem): void;
        private _menu;
        private _ranks;
    }
}

declare module phosphor.shell {
    import IContainer = di.IContainer;
    /**
     * A concrete implementation of IPluginList.
     */
    class PluginList implements IPluginList {
        /**
         * The injection dependencies for the plugin list.
         */
        static $inject: di.Token<IContainer>[];
        /**
         * Construct a new plugin list.
         */
        constructor(container: IContainer);
        /**
         * Add an array of plugins or plugin promises to the plugin list.
         *
         * When all plugins are resolved, the `initialize` method of each
         * plugin is called and the plugin is added to the list.
         *
         * Returns a promise which resolves when all plugins are added.
         */
        add(plugins: (IPlugin | Promise<IPlugin>)[]): Promise<void>;
        /**
         * Invoke the given callback for each resolved plugin in the list.
         */
        forEach(callback: (plugin: IPlugin) => void): void;
        /**
         * Initialize a plugin and add it to the plugins list.
         */
        private _addPlugin(plugin);
        private _container;
        private _plugins;
    }
}

declare module phosphor.shell {
    import ChildMessage = widgets.ChildMessage;
    import Direction = widgets.Direction;
    import Widget = widgets.Widget;
    /**
     * A content panel for a shell view.
     */
    class ShellPanel extends Widget {
        /**
         * Construct a new shell view.
         */
        constructor(direction: Direction);
        /**
         * Dispose of the resources held by the widget.
         */
        dispose(): void;
        /**
         * Add a widget to the panel.
         */
        addWidget(widget: Widget, options?: IWidgetOptions): void;
        /**
         * A method invoked when a 'child-removed' message is received.
         */
        protected onChildRemoved(msg: ChildMessage): void;
        private _pairs;
    }
}

declare module phosphor.shell {
    import MenuItem = widgets.MenuItem;
    import Widget = widgets.Widget;
    /**
     * A concrete implementation of IShellView.
     */
    class ShellView extends Widget implements IShellView {
        /**
         * Construct a new shell view.
         */
        constructor();
        /**
         * Get the content areas names supported by the shell view.
         */
        areas(): string[];
        /**
         * Add a widget to the named content area.
         *
         * This method throws an exception if the named area is not supported.
         */
        addWidget(area: string, widget: Widget, options?: IWidgetOptions): void;
        /**
         * Add a menu item to the menu bar.
         *
         * Items are ordered from lowest to highest rank.
         *
         * If the item already exists, its position will be updated.
         */
        addMenuItem(item: MenuItem, rank?: number): void;
        /**
         * Remove a menu item from the menu bar.
         *
         * If the item does not exist, this is a no-op.
         */
        removeMenuItem(item: MenuItem): void;
        private _menuBar;
        private _topPanel;
        private _leftPanel;
        private _rightPanel;
        private _bottomPanel;
        private _centerPanel;
        private _menuManager;
    }
}
