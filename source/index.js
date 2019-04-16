require('@babel/polyfill')

const { migratePage } = require('./core'),
    { join } = require('path'),
    { outputFile } = require('fs-extra')

function command(URI, selector) {
    var file

    return migratePage(URI, selector)
        .then(({ categories, name, markdown }) => {
            file = join('source/_posts', categories.join('/'), `${name}.md`)

            return outputFile(file, markdown)
        })
        .then(() =>
            console.info(`[Migrated]
    ${URI}
  ->
    ${file}`)
        )
}

hexo.extend.migrator.register('web', ({ _ }) => command(..._))
