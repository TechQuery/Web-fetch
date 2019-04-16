# Hexo Migrator for Web

[Hexo](https://hexo.io/) Migrator plugin for common Web pages

[![NPM Dependency](https://david-dm.org/TechQuery/hexo-migrator-web.svg)](https://david-dm.org/TechQuery/hexo-migrator-web)

[![NPM](https://nodei.co/npm/hexo-migrator-web.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/hexo-migrator-web/)

## Usage

### Basic

```shell
hexo migrate web http://URL.to/one/of/your/old/posts/
```

### Advanced

Create `task-list.txt`

```
http://URL.to/your/old/posts/1/
http://URL.to/your/old/posts/2/
```

then execute

```shell
hexo migrate web ./task-list.txt
```

## Supported Structure

https://github.com/TechQuery/hexo-migrator-web/blob/master/source/utility.js#L12

## Renderer

1. [Puppeteer](https://pptr.dev/) (default)

2. [JSDOM](https://github.com/jsdom/jsdom)
