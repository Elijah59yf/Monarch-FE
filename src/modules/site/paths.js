// Language-neutral paths ("/about") and their localized forms ("/ja/about").

export function localizedPath(lang, path) {
    return path === '/' ? `/${lang}/` : `/${lang}${path}`;
}

export function journalPostPath(slug) {
    return `/journal/${encodeURIComponent(slug)}`;
}
