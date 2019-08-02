import { getNPMConfig } from '@tech_query/node-toolkit';

import TurnDown from 'turndown';

import { gfm } from 'turndown-plugin-gfm';

import { JSDOM } from 'jsdom';

import URL from 'url';

import Path from 'path';

export const executablePath = getNPMConfig('chrome');

export const Empty_URL = /^(#+|javascript:\s*void\(0\);?\s*)$/;

export const convertor = new TurnDown({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    linkStyle: 'referenced'
});

convertor
    .use(gfm)
    .addRule('non_url', {
        filter: node =>
            ['a', 'area'].includes(node.nodeName.toLowerCase()) &&
            Empty_URL.test(node.getAttribute('href')),
        replacement: (content, node) => content.trim() || node.title.trim()
    })
    .addRule('asset_image', {
        filter: ['img'],
        replacement(_, node) {
            const path = node.getAttribute('src'),
                title = node.title || node.alt;

            return /^http/.test(path)
                ? `![${title}](${path} '${title}')`
                : `{% asset_img ${path} ${title} %}`;
        }
    })
    .addRule('asset_code', {
        filter: ['style', 'script'],
        replacement: () => ''
    });

const attribute_key = {
    '#': 'id',
    '.': 'class'
};

export function likeOf(selector) {
    const key = attribute_key[selector[0]];

    return key ? `[${key}*="${selector.slice(1)}" i]` : selector;
}

export const body_tag = [
    'article',
    'main',
    '.article',
    '.content',
    '.post',
    '.blog',
    '.main',
    '.container',
    'body'
];

export const meta_tag = {
    title: ['h1', 'h2', '.title'].map(likeOf),
    authors: ['.author', '.publisher', '.creator', '.editor'].map(likeOf),
    date: ['.date', '.time', '.publish', '.create'].map(likeOf),
    updated: ['.update', '.edit', '.modif'].map(likeOf),
    categories: ['.breadcrumb', '.categor'].map(likeOf),
    tags: ['.tag', '.label'].map(likeOf)
};

/**
 * @param {String} raw
 *
 * @return {String}
 */
export function fileNameOf(raw) {
    return raw.replace(/[/\\:*?'"<>|.#\s]+/g, '-');
}

/**
 * @this {Window}
 *
 * @param {Element} [root=document.body]
 */
export function removeHidden(root = this.document.body) {
    const hidden = [];

    const walker = this.document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode(node) {
                const { display, visibility } = self.getComputedStyle(node);

                return display === 'none' || visibility === 'hidden'
                    ? (hidden.push(node), NodeFilter.FILTER_REJECT)
                    : NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    while (walker.nextNode());

    hidden.forEach(node => node.remove());
}

/**
 * @param {String}                                      URI
 * @param {String}                                      HTML
 * @param {function(URI: String, path: Object): String} mapper
 *
 * @return {Object}
 */
export function convertMedia(URI, HTML, mapper) {
    const {
        window: { document }
    } = new JSDOM(HTML, { url: URI });

    return {
        media: Array.from(document.querySelectorAll('img[src]'), item => {
            const { protocol, pathname, href } = URL.parse(item.src);

            var path =
                protocol === 'http' || protocol === 'https'
                    ? Path.parse(pathname)
                    : href;

            if ((path = mapper(href, path)))
                return {
                    URI: href,
                    path: (item.src = path)
                };
        }).filter(Boolean),
        content: document.body.innerHTML
    };
}
