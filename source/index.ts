import { basename } from 'path';

import { convertor } from './parser';
import { savePage } from './loader';

convertor.addRule('asset_image', {
    filter: ['img'],
    replacement(_, node: HTMLImageElement) {
        const path = node.getAttribute('src'),
            title = (node.title || node.alt).trim();

        const code = path.startsWith('http')
            ? `![${title}](${path} '${title}')`
            : `{% asset_img ${basename(path)} ${title} %}`;

        return title
            ? `<figure>\n${code}\n  <figcaption>${title}</figcaption>\n</figure>`
            : code;
    }
});

hexo.extend.migrator.register('web', ({ _: [URI, root_selector] }) =>
    savePage(URI, root_selector, 'source/_posts').then(() => process.exit())
);
