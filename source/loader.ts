import memoize from 'lodash.memoize';
import Puppeteer, { Browser } from 'puppeteer-core';
import { JSDOM } from 'jsdom';
import { join, parse } from 'path';
import { blobFrom } from '@tech_query/node-toolkit';
import { stringify } from 'yaml';
import { outputFile } from 'fs-extra';

import { executablePath, isFirefox, userAgent, meta_tag } from './config';
import {
    LinkSelector,
    MediaSelector,
    MetaData,
    parseMeta,
    parseContent,
    convertor,
    sourcePathOf,
    fileNameOf,
    createFilePath
} from './parser';

export const getBrowser: () => Promise<Browser> = memoize(() =>
    Puppeteer.launch({
        product: isFirefox ? 'firefox' : 'chrome',
        protocol: isFirefox ? 'webDriverBiDi' : 'cdp',
        headless: 'shell',
        executablePath,
        args: [
            '--single-process',
            '--no-zygote',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-extensions',
            '--no-startup-window',
            '--no-first-run',
            '--disable-infobars',
            '--disable-hang-monitor',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-sync',
            '--disable-translate',
            '--disable-bundled-ppapi-flash',
            '--safebrowsing-disable-auto-update',
            '--disable-component-update',
            '--ignore-certificate-errors',
            '--disable-client-side-phishing-detection',
            '--disable-logging',
            '--mute-audio'
        ]
    })
);

export async function getPage() {
    const browser = await getBrowser();
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
}

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

    const HTML = await page.content();

    await page.close();

    return new JSDOM(HTML, { url: URI });
}

export interface MediaItem {
    MIME: string;
    name: string;
    data: Buffer;
}

export async function* fetchMedia(root: HTMLElement, root_path = '') {
    for (const media of root.querySelectorAll<HTMLMediaElement>(
        MediaSelector
    )) {
        try {
            var { pathname, protocol, href } = sourcePathOf(media);
        } catch {
            media.remove();
        }

        if (protocol === 'data:') var { MIME, data } = await blobFrom(href);
        else {
            const response = await fetch(href, {
                headers: { 'User-Agent': userAgent }
            });
            var [MIME] = response.headers.get('Content-Type').split(';'),
                data = Buffer.from(await response.arrayBuffer());
        }
        const name = await createFilePath(data, pathname, root_path);

        media.src = name;

        if (media.style.display === 'none') media.style.display = '';

        yield { MIME, name, data };
    }
}

export function fixBaseURI(document: Document, baseURI: string) {
    const base = document.createElement('base');
    base.href = baseURI;
    document.head.append(base);

    for (const media of document.querySelectorAll<HTMLMediaElement>(
        MediaSelector
    ))
        media.setAttribute('src', media.src);

    for (const link of document.querySelectorAll<HTMLAnchorElement>(
        LinkSelector
    ))
        link.setAttribute('href', link.href);

    base.remove();
}

export interface AssetFetchOption {
    scope: string;
    rootSelector?: string;
    baseURI?: string;
    markdown?: boolean;
}

export async function* fetchAsset(
    document: Document,
    { scope, rootSelector, baseURI = '', markdown }: AssetFetchOption,
    meta?: MetaData<typeof meta_tag>
): AsyncGenerator<MediaItem, void, unknown> {
    const root = parseContent(document, rootSelector);

    for await (const media of fetchMedia(root, scope)) yield media;

    if (baseURI) fixBaseURI(document, baseURI);

    let markup = `<meta charset="UTF-8">
${root.innerHTML.trim().replace(/(\n\s*)+/g, '\n')}`;

    if (markdown)
        markup = `---
${stringify(meta)}
---

${convertor.turndown(markup)}`;

    yield {
        MIME: `text/${markdown ? 'markdown' : 'html'}`,
        name: `${fileNameOf(scope)}.${markdown ? 'md' : 'html'}`,
        data: Buffer.from(markup)
    };
}

export interface PageSaveOption extends Omit<AssetFetchOption, 'scope'> {
    source: string;
    rootFolder?: string;
}

export async function savePage({
    source,
    rootSelector,
    baseURI = '',
    markdown,
    rootFolder = process.cwd()
}: PageSaveOption) {
    console.time('Fetch');

    const scope = parse(source).name,
        {
            window: { document }
        } = await loadPage(source);

    const meta = parseMeta(document, meta_tag);

    const root_path = join(
        rootFolder,
        ...((meta.categories as string[]) || []).map(fileNameOf)
    );

    for await (const { name, data } of fetchAsset(
        document,
        { scope, rootSelector, baseURI, markdown },
        meta
    )) {
        const filePath = join(root_path, name);

        await outputFile(filePath, data);

        console.log('[save] ' + filePath);
    }
    console.log('--------------------');
    console.timeEnd('Fetch');
}
