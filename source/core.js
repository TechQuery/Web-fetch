import { getNPMConfig } from '@tech_query/node-toolkit';

import TurnDown from 'turndown';

import Puppeteer from 'puppeteer-core';

import { JSDOM } from 'jsdom';

import { body_tag, meta_tag, convertMedia, uniqueID } from './utility';

import fetch from 'node-fetch';

import fileType from 'file-type';

import { stringify } from 'yaml';

import { join } from 'path';

import { outputFile } from 'fs-extra';

const executablePath = getNPMConfig('chrome'),
    convertor = new TurnDown({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        linkStyle: 'referenced'
    });

var document,
    browser,
    page,
    resource = {};

/**
 * @param {String[]} selector
 * @param {?Object}  meta
 * @param {String[]} meta.authors
 * @param {String[]} meta.date
 * @param {String[]} meta.updated
 * @param {String[]} meta.categories
 * @param {String[]} meta.tags
 *
 * @return {Object}
 */
export function fetchPage(selector, meta) {
    var tag;

    while ((tag = selector.shift()))
        if ((tag = document.querySelector(tag))) {
            const _meta_ = {};

            for (let key in meta) {
                let tag = document.querySelector(meta[key] + '');

                if (!tag) continue;

                _meta_[key] = Array.from(tag.children, item =>
                    item.textContent.trim()
                ).filter(Boolean);

                if (!_meta_[key][1]) _meta_[key] = _meta_[key][0] || '';
            }

            return Object.assign(_meta_, {
                title: (
                    (tag.querySelector('h1') || document.querySelector('h1'))
                        .textContent || document.title
                ).trim(),
                content: tag.innerHTML,
                media: Array.from(
                    document.querySelectorAll('img[src]'),
                    item => item.src
                )
            });
        }
}

async function evaluate(URI, selector) {
    document = (await JSDOM.fromURL(URI, {
        pretendToBeVisual: true,
        resources: 'usable',
        runScripts: 'dangerously'
    })).window.document;

    const data = await fetchPage(selector, meta_tag);

    for (let item of data.media)
        if (/^http/.test(item))
            resource[item] = await (await fetch(item)).buffer();

    return data;
}

/**
 * @param {String}   URI
 * @param {String[]} [selector]
 *
 * @return {Page} https://github.com/GoogleChrome/puppeteer/blob/v1.7.0/docs/api.md#class-page
 */
export async function bootPage(URI, selector) {
    if (executablePath) {
        browser = browser || (await Puppeteer.launch({ executablePath }));

        page = page || (await browser.pages())[0];

        page.on(
            'response',
            async response =>
                (resource[response.url()] = await response.buffer())
        );

        await page.goto(URI);

        if (selector)
            await page.waitFor(
                selector.map(item => `${item}:not(:empty)`) + ''
            );
    }

    return page;
}

/**
 * @param {String} URI
 * @param {String} [selector]
 *
 * @return {Object}
 */
export async function migratePage(URI, selector) {
    selector = selector ? [selector].concat(body_tag) : body_tag;

    const page = await bootPage(
        URI,
        selector[1] ? selector.slice(0, -1) : selector
    );

    const data = await (page
        ? page.evaluate(fetchPage, selector, meta_tag)
        : evaluate(URI, selector));

    Object.assign(
        data,
        convertMedia(URI, data.content, (URI, { ext, base }) => {
            var type = (fileType(resource[URI]) || '').mime;

            type = (type || '').split('/')[1];

            return type === ext ? base : `${uniqueID()}.${type}`;
        })
    );

    const meta = { ...data };

    delete meta.content;
    delete meta.media;
    meta.date = meta.date || new Date().toJSON();

    return {
        name: data.title.replace(/\s+/g, '-'),
        categories: data.categories || [],
        markdown: `---
${stringify(meta).trim()}
---

${convertor.turndown(data.content)}`,
        media: data.media.map(({ path, URI }) => [path, resource[URI]])
    };
}

export default async function(URI, selector) {
    console.time('Migrate');
    console.info(`[load] ${URI}`);

    const { categories, name, markdown, media } = await migratePage(
        URI,
        selector
    );

    const path = join('source/_posts', categories.join('/'), name),
        files = [];

    files.push([`${path}.md`, markdown]);

    media.forEach(([name, data]) => files.push([`${path}/${name}`, data]));

    for (let [file, data] of files) {
        await outputFile(file, data);

        console.info(`[save] ${file}`);
    }

    console.info('--------------------');
    console.timeEnd('Migrate');
}
