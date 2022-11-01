#! /usr/bin node

import { Command, createCommand } from 'commander-jsx';

import { PageSaveOption, savePage } from './loader';

process.on('unhandledRejection', error => {
    console.error(error);

    process.exit();
});

type Options = Omit<PageSaveOption, 'source' | 'rootFolder'>;

Command.execute(
    <Command<Options>
        name="web-fetch"
        version="1.2.0"
        description="Web page fetcher"
        parameters="<source URL> [target folder] [options]"
        options={{
            rootSelector: {
                shortcut: 's',
                parameters: '<selector>',
                description: 'CSS Selector of Root HTML Container'
            },
            baseURI: {
                shortcut: 'b',
                parameters: '<URL>',
                description: 'Base URL of fetched HTML assets'
            },
            markdown: {
                shortcut: 'm',
                description: 'Whether converts HTML to MarkDown'
            }
        }}
        executor={async (
            { rootSelector, baseURI, markdown },
            source,
            rootFolder
        ) => {
            await savePage({
                source,
                rootSelector,
                baseURI,
                markdown,
                rootFolder
            } as PageSaveOption);

            process.exit();
        }}
    />,
    process.argv.slice(2)
);
