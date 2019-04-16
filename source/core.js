import { getNPMConfig } from '@tech_query/node-toolkit'

import { JSDOM } from 'jsdom'

import Puppeteer from 'puppeteer-core'

import { body_tag, meta_tag } from './utility'

import { stringify } from 'yaml'

import TurnDown from 'turndown'

const executablePath = getNPMConfig('chrome'),
    convertor = new TurnDown({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        linkStyle: 'referenced'
    })

var document, browser, page

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
    var tag

    while ((tag = selector.shift()))
        if ((tag = document.querySelector(tag))) {
            const _meta_ = {}

            for (let key in meta) {
                let tag = document.querySelector(meta[key] + '')

                if (!tag) continue

                _meta_[key] = Array.from(tag.children, item =>
                    item.textContent.trim()
                ).filter(Boolean)

                if (!_meta_[key][1]) _meta_[key] = _meta_[key][0] || ''
            }

            return Object.assign(_meta_, {
                title: (
                    (tag.querySelector('h1') || document.querySelector('h1'))
                        .textContent || document.title
                ).trim(),
                content: tag.innerHTML
            })
        }
}

/**
 * @param {String}   URI
 * @param {String[]} [selector]
 *
 * @return {Page} https://github.com/GoogleChrome/puppeteer/blob/v1.7.0/docs/api.md#class-page
 */
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

/**
 * @param {String} URI
 * @param {String} [selector]
 */
export async function migratePage(URI, selector) {
    selector = selector ? [selector].concat(body_tag) : body_tag

    var page = await bootPage(
            URI,
            selector[1] ? selector.slice(0, -1) : selector
        ),
        data

    if (!page) {
        document = (await JSDOM.fromURL(URI)).window.document

        data = await fetchPage(selector, meta_tag)
    } else {
        data = await page.evaluate(fetchPage, selector, meta_tag)

        await browser.close()
    }

    const meta = { ...data }

    delete meta.content
    meta.date = meta.date || new Date().toJSON()

    return {
        name: data.title.replace(/\s+/g, '-'),
        categories: data.categories || [],
        markdown: `---
${stringify(meta).trim()}
---

${convertor.turndown(data.content)}`
    }
}
