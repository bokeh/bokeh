declare module tsu {
    /**
    * An interface for defining an iterator.
    */
    interface IIterator<T> {
        /**
        * Returns the next item from the iterator or undefined.
        */
        __next__(): T;
        /**
        * Returns this same iterator.
        */
        __iter__(): IIterator<T>;
    }
    /**
    * An interface defining an iterable object.
    */
    interface IIterable<T> {
        /**
        * Returns an iterator over the object contents.
        */
        __iter__(): IIterator<T>;
    }
    /**
    * An interface which defines a reversible object.
    */
    interface IReversible<T> {
        /**
        * Returns a iterator over the reversed object contents.
        */
        __reversed__(): IIterator<T>;
    }
    /**
    * An iterator for an array of items.
    */
    class ArrayIterator<T> implements IIterator<T> {
        constructor(array: T[], index?: number);
        /**
        * Returns the next item from the iterator or undefined.
        */
        public __next__(): T;
        /**
        * Returns this same iterator.
        */
        public __iter__(): ArrayIterator<T>;
        private _array;
        private _index;
    }
    /**
    * A reverse iterator for an array of items.
    */
    class ReverseArrayIterator<T> implements IIterator<T> {
        /**
        * Construct a new ReverseArrayIterator.
        *
        * @param array The array of items to iterate.
        * @param [index] The index at which to start iteration.
        */
        constructor(array: T[], index?: number);
        /**
        * Returns the next item from the iterator or undefined.
        */
        public __next__(): T;
        /**
        * Returns this same iterator.
        */
        public __iter__(): ReverseArrayIterator<T>;
        private _array;
        private _index;
    }
    /**
    * Returns an iterator for the given object.
    *
    * @param object The array or iterable to iterate.
    * @returns An iterator over the given object.
    */
    function iter<T>(object: T[]): ArrayIterator<T>;
    function iter<T>(object: IIterable<T>): IIterator<T>;
    /**
    * Returns a reverse iterator for the given object.
    *
    * @param object The array or iterable to iterate.
    * @returns A reverse iterator over the given object.
    */
    function reversed<T>(object: T[]): ReverseArrayIterator<T>;
    function reversed<T>(object: IReversible<T>): IIterator<T>;
    /**
    * Returns the next value from an iterator, or undefined.
    */
    function next<T>(iterator: IIterator<T>): T;
    /**
    * Convert the given array or iterable into an array.
    *
    * @param object The array or iterable of interest.
    */
    function asArray<T>(object: T[]): T[];
    function asArray<T>(object: IIterable<T>): T[];
    /**
    * Execute a function for every item in an iterable.
    *
    * @param object The array or iterable of items.
    * @param callback The function to execute for each item.
    */
    function forEach<T>(object: T[], callback: (value: T) => any): void;
    function forEach<T>(object: IIterable<T>, callback: (value: T) => any): void;
    /**
    * Map a function over an iterable
    *
    * @param object The array or iterable of items.
    * @param callback The function to apply over each item.
    */
    function map<T, U>(object: T[], callback: (value: T) => U): U[];
    function map<T, U>(object: IIterable<T>, callback: (value: T) => U): U[];
    /**
    * Filter an iterable with a given function.
    *
    * @param object The array or iterable of items.
    * @param callback The filter function for the items.
    * @param context The 'this' arg for the function.
    */
    function filter<T>(object: T[], callback: (value: T) => any): T[];
    function filter<T>(object: IIterable<T>, callback: (value: T) => any): T[];
}
declare module tsu {
    /**
    * An interface which defines a binary comparison function.
    *
    * Returns:
    *   - zero if first = second
    *   - negative if first < second
    *   - positive if first > second.
    */
    interface ICompare<T, U> {
        (first: T, second: U): number;
    }
    /**
    * A class which defines a generic pair object.
    */
    class Pair<T, U> {
        public first: T;
        public second: U;
        /**
        * Construct a new Pair object.
        *
        * @param first The first item of the pair.
        * @param second The second item of the pair.
        */
        constructor(first: T, second: U);
        /**
        * Create a copy of the pair.
        */
        public copy(): Pair<T, U>;
    }
}
declare module tsu {
    /**
    * Perform a lower bound search on a sorted array.
    *
    * @param array The array of sorted items to search.
    * @param value The value to located in the array.
    * @param compare The value comparison function.
    * @returns The index of the first element in the array which
    *          compares greater than or equal to the given value.
    */
    function lowerBound<T, U>(array: T[], value: U, compare: ICompare<T, U>): number;
    /**
    * Perform a binary search on a sorted array.
    *
    * @param array The array of sorted items to search.
    * @param value The value to located in the array.
    * @param compare The value comparison function.
    * @returns The index of the found item, or -1.
    */
    function binarySearch<T, U>(array: T[], value: U, compare: ICompare<T, U>): number;
    /**
    * Perform a binary find on a sorted array.
    *
    * @param array The array of sorted items to search.
    * @param value The value to located in the array.
    * @param compare The value comparison function.
    * @returns The found item in the array, or undefined.
    */
    function binaryFind<T, U>(array: T[], value: U, compare: ICompare<T, U>): T;
    /**
    * Create a sorted set of items from an array or iterable.
    *
    * @param items The items to add to a set.
    * @param compare The comparison function for the items.
    * @returns The sorted unique array of items.
    */
    function asSet<T>(items: T[], compare: ICompare<T, T>): T[];
    function asSet<T>(items: IIterable<T>, compare: ICompare<T, T>): T[];
    /**
    * Test whether a two sorted arrays sets are disjoint.
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns true if the sets are disjoint, false otherwise.
    */
    function setIsDisjoint<T>(first: T[], second: T[], compare: ICompare<T, T>): boolean;
    /**
    * Test whether one sorted array set is the subset of another.
    *
    * @param first The potential subset.
    * @param second The potential superset.
    * @param compare The value comparison function.
    * @returns true if the first set is a subset of the second.
    */
    function setIsSubset<T>(first: T[], second: T[], compare: ICompare<T, T>): boolean;
    /**
    * Create the set union of two sorted set arrays.
    var j = 0;
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns The set union of the two arrays.
    */
    function setUnion<T>(first: T[], second: T[], compare: ICompare<T, T>): T[];
    /**
    * Create a set intersection of two sorted set arrays.
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns The set intersection of the two arrays.
    */
    function setIntersection<T>(first: T[], second: T[], compare: ICompare<T, T>): T[];
    /**
    * Create a set difference of two sorted set arrays.
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns The set difference of the two arrays.
    */
    function setDifference<T>(first: T[], second: T[], compare: ICompare<T, T>): T[];
    /**
    * Create a set symmetric difference of two sorted set arrays.
    *
    * @param first The first sorted array set.
    * @param second The second sorted array set.
    * @param compare The value comparison function.
    * @returns The set symmetric difference of the two arrays.
    */
    function setSymmetricDifference<T>(first: T[], second: T[], compare: ICompare<T, T>): T[];
}
declare module tsu {
    /**
    * A base class for implementing array-based data structures.
    *
    * @class
    */
    class ArrayBase<T> implements IIterable<T>, IReversible<T> {
        /**
        * Returns the number of items in the array.
        */
        public size(): number;
        /**
        * Returns true if the array is empty.
        */
        public empty(): boolean;
        /**
        * Returns the item at the given array index.
        *
        * @param index The integer index of the desired item.
        */
        public itemAt(index: number): T;
        /**
        * Removes and returns the item at the given index.
        *
        * @param index The integer index of the desired item.
        */
        public takeAt(index: number): T;
        /**
        * Clear the internal contents of array.
        */
        public clear(): void;
        /**
        * Swap this array's contents with another array.
        *
        * @param other The array base to use for the swap.
        */
        public swap(other: ArrayBase<T>): void;
        /**
        * Returns an iterator over the array of items.
        */
        public __iter__(): ArrayIterator<T>;
        /**
        * Returns a reverse iterator over the array of items.
        */
        public __reversed__(): ReverseArrayIterator<T>;
        public _array: T[];
    }
}
declare module tsu {
    /**
    * A mapping container build on a sorted array.
    *
    * @class
    */
    class AssociativeArray<T, U> extends ArrayBase<Pair<T, U>> {
        /**
        * Construct a new AssociativeArray.
        *
        * @param compare The key comparison function.
        */
        constructor(compare: ICompare<T, T>);
        /**
        * Returns the key comparison function used by this array.
        */
        public comparitor(): ICompare<T, T>;
        /**
        * Return the array index of the given key, or -1.
        *
        * @param key The key to locate in the array.
        */
        public indexOf(key: T): number;
        /**
        * Returns true if the key is in the array, false otherwise.
        *
        * @param key The key to locate in the array.
        */
        public contains(key: T): boolean;
        /**
        * Returns the pair associated with the given key, or undefined.
        *
        * @param key The key to locate in the array.
        */
        public find(key: T): Pair<T, U>;
        /**
        * Returns the pair associated with the key if it exists.
        *
        * If the key does not exist, a new pair will be created and
        * inserted using the value created by the given factory.
        *
        * @param key The key to locate in the array.
        * @param factory The function which creates the default value.
        */
        public setDefault(key: T, factory: () => U): Pair<T, U>;
        /**
        * Insert the pair into the array and return the pair.
        *
        * This will overwrite any existing entry in the array.
        *
        * @param key The key portion of the pair.
        * @param value The value portion of the pair.
        */
        public insert(key: T, value: U): Pair<T, U>;
        /**
        * Update the array from a collection of pairs.
        *
        * This will overwrite existing entries in the array.
        *
        * @param object The collection of pairs to add.
        */
        public update(object: AssociativeArray<T, U>): void;
        public update(object: IIterable<Pair<T, U>>): void;
        public update(object: Pair<T, U>[]): void;
        /**
        * Removes and returns the pair for the given key, or undefined.
        *
        * @param key The key to remove from the map.
        */
        public erase(key: T): Pair<T, U>;
        /**
        * Create a copy of this associative array.
        */
        public copy(): AssociativeArray<T, U>;
        private _wrapped;
        private _compare;
    }
}
declare module tsu {
    /**
    * A set container built on a sorted array.
    *
    * @class
    */
    class UniqueArray<T> extends ArrayBase<T> {
        /**
        * Construct a new UniqueArray.
        *
        * @param compare The item comparison function.
        */
        constructor(compare: ICompare<T, T>);
        /**
        * Returns the comparison function for this array.
        */
        public comparitor(): ICompare<T, T>;
        /**
        * Return the array index of the given item, or -1.
        *
        * @param item The item to locate in the array.
        */
        public indexOf(item: T): number;
        /**
        * Returns true if the item is in the array, false otherwise.
        *
        * @param item The item to locate in the array.
        */
        public contains(item: T): boolean;
        /**
        * Insert an item into the array.
        *
        * Returns true if the item is new to the set, false otherwise.
        *
        * @param item The item to insert into the array.
        */
        public insert(item: T): boolean;
        /**
        * Remove an item from the array.
        *
        * Returns true if the item was removed, false otherwise.
        *
        * @param item The item to remove from the array.
        */
        public erase(item: T): boolean;
        /**
        * Create a copy of this unique array.
        */
        public copy(): UniqueArray<T>;
        /**
        * Returns true if the arrays share no common items.
        *
        * @param object The other array or iterable of interest.
        */
        public isDisjoint(object: UniqueArray<T>): boolean;
        public isDisjoint(object: IIterable<T>): boolean;
        public isDisjoint(object: T[]): boolean;
        /**
        * Test whether this array is a subset of another.
        *
        * @param object The other array or iterable of interest.
        */
        public isSubset(object: UniqueArray<T>): boolean;
        public isSubset(object: IIterable<T>): boolean;
        public isSubset(object: T[]): boolean;
        /**
        * Test whether this array is a superset of another.
        *
        * @param object The other array or iterable of interest.
        */
        public isSuperset(object: UniqueArray<T>): boolean;
        public isSuperset(object: IIterable<T>): boolean;
        public isSuperset(object: T[]): boolean;
        /**
        * Returns a new array with the items from both arrays.
        *
        * @param object The other array or iterable of interest.
        */
        public union(object: UniqueArray<T>): UniqueArray<T>;
        public union(object: IIterable<T>): UniqueArray<T>;
        public union(object: T[]): UniqueArray<T>;
        /**
        * Returns a new array with items common to both arrays.
        *
        * @param object The other array or iterable of interest.
        */
        public intersection(object: UniqueArray<T>): UniqueArray<T>;
        public intersection(object: IIterable<T>): UniqueArray<T>;
        public intersection(object: T[]): UniqueArray<T>;
        /**
        * Returns a new array without the items from the other array.
        *
        * @param object The other array or iterable of interest.
        */
        public difference(object: UniqueArray<T>): UniqueArray<T>;
        public difference(object: IIterable<T>): UniqueArray<T>;
        public difference(object: T[]): UniqueArray<T>;
        /**
        * Returns new array with all but the common items.
        *
        * @param object The other array or iterable of interest.
        */
        public symmetricDifference(object: UniqueArray<T>): UniqueArray<T>;
        public symmetricDifference(object: IIterable<T>): UniqueArray<T>;
        public symmetricDifference(object: T[]): UniqueArray<T>;
        /**
        * Update this array to include the items from the other array.
        *
        * @param object The other array or iterable of interest.
        */
        public unionUpdate(object: UniqueArray<T>): void;
        public unionUpdate(object: IIterable<T>): void;
        public unionUpdate(object: T[]): void;
        /**
        * Update this array keeping only the items common to both arrays.
        *
        * @param object The other array or iterable of interest.
        */
        public intersectionUpdate(object: UniqueArray<T>): void;
        public intersectionUpdate(object: IIterable<T>): void;
        public intersectionUpdate(object: T[]): void;
        /**
        * Update this array by removing the items of the other array.
        *
        * @param object The other array or iterable of interest.
        */
        public differenceUpdate(object: UniqueArray<T>): void;
        public differenceUpdate(object: IIterable<T>): void;
        public differenceUpdate(object: T[]): void;
        /**
        * Update this array to include all but the common items.
        *
        * @param object The other array or iterable of interest.
        */
        public symmetricDifferenceUpdate(object: UniqueArray<T>): void;
        public symmetricDifferenceUpdate(object: IIterable<T>): void;
        public symmetricDifferenceUpdate(object: T[]): void;
        private _compare;
    }
}
declare module tsu {
}
