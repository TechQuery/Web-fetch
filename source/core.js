import { JSDOM } from 'jsdom'

import TurnDown from 'turndown'

const convertor = new TurnDown({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        linkStyle: 'referenced'
    }),
    body_tag = [
        'article',
        'main',
        '.article',
        '.content',
        '.main',
        '.container',
        'body'
    ]

export async function fetchPage(URI, selector) {
    const {
        window: { document }
    } = await JSDOM.fromURL(URI)

    for (let tag of [selector].concat(body_tag))
        if (tag && (tag = document.querySelector(tag)))
            return {
                title: (
                    (tag.querySelector('h1') || document.querySelector('h1'))
                        .textContent || document.title
                ).trim(),
                content: tag
            }
}

export async function postOf(URI, selector) {
    const { title, content } = await fetchPage(URI, selector)

    return {
        title,
        name: title.replace(/\s+/g, '-'),
        html: content,
        markdown: `---
title: ${title}
date: ${new Date().toJSON()}
---

${convertor.turndown(content)}`
    }
}
