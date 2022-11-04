# Web fetch

Asset Crawler for common Web pages

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

## Supported Structure

https://github.com/TechQuery/Web-fetch/blob/master/source/config.ts#L10-L29

## Renderer

1. [Puppeteer](https://pptr.dev/) (default)

2. [JSDOM](https://github.com/jsdom/jsdom)

## Wrapper

1. [Hexo plugin](https://github.com/TechQuery/Web-fetch/tree/master/wrapper/Hexo/)

[2]: https://github.com/TechQuery/Web-fetch/actions/workflows/main.yml
[3]: https://nodei.co/npm/web-fetch/
