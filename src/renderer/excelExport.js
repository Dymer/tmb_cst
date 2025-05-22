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
    //center the text
    headerRow.alignment = {horizontal: 'center'};
    headerRow.font = {bold: true};
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: 'D3D3D3'}
        };
    });

    let startRow = worksheet.rowCount + 1;
    data.groups.forEach(group => {
        worksheet.addRow([]); // Üres sor
        const groupRow = worksheet.addRow([group.name]);
        groupRow.font = {bold: true};

        group.items.forEach(item => {
            worksheet.addRow([item.name, item.quantity, item.unit, item.price, {formula: `B${worksheet.rowCount + 1}*D${worksheet.rowCount + 1}`}]);
        });
    });

    const sumRow = worksheet.addRow(["", "", "", "", {formula: `SUM(E${startRow}:E${worksheet.rowCount})`}]);
    sumRow.font = {bold: true};
    worksheet.addRow([" "]); // Üres sor
    const workFeeRow = worksheet.addRow(["Munkadíj:", "", "", "", {formula: `E${worksheet.rowCount - 1}*${data.workFeePercentage / 100}`}]);
    workFeeRow.font = {bold: true};

    worksheet.addRow([" "]); // Üres sor

    //sum of sumROw and workfeerow
    const totalRow = worksheet.addRow(["", "", "", "Végösszeg", {formula: `SUM(E${worksheet.rowCount - 2}:E${worksheet.rowCount})`}]);
    //set currency to ft
    worksheet.getCell(`E${worksheet.rowCount}`).numFmt = '#,##0 "Ft"';
    totalRow.font = {bold: true, size: '14pt'};

    worksheet.addRow([" "]); // Üres sor
    //from A to G merge cells and set the text to center and set height to see the text
    worksheet.mergeCells(`A${worksheet.rowCount}:G${worksheet.rowCount}`);
    worksheet.getCell(`A${worksheet.rowCount}`).alignment = {horizontal: 'center'}
    worksheet.getRow(worksheet.rowCount).height = 120;
    worksheet.getCell(`A${worksheet.rowCount}`).alignment.wrapText = true;
    worksheet.getCell(`A${worksheet.rowCount}`).value = data.comment


    worksheet.addRow([" "]); // Üres sor
    worksheet.addRow([" "]); // Üres sor

    worksheet.addRow(["Árajánlatot készítette: Hegedűs Ákos"]);
    /// yyyy-mm-dd
    worksheet.addRow(["Dátum: " + new Date().toISOString().split('T')[0].replaceAll("-", ".")]);
    worksheet.addRow([" "]); // Üres sor
    worksheet.addRow(["Várom a válaszotokat!"]);


    // Oszlopok szélességének beállítása
    worksheet.columns = [
        {width: 40},
        {width: 10},
        {width: 5},
        {width: 15},
        {width: 15}
    ];

    // Fájl mentése
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    //date
    const date = new Date().toISOString().split('T')[0];
    link.download = `arajanlat_${date}.xlsx`;
    link.click();
}
