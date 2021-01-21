import { getNPMConfig } from '@tech_query/node-toolkit';

import { likeOf } from './parser';

export const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; rv:11.0) like Gecko';

export const executablePath = getNPMConfig('chrome') as string;

export const body_tag = [
    'article',
    'main',
    '.article',
    '.content',
    '.post',
    '.blog',
    '.main',
    '.container',
    'body'
];

export const meta_tag = {
    title: ['h1', 'h2', '.title', 'title'].map(likeOf),
    authors: ['.author', '.publisher', '.creator', '.editor'].map(likeOf),
    date: ['.date', '.time', '.publish', '.create'].map(likeOf),
    updated: ['.update', '.edit', '.modif'].map(likeOf),
    categories: ['.breadcrumb', '.categor'].map(likeOf),
    tags: ['.tag', '.label'].map(likeOf)
};
