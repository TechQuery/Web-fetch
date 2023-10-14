# Web fetch

Asset Crawler for common Web pages

[![NPM Dependency](https://img.shields.io/librariesio/github/TechQuery/Web-fetch.svg)][1]
[![CI & CD](https://github.com/TechQuery/Web-fetch/actions/workflows/main.yml/badge.svg)][2]

[![NPM](https://nodei.co/npm/web-fetch.png?downloads=true&downloadRank=true&stars=true)][3]

## Usage

### As a Node.js package

```javascript
import { savePage } from 'web-fetch';

savePage({
    source: 'http://URL.to/one/of/your/old/posts/'
});
```

#### Docker example

https://github.com/kaiyuanshe/KYS-service

### As a Command Line tool

```shell
web-fetch http://URL.to/one/of/your/old/posts/
```

### In GitHub actions

```yml
name: Fetch Web pages
on:
    issues:
        types:
            - opened
jobs:
    Fetch-and-Save:
        runs-on: ubuntu-latest
        permissions:
            contents: write
            issues: write
        steps:
            - uses: actions/checkout@v3

            - uses: pnpm/action-setup@v2
              with:
                  version: 8
            - uses: actions/setup-node@v3
              with:
                  node-version: 18
                  cache: pnpm
            - uses: browser-actions/setup-chrome@v1

            - name: Setup Web-fetch
              run: pnpm i web-fetch -g

            - name: Fetch first URL in Issue Body
              run: web-fetch $(echo "${{ github.event.issue.Body }}" | grep -Eo "https?://\S+")

            - uses: stefanzweifel/git-auto-commit-action@v5
              with:
                  commit_message: '${{ github.event.issue.title }}'
```

## Supported Structure

https://github.com/TechQuery/Web-fetch/blob/master/source/config.ts#L10-L29

## Renderer

1. [Puppeteer](https://pptr.dev/) (default)

2. [JSDOM](https://github.com/jsdom/jsdom)

## Wrapper

1. [Hexo plugin](https://github.com/TechQuery/Web-fetch/tree/master/wrapper/Hexo/)

[1]: https://libraries.io/npm/web-fetch
[2]: https://github.com/TechQuery/Web-fetch/actions/workflows/main.yml
[3]: https://nodei.co/npm/web-fetch/
