# Hexo Web migrator

[Hexo][1] Migrator plugin for common Web pages

[![NPM](https://nodei.co/npm/hexo-migrator-web.png?downloads=true&downloadRank=true&stars=true)][2]

## Usage

```shell
hexo migrate web http://URL.to/one/of/your/old/posts/
```

## Supported Structure

https://github.com/TechQuery/Web-fetch/blob/d4c574adb6ed4b3030995f4ea26911e88d00c1fc/source/config.ts#L10-L29

## Renderer

1. [Puppeteer][3] (default)
2. [JSDOM][4]

[1]: https://hexo.io/
[2]: https://nodei.co/npm/hexo-migrator-web/
[3]: https://pptr.dev/
[4]: https://github.com/jsdom/jsdom
