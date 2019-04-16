import { getNPMConfig } from '@tech_query/node-toolkit'

import { JSDOM } from 'jsdom'

import Puppeteer from 'puppeteer-core'

import TurnDown from 'turndown'

const executablePath = getNPMConfig('chrome'),
    convertor = new TurnDown({
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

var document, browser, page

export function fetchPage(selector) {
    var tag

    while ((tag = selector.shift()))
        if ((tag = document.querySelector(tag)))
            return {
                title: (
                    (tag.querySelector('h1') || document.querySelector('h1'))
                        .textContent || document.title
                ).trim(),
                content: tag.innerHTML
            }
}

export async function bootPage(URI, selector) {
    if (executablePath) {
        browser = browser || (await Puppeteer.launch({ executablePath }))

        page = page || (await browser.pages())[0]

        await page.goto(URI)

        if (selector)
            await page.waitFor(
                selector.map(item => `${item}:not(:empty)`) + ''
            )
    }

    return page
}

export async function migratePage(URI, selector) {
    selector = selector ? [selector].concat(body_tag) : body_tag

    var page = await bootPage(
            URI,
            selector[1] ? selector.slice(0, -1) : selector
        ),
        data,
        title,
        content

    if (!page) {
        document = (await JSDOM.fromURL(URI)).window.document

        data = await fetchPage(selector)
    } else {
        data = await page.evaluate(fetchPage, selector)

        await browser.close()
    }

    (title = data.title), (content = data.content)

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
