#! /usr/bin node

import { savePage } from './loader';

const [URI, root_selector] = process.argv.slice(2, 4);

process.on('unhandledRejection', error => {
    console.error(error);

    process.exit();
});

savePage(URI, root_selector).then(() => process.exit());
