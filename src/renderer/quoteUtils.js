export function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export function lineTotal(item) {
    return toNumber(item.price) * toNumber(item.quantity);
}

export function quoteTotals(quote) {
    const subtotal = (quote?.groups || []).reduce((sum, group) =>
        sum + group.items.reduce((gSum, item) => gSum + lineTotal(item), 0), 0);
    const workFee = subtotal * toNumber(quote?.workFeePercentage) / 100;
    return {subtotal, workFee, total: subtotal + workFee};
}

const priceFormatter = new Intl.NumberFormat('hu-HU', {style: 'currency', currency: 'HUF', maximumFractionDigits: 0});

export function formatPrice(price) {
    return priceFormatter.format(toNumber(price));
}

export function formatDateTime(value) {
    return value ? new Date(value).toLocaleString('hu-HU') : '';
}

/** Lower-case and strip accents, so "fiok" matches "Fiók". */
export function normalizeText(text) {
    return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function shopUrl(product) {
    return `https://www.butorkellek.hu/index.php?kod=${encodeURIComponent(product.id)}&modul=termek`;
}
