import 'array-unique-proposal';
import TurnDown from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { uniqueID } from '@tech_query/node-toolkit';
import { fromBuffer } from 'file-type';
import { join } from 'path';

import { body_tag } from './config';

export const AttributeKey = {
        '#': 'id',
        '.': 'class'
    },
    MediaSelector = 'img, audio, video',
    LinkSelector = 'a[href], area[href]';

export function likeOf(selector: string) {
    const key = AttributeKey[selector[0] as keyof typeof AttributeKey];

    return key ? `[${key}*="${selector.slice(1)}" i]` : selector;
}

export function parseContent(document: Document, rootSelector = '') {
    let root: HTMLElement;

    for (const selector of [rootSelector, ...body_tag])
        if (selector && (root = document.querySelector(selector))) break;

    for (const element of document.querySelectorAll(IgnoredTags + ''))
        element.remove();

    for (const element of document.querySelectorAll<HTMLElement>(
        '[style*="display:"]'
    )) {
        const { display, visibility, opacity, width, height } =
            document.defaultView.getComputedStyle(element);

        if (
            !element.matches(MediaSelector) &&
            (display === 'none' ||
                visibility === 'hidden' ||
                !(opacity || width || height))
        )
            element.remove();
    }
    return root;
}

export type MetaData<T extends Record<string, any>> = Record<
    keyof T,
    string | string[]
>;

export function parseMeta<T extends Record<string, string[]>>(
    document: Document,
    selectorMap: T
) {
    const data = {} as MetaData<T>;

    for (const key in selectorMap)
        for (const selector of selectorMap[key]) {
            const tags = document.querySelectorAll(selector);

            if (!tags[0]) continue;

            const value = Array.from(
                tags,
                tag => (tag.remove(), tag.textContent.trim())
            )
                .uniqueBy()
                .filter(Boolean);

            data[key] = key.endsWith('s') ? value : value[0];
            break;
        }

    return data;
}

export function sourcePathOf({ dataset, src }: HTMLMediaElement) {
    for (const key in dataset)
        try {
            return new URL(dataset[key]);
        } catch {
            //
        }
    return new URL(src);
}

export const Empty_URL = /^(#+|javascript:.+)$/;

export const convertor = new TurnDown({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    linkStyle: 'referenced'
});

export const IgnoredTags: (keyof HTMLElementTagNameMap)[] = [
    'meta',
    'link',
    'script',
    'form',
    'fieldset',
    'legend',
    'label',
    'input',
    'button'
];

convertor
    .use(gfm)
    .addRule('user_interface', {
        filter: IgnoredTags,
        replacement: () => ''
    })
    .addRule('non_url', {
        filter: node =>
            ['a', 'area'].includes(node.nodeName.toLowerCase()) &&
            Empty_URL.test(node.getAttribute('href')),
        replacement: () => ''
    });

export function fileNameOf(raw: string) {
    return raw.replace(/[/\\:*?'"<>|.#\s]+/g, '-');
}

export function parseFileName(path: string) {
    const name_parts = path
        .split('/')
        .filter(Boolean)
        .slice(-1)[0]
        .split('.')
        .filter(Boolean);

    return {
        base: name_parts.slice(0, -1).join('.'),
        ext: name_parts[1] && name_parts.slice(-1)[0].match(/^\w+/)[0]
    };
}

export async function createFilePath(
    data: Buffer,
    raw_path: string,
    target_root = ''
) {
    const { base, ext } = parseFileName(raw_path);

    const type = ext || (await fromBuffer(data))?.ext;
    let name = base || uniqueID();

    if (type) name += `.${type}`;

    return join(target_root, decodeURI(name)).replace(/\\+/g, '/');
}
