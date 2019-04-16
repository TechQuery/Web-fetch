require('@babel/polyfill')

const { migratePage } = require('./core'),
    { outputFile } = require('fs-extra')

hexo.extend.migrator.register('web', ({ _: [URI, selector] }) =>
    migratePage(URI, selector)
        .then(({ name, markdown }) =>
            outputFile(`source/_posts/${name}.md`, markdown)
        )
        .then(() => console.info(`[Migrated] ${URI}`))
)
