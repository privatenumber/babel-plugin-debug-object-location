# Debug object location

> Babel plugin to help you determine where an object or array was instantiated

Have you ever been debugging, come across an object, and wished you could easily find out which file it was instantiated in?

Well, now you can! This plugin keeps track of all object and array literals in your code by mapping them to their source paths in a global registry. So when you're debugging, you can easily locate the source file of any object or array, helping you to understand the code better and resolve issues faster.

## Install
```
npm i -D babel-plugin-debug-object-location
```

## Setup
Add the plugin to your Babel config:
```json5
{
    // Only add to the development environment
    "env": {
        "development": {
            "plugins": ["debug-object-location"]
        }
    },
    // ...
}
```

> **Warning:** Since this is a debugging tool, you should only enable it during development or when you need it.

## Use-case
Let's say you have an object literal in your code that gets passed around in your application. The contents of the object are generated at run-time:
```ts
// my-file.ts

const myObject = {
    valueA: someVariable,
    valueB: Math.random()
}

// `someFunction` passes `myObject` around and gets referenced from many places
someFunction(myObject)

// can even be mutated
myObject.valueB = 123
```

While debugging, you encouter it in the stack-trace:

```ts
const object = {
    valueA: 365,
    valueB: 123
}
```

You want to learn more about it by looking at the file it was initialized in, but since the contents are generated at run-time, you can't search for it in your codebase.


Using this plugin, you can now look up the object in the  `objectRegistry` global to find out which file it was instantiated in:

```js
objectRegistry.find(object)
// => '/my-file.ts'
```


## API

### `objectRegistry.find(object)`

Type:
```ts
type UnknownObject = Record<PropertyKey, unknown>
type find = (query: UnknownObject | unknown[]) => (
    string
    | [object: UnknownObject, filePath: string][]
)
```

If there's an identity match (`===`), it returns the source file path where the object was instantiated.

If there is no identity match, it falls back to querying the registry for a shallow match and return an array of tuples: `[object, filePath]`.

For example, `.find({ a: 1 })` will match `{ a: 1, b: 2, c: 3 }`, so it's best to be as specific as possible.


### `objectRegistry.registry`

Type:
```ts
type UnknownObject = Record<PropertyKey, unknown>
type registry = Map<UnknownObject, string>
```

The actual registry where all the registered objects/arrays are stored. You can iterate over this yourself if the `find()` API is not sufficient.


## How does it work?

The plugin works by transforming the code when it encounters an object or array literal. It passes it into a function call that registers it.

For example, given the following code:
```ts
const myObject = {
    value: 123
}
```

The plugin transforms it to:
```ts
import { register } from 'babel-plugin-debug-object-location'

const myObject = register(
    {
        value: 123
    },
    '/my/file/path.ts'
)
```

Here, the `register` function is called with the object literal as its argument and the source path. The `register` function adds the object to the global registry and returns it without touching it.

Because all it does it reference the object, and doesn't try to access or mutate it's properties, it's completely safe to use.
