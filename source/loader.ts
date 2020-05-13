import { Browser, launch, Page } from 'puppeteer-core';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { join } from 'path';
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

let browser: Browser;

export async function createPage() {
    browser = browser || (await launch({ executablePath }));

    const page = (await browser.pages())[0] || (await browser.newPage());

    await Promise.all([
        page.setRequestInterception(true),
        page.setUserAgent(userAgent)
    ]);
    page.setDefaultNavigationTimeout(0);

    return page.on('request', request => {
        if (['image', 'media'].includes(request.resourceType()))
            request.abort();
        else request.continue();
    });
}

let page: Page;

export async function loadPage(URI: string, root_selector = 'body') {
    if (!executablePath)
        return JSDOM.fromURL(URI, {
            userAgent,
            pretendToBeVisual: true,
            runScripts: 'outside-only'
        });

    page = page || (await createPage());

    await page.goto(URI);
    await page.waitFor(`${root_selector}:not(:empty)`);

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
            const { pathname, protocol, href } = sourcePathOf(media);

            if (protocol === 'data:') {
                const { data } = await blobFrom(href);

                return {
                    name: media.src = await createFilePath(
                        data,
                        pathname,
                        root_path
                    ),
                    data
                };
            }
            try {
                const data = await (
                    await fetch(href, { headers: { 'User-Agent': userAgent } })
                ).buffer();

                return {
                    name: media.src = await createFilePath(
                        data,
                        pathname,
                        root_path
                    ),
                    data
                };
            } catch (error) {
                console.error(error);
            }
        }
    );
    return (await Promise.allSettled(list))
        .map(
            ({ status, value }: PromiseFulfilledResult<MediaItem>) =>
                status === 'fulfilled' && value
        )
        .filter(Boolean);
}

export type PageData = {
    [key in keyof typeof meta_tag]?: string | string[];
} & { content: string; media: MediaItem[] };

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
        media = await fetchMedia(root, fileNameOf(meta.title as string));

    return {
        ...meta,
        content: convertor.turndown(root.innerHTML),
        media
    };
}

export async function savePage(
    URI: string,
    root_selector?: string,
    root = process.cwd()
) {
    console.time('Fetch');

    const { content, media, ...meta } = await fetchPage(URI, root_selector);

    const root_path = join(
        ...((meta.categories as string[]) || []).map(fileNameOf)
    );
    const text_file = join(root_path, fileNameOf(meta.title as string) + '.md');

    await outputFile(
        join(root, text_file),
        `---
${stringify(meta)}
---

${content}`
    );
    console.log('[save] ' + text_file);

    for (const { name, data } of media) {
        const media_file = join(root_path, name);

        await outputFile(media_file, data);

        console.log('[save] ' + media_file);
    }
    console.log('--------------------');
    console.timeEnd('Fetch');
}
