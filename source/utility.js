import { getNPMConfig } from '@tech_query/node-toolkit';

import TurnDown from 'turndown';

import { gfm } from 'turndown-plugin-gfm';

import { JSDOM } from 'jsdom';

import { URL } from 'url';

import { parse } from 'path';

export const executablePath = getNPMConfig('chrome');

export const convertor = new TurnDown({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    linkStyle: 'referenced'
});

convertor.use(gfm);

convertor.addRule('asset_image', {
    filter: ['img'],
    replacement: (_, node) =>
        `{% asset_img ${node.getAttribute('src')} ${node.title || node.alt} %}`
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
    authors: ['.author', '.publisher', '.creator', '.editor'].map(likeOf),
    date: ['.date', '.publish', '.create'].map(likeOf),
    updated: ['.update', '.edit', '.modif'].map(likeOf),
    categories: ['.breadcrumb', '.categor'].map(likeOf),
    tags: ['.tag', '.label'].map(likeOf)
};

/**
 * @return {String}
 */
export function uniqueID() {
    return parseInt((Math.random() + '').slice(2)).toString(36);
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
            const URI = item.src;

            return {
                URI,
                path: (item.src = mapper(URI, parse(new URL(URI).pathname)))
            };
        }),
        content: document.body.innerHTML
    };
}
