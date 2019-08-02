import {
    executablePath,
    convertor,
    body_tag,
    meta_tag,
    removeHidden,
    convertMedia,
    fileNameOf
} from './utility';

import { blobFrom, uniqueID } from '@tech_query/node-toolkit';

import Puppeteer from 'puppeteer-core';

import { JSDOM } from 'jsdom';

import { parse } from 'url';

import fetch from 'node-fetch';

import scrollToEnd from 'puppeteer-autoscroll-down';

import fileType from 'file-type';

import { stringify } from 'yaml';

import { join } from 'path';

import { existsSync, outputFile } from 'fs-extra';

var browser,
    page,
    resource = {},
    userAgent =
        'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

/**
 * @this {Window}
 *
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
    var { document } = this,
        tag;

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

            var { title } = _meta_;

            if (!title) {
                title = document.title.split(/\s+-\s+/);

                title = title[1] ? title.slice(0, -1).join(' - ') : title[0];
            }

            return Object.assign(_meta_, {
                title,
                content: tag.innerHTML,
                media: Array.from(
                    document.querySelectorAll('img[src]'),
                    item => item.src
                )
            });
        }
}

async function evaluate(URI, selector) {
    const { window } = await JSDOM.fromURL(URI, {
        pretendToBeVisual: true,
        resources: 'usable',
        runScripts: 'dangerously',
        userAgent
    });

    removeHidden.call(window);

    const data = fetchPage.call(window, selector, meta_tag);

    for (let item of data.media)
        switch (parse(item).protocol) {
            case 'http':
            case 'https':
                resource[item] = await (await fetch(item)).buffer();
                break;
            case 'data':
                resource[item] = blobFrom(item).data;
        }

    return data;
}

/**
 * @param {String}   URI
 * @param {String[]} [selector]
 *
 * @return {Page} https://github.com/GoogleChrome/puppeteer/blob/v1.7.0/docs/api.md#class-page
 */
export async function bootPage(URI, selector) {
    if (!executablePath) return page;
    /* eslint-disable */
    browser = browser || (await Puppeteer.launch({ executablePath }));

    page = page || (await browser.pages())[0];
    /* eslint-enable */
    page.setUserAgent(userAgent);
    page.setDefaultNavigationTimeout(0);

    page.on('response', async response => {
        if (response.status() < 300)
            resource[response.url()] = await response.buffer();
    });

    await page.goto(URI);

    await scrollToEnd(page);

    if (selector)
        try {
            await page.waitFor(
                selector.map(item => `${item}:not(:empty)`) + ''
            );
        } catch (error) {
            console.warn(error.message);

            await page.waitFor('body:not(:empty)');
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

    var page = await bootPage(
            URI,
            selector[1] ? selector.slice(0, -1) : selector
        ),
        data;

    if (page) {
        await page.evaluate(removeHidden);

        data = await page.evaluate(fetchPage, selector, meta_tag);
    } else data = await evaluate(URI, selector);

    Object.assign(
        data,
        convertMedia(URI, data.content, (URI, path) => {
            if (!resource[URI]) return;

            var { mime } = fileType(resource[URI]);

            mime = (mime || '').split('/')[1];

            return path.ext && mime === path.ext
                ? path.base
                : `${uniqueID()}.${mime}`;
        })
    );

    const meta = { ...data };

    delete meta.content;
    delete meta.media;
    meta.date = meta.date || new Date().toJSON();

    return {
        name: fileNameOf(data.title),
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

    var path = join('source/_posts', categories.join('/'), name),
        files = [];

    if (existsSync(path)) path += '-' + uniqueID();

    files.push([`${path}.md`, markdown]);

    media.forEach(
        ([name, data]) => data.length && files.push([`${path}/${name}`, data])
    );

    for (let [file, data] of files) {
        await outputFile(file, data);

        console.info(`[save] ${file}`);
    }

    console.info('--------------------');
    console.timeEnd('Migrate');
    console.info('');
}
