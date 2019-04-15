require('@babel/polyfill')

const { postOf } = require('./core'),
    { outputFile } = require('fs-extra')

hexo.extend.migrator.register('web', ({ _: [URI, selector] }) =>
    postOf(URI, selector)
        .then(({ name, markdown }) =>
            outputFile(`source/_post/${name}.md`, markdown)
        )
        .then(() => console.info(`[Migrated] ${URI}`))
)
