const attribute_key = {
    '#': 'id',
    '.': 'class'
}

export function likeOf(selector) {
    const key = attribute_key[selector[0]]

    return key ? `[${key}*="${selector.slice(1)}" i]` : selector
}

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
]

export const meta_tag = {
    authors: ['.author', '.publisher', '.creator', '.editor'].map(likeOf),
    date: ['.date', '.publish', '.create'].map(likeOf),
    updated: ['.update', '.edit', '.modif'].map(likeOf),
    categories: ['.breadcrumb', '.categor'].map(likeOf),
    tags: ['.tag', '.label'].map(likeOf)
}
