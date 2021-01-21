import TurnDown from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { uniqueID } from '@tech_query/node-toolkit';
import { fromBuffer } from 'file-type';
import { parse, join } from 'path';

const attribute_key = {
    '#': 'id',
    '.': 'class'
};

export function likeOf(selector: string) {
    const key = attribute_key[selector[0] as keyof typeof attribute_key];

    return key ? `[${key}*="${selector.slice(1)}" i]` : selector;
}

export function parsePage<T extends Record<string, string[]>>(
    document: HTMLDocument,
    selectorMap: T
) {
    type MetaData = Record<keyof T, string | string[]>;

    const data: MetaData = {} as MetaData;

    for (const key in selectorMap)
        for (const selector of selectorMap[key]) {
            const tags = document.querySelectorAll(selector);

            if (!tags[0]) continue;

            const value = [
                ...new Set(
                    Array.from(
                        tags,
                        tag => (tag.remove(), tag.textContent.trim())
                    )
                )
            ].filter(Boolean);

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

convertor
    .use(gfm)
    .addRule('user_interface', {
        filter: [
            'style',
            'script',
            'form',
            'fieldset',
            'legend',
            'label',
            'input',
            'button'
        ],
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
