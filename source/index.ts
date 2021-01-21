import { basename } from 'path';

import { convertor } from './parser';
import { savePage } from './loader';

convertor.addRule('asset_image', {
    filter: ['img'],
    replacement(_, { src, title, alt }: HTMLImageElement) {
        title = (title || alt).trim();

        const code = src.startsWith('http')
            ? `![${title}](${src} '${title}')`
            : `{% asset_img ${basename(src)} ${title} %}`;

        return title
            ? `<figure>\n${code}\n  <figcaption>${title}</figcaption>\n</figure>`
            : code;
    }
});

hexo.extend.migrator.register('web', ({ _: [URI, root_selector] }) =>
    savePage(URI, root_selector, 'source/_posts').then(() => process.exit())
);
