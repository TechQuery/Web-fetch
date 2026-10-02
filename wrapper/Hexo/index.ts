import { basename } from 'path';
import { convertor, savePage } from 'web-fetch';

convertor.addRule('asset_image', {
    filter: ['img'],
    replacement(_, node) {
        if (node.nodeName !== 'IMG') return '';

        const { src, title: rawTitle, alt } = node as HTMLImageElement;
        const title = (rawTitle || alt).trim();

        const code = src.startsWith('http')
            ? `![${title}](${src} '${title}')`
            : `{% asset_img ${basename(src)} ${title} %}`;

        return title
            ? `<figure>\n${code}\n  <figcaption>${title}</figcaption>\n</figure>`
            : code;
    }
});

hexo.extend.migrator.register('web', async ({ _: [source, rootSelector] }) => {
    await savePage({
        source,
        rootSelector,
        markdown: true,
        rootFolder: 'source/_posts'
    });
    process.exit();
});
