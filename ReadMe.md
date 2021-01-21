# Hexo Web migrator

[Hexo](https://hexo.io/) Migrator plugin for common Web pages

[![NPM Dependency](https://david-dm.org/TechQuery/hexo-migrator-web.svg)][1]
[![CI & CD](https://github.com/TechQuery/hexo-migrator-web/workflows/CI%20&%20CD/badge.svg)][2]

[![NPM](https://nodei.co/npm/hexo-migrator-web.png?downloads=true&downloadRank=true&stars=true)][3]

## Usage

### As a Hexo plugin

```shell
hexo migrate web http://URL.to/one/of/your/old/posts/
```

### As a Command Line tool

```shell
web-fetch http://URL.to/one/of/your/old/posts/
```

## Supported Structure

https://github.com/TechQuery/hexo-migrator-web/blob/master/source/config.ts#L10-L29

## Renderer

1. [Puppeteer](https://pptr.dev/) (default)

2. [JSDOM](https://github.com/jsdom/jsdom)

[1]: https://david-dm.org/TechQuery/hexo-migrator-web
[2]: https://github.com/TechQuery/hexo-migrator-web/actions
[3]: https://nodei.co/npm/hexo-migrator-web/
