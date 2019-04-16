require('@babel/polyfill');

const command = require('./core').default;

hexo.extend.migrator.register('web', ({ _ }) =>
    command(..._).then(() => process.exit())
);
