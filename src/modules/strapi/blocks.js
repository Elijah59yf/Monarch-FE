import { escape, safeUrl } from '../../lib/html.js';

// Strapi media URLs are relative to the Strapi host when they start with "/".
export function mediaUrl(url, base) {
    if (typeof url !== 'string' || url.trim() === '') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return base + trimmed;
    return safeUrl(trimmed, '');
}

function renderText(child) {
    let text = escape(child.text ?? '');
    if (child.bold) text = `<strong>${text}</strong>`;
    if (child.italic) text = `<em>${text}</em>`;
    if (child.code) text = `<code>${text}</code>`;
    return text.replace(/\n/g, '<br>');
}

function renderInline(children) {
    if (!Array.isArray(children)) return '';
    return children.map((child) => {
        if (child?.type === 'text') return renderText(child);
        if (child?.type === 'link' && child.url) {
            const label = Array.isArray(child.children) ? renderInline(child.children) : escape(child.url);
            return `<a href="${escape(safeUrl(child.url))}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        }
        return '';
    }).join('');
}

function renderList(block) {
    const tag = block.format === 'ordered' ? 'ol' : 'ul';
    const items = (Array.isArray(block.children) ? block.children : []).map((item) => {
        if (item?.type === 'list-item') return `<li>${renderInline(item.children)}</li>`;
        if (item?.type === 'list') return renderList(item);
        return '';
    }).join('');
    return `<${tag}>${items}</${tag}>`;
}

function renderBlock(block, base) {
    switch (block?.type) {
        case 'paragraph':
            return `<p>${renderInline(block.children)}</p>`;
        case 'heading': {
            const level = Math.min(6, Math.max(1, Number.parseInt(block.level, 10) || 2));
            return `<h${level}>${renderInline(block.children)}</h${level}>`;
        }
        case 'list':
            return renderList(block);
        case 'quote':
            return `<blockquote>${renderInline(block.children)}</blockquote>`;
        case 'image': {
            const src = mediaUrl(block.image?.url, base);
            if (!src) return '';
            return `<figure><img src="${escape(src)}" alt="${escape(block.image.alternativeText ?? '')}"></figure>`;
        }
        case 'code': {
            const code = Array.isArray(block.children) ? block.children.map((c) => c?.text ?? '').join('') : '';
            return `<pre><code>${escape(code)}</code></pre>`;
        }
        default:
            return '';
    }
}

// Returns an HTML string in which every piece of CMS text has been escaped.
export function renderBlocks(content, base) {
    if (Array.isArray(content)) return content.map((block) => renderBlock(block, base)).join('');
    if (typeof content === 'string' && content.trim() !== '') {
        return content.split(/\n{2,}/).map((part) => `<p>${escape(part.trim()).replace(/\n/g, '<br>')}</p>`).join('');
    }
    return '';
}

// Same counting as the old browser code: top-level block text at 200 words per minute.
export function readingTime(content) {
    let text = '';
    if (Array.isArray(content)) {
        for (const block of content) {
            if (!Array.isArray(block?.children)) continue;
            for (const child of block.children) if (child?.text) text += child.text + ' ';
        }
    } else if (typeof content === 'string') {
        text = content.replace(/<[^>]*>/g, '');
    }
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}
