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
    const key = attribute_key[selector[0]];

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
    .addRule('hidden', {
        filter: node => {
            const { width, height } = node.getBoundingClientRect();

            return !!(width && height);
        },
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

export async function createFileName(data: Buffer) {
    const { ext } = (await fromBuffer(data)) || {};

    if (!ext) throw TypeError('Unknown File Type');

    return `${uniqueID()}.${ext}`;
}

export async function createFilePath(
    data: Buffer,
    raw_path: string,
    target_root = ''
) {
    const { base, ext } = parse(raw_path);

    return join(target_root, ext ? base : await createFileName(data)).replace(
        /\\+/g,
        '/'
    );
}
