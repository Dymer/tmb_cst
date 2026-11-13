const CURRENCY_FORMAT = '#,##0 "Ft"';

function localDate(separator) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join(separator);
}

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export default async function generateExcel(data) {
    const ExcelJS = require('exceljs');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Árajánlat');

    // Az ajánlat neve a tetején, A-G oszlop összevonva
    const titleRow = worksheet.addRow([data.name]);
    titleRow.font = {bold: true, size: 16};
    titleRow.alignment = {horizontal: 'center'};
    worksheet.mergeCells('A1:G2');
    worksheet.addRow([]); // Üres sor

    // Fejléc beállítása félkövérrel, szürke háttérrel
    const headerRow = worksheet.addRow(['Megnevezés', 'Mennyiség', '', 'Egységár (Ft)', 'Ár (Ft)']);
    headerRow.alignment = {horizontal: 'center'};
    headerRow.font = {bold: true};
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: 'FFD3D3D3'}
        };
    });

    const startRow = worksheet.rowCount + 1;
    data.groups.forEach(group => {
        worksheet.addRow([]); // Üres sor
        const groupRow = worksheet.addRow([group.name]);
        groupRow.font = {bold: true};

        group.items.forEach(item => {
            const quantity = toNumber(item.quantity);
            const price = toNumber(item.price);
            const rowNumber = worksheet.rowCount + 1;
            const row = worksheet.addRow([
                item.name,
                quantity,
                item.unit,
                price,
                {formula: `B${rowNumber}*D${rowNumber}`, result: quantity * price}
            ]);
            row.getCell(4).numFmt = CURRENCY_FORMAT;
            row.getCell(5).numFmt = CURRENCY_FORMAT;
        });
    });
    const endRow = worksheet.rowCount;

    const subtotal = data.groups.reduce((sum, group) =>
        sum + group.items.reduce((gSum, item) => gSum + toNumber(item.price) * toNumber(item.quantity), 0), 0);
    const workFeeRatio = toNumber(data.workFeePercentage) / 100;
    const workFee = subtotal * workFeeRatio;

    const sumRow = worksheet.addRow(["Összesen:", "", "", "", {
        formula: endRow >= startRow ? `SUM(E${startRow}:E${endRow})` : '0',
        result: subtotal
    }]);
    sumRow.font = {bold: true};
    sumRow.getCell(5).numFmt = CURRENCY_FORMAT;

    worksheet.addRow([" "]); // Üres sor
    const workFeeRow = worksheet.addRow([`Munkadíj (${toNumber(data.workFeePercentage)}%):`, "", "", "", {
        formula: `E${sumRow.number}*${workFeeRatio}`,
        result: workFee
    }]);
    workFeeRow.font = {bold: true};
    workFeeRow.getCell(5).numFmt = CURRENCY_FORMAT;

    worksheet.addRow([" "]); // Üres sor

    // Végösszeg = összesen + munkadíj
    const totalRow = worksheet.addRow(["", "", "", "Végösszeg", {
        formula: `E${sumRow.number}+E${workFeeRow.number}`,
        result: subtotal + workFee
    }]);
    totalRow.getCell(5).numFmt = CURRENCY_FORMAT;
    totalRow.font = {bold: true, size: 14};

    worksheet.addRow([" "]); // Üres sor

    // Megjegyzés: A-G összevonva, középre igazítva, sortöréssel
    const commentRow = worksheet.addRow([data.comment]);
    worksheet.mergeCells(`A${commentRow.number}:G${commentRow.number}`);
    commentRow.getCell(1).alignment = {horizontal: 'center', vertical: 'top', wrapText: true};
    commentRow.height = 120;

    worksheet.addRow([" "]); // Üres sor
    worksheet.addRow([" "]); // Üres sor

    worksheet.addRow(["Árajánlatot készítette: Hegedűs Ákos"]);
    worksheet.addRow(["Dátum: " + localDate(".")]);
    worksheet.addRow([" "]); // Üres sor
    worksheet.addRow(["Várom a válaszotokat!"]);

    // Oszlopok szélességének beállítása
    worksheet.columns = [
        {width: 40},
        {width: 10},
        {width: 8},
        {width: 15},
        {width: 15}
    ];

    // Fájl mentése
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arajanlat_${localDate("-")}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
