import {describe, expect, it} from 'vitest'
import {formatPrice, lineTotal, normalizeText, quoteTotals, shopUrl, toNumber} from '../src/renderer/quoteUtils'

const nbspToSpace = s => s.replace(/[  ]/g, ' ');

describe('toNumber', () => {
    it.each([
        [5, 5], ['12', 12], ['', 0], [null, 0], [undefined, 0], ['abc', 0], [NaN, 0], [Infinity, 0],
    ])('%j -> %j', (input, expected) => {
        expect(toNumber(input)).toBe(expected);
    });
});

describe('lineTotal / quoteTotals', () => {
    it('multiplies price and quantity, tolerating text and empty inputs', () => {
        expect(lineTotal({price: 1200, quantity: 2})).toBe(2400);
        expect(lineTotal({price: '500', quantity: '3'})).toBe(1500);
        expect(lineTotal({price: 500, quantity: ''})).toBe(0);
    });

    it('adds up all groups and the work fee', () => {
        const quote = {
            workFeePercentage: 40,
            groups: [
                {items: [{price: 1200, quantity: 2}, {price: 5000, quantity: 3, custom: true}]},
                {items: []},
                {items: [{price: 100, quantity: 1}]},
            ],
        };
        expect(quoteTotals(quote)).toEqual({subtotal: 17500, workFee: 7000, total: 24500});
    });

    it('accepts the work fee percentage as text and handles a missing quote', () => {
        expect(quoteTotals({workFeePercentage: '10', groups: [{items: [{price: 100, quantity: 1}]}]}).total).toBe(110);
        expect(quoteTotals(null)).toEqual({subtotal: 0, workFee: 0, total: 0});
    });
});

describe('formatPrice', () => {
    it('formats forints without decimals', () => {
        expect(nbspToSpace(formatPrice(24360))).toBe('24 360 Ft');
        expect(nbspToSpace(formatPrice(1234.6))).toBe('1235 Ft');
        expect(nbspToSpace(formatPrice('abc'))).toBe('0 Ft');
    });
});

describe('normalizeText', () => {
    it('removes accents and lower-cases, so searches work without accents', () => {
        expect(normalizeText('Fiók SÍN Ő ű')).toBe('fiok sin o u');
        expect(normalizeText(null)).toBe('');
    });
});

describe('shopUrl', () => {
    it('links to the product page in the webshop', () => {
        expect(shopUrl({id: '1354'})).toBe('https://www.butorkellek.hu/index.php?kod=1354&modul=termek');
    });
});
