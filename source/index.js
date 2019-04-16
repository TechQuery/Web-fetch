require('@babel/polyfill');

const { existsSync, readFileSync } = require('fs'),
    command = require('./core').default;

hexo.extend.migrator.register('web', ({ _: [URI, selector] }) => {
    const list = existsSync(URI)
        ? (readFileSync(URI) + '')
            .split(/[\r\n]+/)
            .filter(Boolean)
            .map(line => line.trim().split(/\s+/))
        : [[URI, selector]];

    return list
        .reduce(
            (promise, [URI, selector]) =>
                promise.then(() => command(URI, selector)),
            Promise.resolve()
        )
        .then(() => process.exit());
});
