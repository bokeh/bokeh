# lang #

Language Utilities. Easier inheritance, scope handling, type checks.



## clone(val):*

Clone native types like Object, Array, RegExp, Date and primitives.

This method will not clone values that are referenced within `val`. It will
only copy the value reference to the new value. If the value is not a plain
object but is an object, it will return the value unchanged.

### Example

```js
var a = { foo: 'bar' };
var b = clone(a);
console.log(a === b); // false
console.log(a.foo === b.foo); // true

var c = [1, 2, 3];
var d = clone(b);
console.log(c === d); // false
console.log(c); // [1, 2, 3]
```

See: [`deepClone()`](#deepClone)



## createObject(parent, [props]):Object

Create Object using prototypal inheritance and setting custom properties.

Mix between [Douglas Crockford Prototypal Inheritance](http://javascript.crockford.com/prototypal.html) and the EcmaScript 5 `Object.create()` method.

### Arguments

 1. `parent` (Object)  : Parent Object
 2. `[props]` (Object) : Object properties

### Example

```js
var base = {
    trace : function(){
        console.log(this.name);
    }
};

var myObj = createObject(base, {
    name : 'Lorem Ipsum'
});

myObject.trace(); // "Lorem Ipsum"
```



## ctorApply(constructor, args):Object

Do `Function.prototype.apply()` on a constructor while maintaining prototype
chain.

```js
function Person(name, surname) {
    this.name = name;
    this.surname = surname;
}

Person.prototype.walk = function(){
    console.log(this.name +' is walking');
};

var args = ['John', 'Doe'];

// "similar" effect as calling `new Person("John", "Doe")`
var john = ctorApply(Person, args);
john.walk(); // "John is walking"
```



## deepClone(val, [instanceClone]):*

Deep clone native types like Object, Array, RegExp, Date and primitives.

The `instanceClone` function will be invoked to clone objects that are not
"plain" objects (as defined by [`isPlainObject`](#isPlainObject)) if it is
provided. If `instanceClone` is not specified, it will not attempt to clone
non-plain objects, and will copy the object reference.

### Example

```js
var a = {foo:'bar', obj: {a:1, b:2}};
var b = deepClone(a); // {foo:'bar', obj: {a:1, b:2}}
console.log( a === b ); // false
console.log( a.obj === b.obj ); // false

var c = [1, 2, [3, 4]];
var d = deepClone(c); // [1, 2, [3, 4]]
var e = c.concat(); // [1, 2, [3, 4]]

console.log( c[2] === d[2] ); // false
// concat doesn't do a deep clone, arrays are passed by reference
console.log( e[2] === d[2] ); // true

function Custom() { }
function cloneCustom(x) { return new Custom(); }
var f = { test: new Custom() };
var g = deepClone(f, cloneCustom);
g.test === f.test // false, since new Custom instance will be created
```

See: [`clone()`](#clone)



## defaults(val, ...defaults):void

Return first value that isn't `null` or `undefined`.

    function doSomethingAwesome(foo, bar) {
        // default arguments
        foo = defaults(foo, 'lorem');
        bar = defaults(bar, 123);
        // ...
    }



## inheritPrototype(child, parent):void

Inherit prototype from another Object.

```js
function Foo(name){
    this.name = name;
}
Foo.prototype = {
    getName : function(){
        return this.name;
    }
};

function Bar(name){
    this.name = name;
}
//should be called before calling constructor
inheritPrototype(Bar, Foo);

var myObj = new Bar('lorem ipsum');
myObj.getName(); // "lorem ipsum"
```


## is(x, y):Boolean

Check if both values are identical/egal.

```js
// wtfjs
NaN === NaN; // false
-0 === +0;   // true

is(NaN, NaN); // true
is(-0, +0);   // false
is('a', 'b'); // false
```

See: [`isnt()`](#isnt)



## isnt(x, y):Boolean

Check if both values are not identical/egal.

```js
// wtfjs
NaN === NaN; // false
-0 === +0;   // true

isnt(NaN, NaN); // false
isnt(-0, +0);   // true
isnt('a', 'b'); // true
```

See: [`is()`](#is)




## isArguments(val):Boolean

If value is an "Arguments" object.



## isArray(val):Boolean

If value is an Array. Uses native ES5 `Array.isArray()` if available.



## isBoolean(val):Boolean

If value is a Boolean.



## isDate(val):Boolean

If value is a Date.



## isEmpty(val):Boolean

Checks if Array/Object/String is empty.


```js
isEmpty('');         // true
isEmpty('bar');      // false
isEmpty([]);         // true
isEmpty([1, 2]);     // false
isEmpty({});         // true
isEmpty({a:1, b:2}); // false
```


## isFinite(val):Boolean

Checks if value is Finite.

Note: This is not the same as native `isFinite`, which will return `true` for
booleans and empty strings. See http://es5.github.com/#x15.1.2.5.



## isFunction(val):Boolean

If value is a Function.



## isKind(val, kind):Boolean

If value is of "kind". (used internally by some of the *isSomething* checks).

Favor the other methods since strings are commonly mistyped and also because
some "kinds" can only be accurately checked by using other methods (e.g.
`Arguments`), some of the other checks are also faster.

```js
isKind([1,2], 'Array'); // true
isKind(3, 'Array');     // false
isKind(3, 'Number');    // true
```

See: [`kindOf()`](#kindOf)



## isInteger(val):Boolean

Check if value is an integer.

```js
isInteger(123);    // true
isInteger(123.45); // false
isInteger({});     // false
isInteger('foo');  // false
isInteger('123');  // false
```



## isNaN(val):Boolean

Check if value is `NaN`.

Note: This is not the same as native `isNaN`, which will return `true` for
`undefined` and other values. See [ES5 isNaN](http://es5.github.com/#x15.1.2.4)



## isNull(val):Boolean

If value is `null`.



## isNumber(val):Boolean

If value is a Number.



## isObject(val):Boolean

If value is an Object.



## isPlainObject(val):Boolean

If the value is an Object created by the Object constructor.



## isRegExp(val):Boolean

If value is a RegExp.



## isString(val):Boolean

If value is a String.



## isUndefined(val):Boolean

If value is `undefined`.



## kindOf(val):String

Gets kind of value (e.g. "String", "Number", "RegExp", "Null", "Date").
Used internally by `isKind()` and most of the other *isSomething* checks.

```js
kindOf([1,2]); // "Array"
kindOf('foo'); // "String"
kindOf(3);     // "Number"
```

See: [`isKind()`](#isKind)


## toArray(val):Array

Convert array-like object into Array or wrap value into Array.

```js
toArray({
    "0" : "foo",
    "1" : "bar",
    "length" : 2
});                              // ["foo", "bar"]

function foo(){
    return toArray(arguments);
}
foo("lorem", 123);               // ["lorem", 123]

toArray("lorem ipsum");          // ["lorem ipsum"]
toArray(window);                 // [window]
toArray({foo:"bar", lorem:123}); // [{foo:"bar", lorem:123}]
```

See: object/values()



## toString(val):String

Convert any value to its string representation.

Will return an empty string for `undefined` or `null`, otherwise will convert
the value to its string representation.



-------------------------------------------------------------------------------

For more usage examples check specs inside `/tests` folder. Unit tests are the
best documentation you can get...
