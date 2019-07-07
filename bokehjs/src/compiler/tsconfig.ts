const tsconfig = {
  "compilerOptions": {
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictNullChecks": true,
    "strictBindCallApply": false,
    "strictFunctionTypes": false,
    "strictPropertyInitialization": false,
    "alwaysStrict": true,
    "noErrorTruncation": true,
    "noEmitOnError": false,
    "declaration": true,
    "sourceMap": false,
    "importHelpers": false,
    "experimentalDecorators": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "target": "ES5",
    "lib": ["es2015", "dom"],
    "baseUrl": "."
  },
  "include": ["./**/*.ts"]
}

export default tsconfig
