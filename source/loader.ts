import memoize from 'lodash.memoize';
import Puppeteer, { Page } from 'puppeteer-core';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { join, parse } from 'path';
import { blobFrom } from '@tech_query/node-toolkit';
import { stringify } from 'yaml';
import { outputFile } from 'fs-extra';

import { executablePath, userAgent, meta_tag, body_tag } from './config';
import {
    sourcePathOf,
    parsePage,
    fileNameOf,
    convertor,
    createFilePath
} from './parser';

export const getPage: () => Promise<Page> = memoize(async () => {
    const browser = await Puppeteer.launch({ executablePath });
    const page = await browser.newPage();

    await Promise.all([
        page.setRequestInterception(true),
        page.setUserAgent(userAgent)
    ]);
    page.setDefaultNavigationTimeout(0);

    page.on('request', request => {
        if (['image', 'media'].includes(request.resourceType()))
            request.abort();
        else request.continue();
    });
    return page;
});

export async function loadPage(URI: string, root_selector = 'body') {
    if (!executablePath)
        return JSDOM.fromURL(URI, {
            userAgent,
            pretendToBeVisual: true,
            runScripts: 'outside-only'
        });

    const page = await getPage();

    await page.goto(URI);
    await page.waitForSelector(`${root_selector}:not(:empty)`);

    return new JSDOM(await page.content(), { url: URI });
}

export interface MediaItem {
    name: string;
    data: Buffer;
}

export async function fetchMedia(root: HTMLElement, root_path = '') {
    const list = Array.from(
        root.querySelectorAll<HTMLMediaElement>('img, audio, video'),
        async media => {
            try {
                var { pathname, protocol, href } = sourcePathOf(media);
            } catch {
                media.remove();
            }

            if (protocol === 'data:') var { data } = await blobFrom(href);
            else
                var data = await (
                    await fetch(href, { headers: { 'User-Agent': userAgent } })
                ).buffer();

            const name = await createFilePath(data, pathname, root_path);

            media.src = name;

            if (media.style.display === 'none') media.style.display = '';

            return { name, data };
        }
    );
    return (await Promise.allSettled(list))
        .map(result =>
            result.status === 'fulfilled'
                ? result.value
                : console.error(result.reason)
        )
        .filter(Boolean) as MediaItem[];
}

export interface PageData
    extends Partial<Record<keyof typeof meta_tag, string | string[]>> {
    content: string;
    media: MediaItem[];
}

export async function fetchPage(
    URI: string,
    root_selector?: string
): Promise<PageData> {
    const {
        window: { document }
    } = await loadPage(URI);

    let root: HTMLElement;

    for (const selector of [root_selector, ...body_tag])
        if (selector && (root = document.querySelector(selector))) break;

    const meta = parsePage(document, meta_tag),
        media = await fetchMedia(root, parse(URI).name);

    for (const element of document.querySelectorAll(
        'link, script, form, fieldset, legend, label, input, button'
    ))
        element.remove();

    return { ...meta, content: root.innerHTML, media };
}

export interface PageSaveOption {
    source: string;
    rootSelector?: string;
    markdown?: boolean;
    rootFolder?: string;
}

export async function savePage({
    source,
    rootSelector,
    markdown,
    rootFolder = process.cwd()
}: PageSaveOption) {
    console.time('Fetch');

    const { content, media, ...meta } = await fetchPage(source, rootSelector);

    const root_path = join(
        rootFolder,
        ...((meta.categories as string[]) || []).map(fileNameOf)
    );
    const text_file = join(
            root_path,
            `${fileNameOf(parse(source).name)}.${markdown ? 'md' : 'html'}`
        ),
        data = !markdown
            ? content
            : `---
${stringify(meta)}
---

${convertor.turndown(content)}`;

    await outputFile(text_file, data);

    console.log('[save] ' + text_file);

    for (const { name, data } of media) {
        const media_file = join(root_path, name);

        await outputFile(media_file, data);

        console.log('[save] ' + media_file);
    }
    console.log('--------------------');
    console.timeEnd('Fetch');
}
