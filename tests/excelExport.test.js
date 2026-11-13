// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import ExcelJS from 'exceljs'
import generateExcel from '../src/renderer/excelExport'

let downloads;

beforeEach(() => {
    downloads = [];
    let lastBlob;
    globalThis.URL.createObjectURL = vi.fn(blob => {
        lastBlob = blob;
        return 'blob:test';
    });
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
        downloads.push({name: this.download, blob: lastBlob});
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

// jsdom's Blob has no arrayBuffer(); FileReader works
function readBlob(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}

async function exportAndRead(data) {
    await generateExcel(data);
    expect(downloads).toHaveLength(1);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await readBlob(downloads[0].blob));
    const sheet = workbook.worksheets[0];
    const rows = [];
    sheet.eachRow((row, number) => rows.push({number, a: row.getCell(1).value, d: row.getCell(4).value, e: row.getCell(5).value}));
    return {sheet, rows, find: label => rows.find(r => r.a === label || r.d === label)};
}

const sample = () => ({
    name: 'Konyha',
    workFeePercentage: '40',
    comment: 'Megjegyzés',
    groups: [
        {name: 'Alapanyag', items: [
            {name: 'Pánt', quantity: 2, unit: 'db', price: 1200},
            {name: 'Lapszabászat', quantity: '3', unit: 'óra', price: '5000', custom: true},
        ]},
        {name: 'Üres csoport', items: []},
        {name: 'Fogantyúk', items: [{name: 'Fogantyú', quantity: 4, unit: 'db', price: 100}]},
    ],
});

describe('generateExcel', () => {
    it('downloads an .xlsx named after today', async () => {
        await exportAndRead(sample());
        expect(downloads[0].name).toMatch(/^arajanlat_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('writes one formula row per item with the right cached result', async () => {
        const {find} = await exportAndRead(sample());
        const pant = find('Pánt');
        expect(pant.e).toMatchObject({formula: `B${pant.number}*D${pant.number}`, result: 2400});
        expect(find('Lapszabászat').e.result).toBe(15000);
        expect(find('Fogantyú').e.result).toBe(400);
    });

    it('subtotal covers all items, the grand total adds subtotal and work fee', async () => {
        const {find} = await exportAndRead(sample());
        const sum = find('Összesen:');
        const fee = find('Munkadíj (40%):');
        const total = find('Végösszeg');

        expect(sum.e.result).toBe(17800);
        expect(sum.e.formula).toMatch(/^SUM\(E\d+:E\d+\)$/);
        expect(fee.e).toMatchObject({formula: `E${sum.number}*0.4`, result: 7120});
        expect(total.e).toMatchObject({formula: `E${sum.number}+E${fee.number}`, result: 24920});
    });

    it('the SUM range spans exactly the item rows', async () => {
        const {find} = await exportAndRead(sample());
        const [, from, to] = find('Összesen:').e.formula.match(/E(\d+):E(\d+)/).map(Number);
        expect(from).toBeLessThanOrEqual(find('Pánt').number);
        expect(to).toBe(find('Fogantyú').number);
        expect(to).toBeLessThan(find('Összesen:').number);
    });

    it('handles a quote without any items', async () => {
        const {find} = await exportAndRead({name: '', workFeePercentage: 40, comment: '', groups: []});
        // ExcelJS does not store a cached result of 0; Excel recalculates on open
        expect(find('Összesen:').e.formula).toBe('0');
        expect(find('Végösszeg').e.result ?? 0).toBe(0);
    });

    it('treats invalid numbers as zero instead of producing NaN', async () => {
        const {find} = await exportAndRead({
            name: 'x', workFeePercentage: '', comment: '',
            groups: [{name: 'g', items: [{name: 'Hibás', quantity: '', unit: 'db', price: 'abc'}]}],
        });
        expect(find('Hibás').e.result ?? 0).toBe(0);
        expect(find('Végösszeg').e.result ?? 0).toBe(0);
    });
});
