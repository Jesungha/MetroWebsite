const fs = require('fs');
const path = require('path');

// Read the input CSV file
fs.readFile(path.join(__dirname, 'uploads', 'SalesDetailReport_6ZC156BSO.csv'), 'utf8', (err, allText) => {
    if (err) {
        return console.error('Error reading file:', err);
    }

    // Split the file content into lines
    const allTextLines = allText.split(/\r\n|\n/);
    const headers = allTextLines[0].split(',');
    const lines = [];
    const requiredHeaders = ['itmdesc', 'armastiid', 'acttype', 'adddate'];
    const idx = [];

    // Find indexes of required headers
    for (let i = 0; i < headers.length; i++) {
        if (requiredHeaders.includes(headers[i].trim())) {
            idx.push(i);
        }
    }

    // Process each line
    for (let i = 1; i < allTextLines.length; i++) {
        const data = allTextLines[i].split(',');
        if (data.length === headers.length) {
            const tarr = [];
            for (let j = 0; j < headers.length; j++) {
                if (idx.includes(j)) {
                    tarr.push(data[j].trim());
                }
            }
            lines.push(tarr);
        }
    }

    // Convert the lines array into CSV format
    const csvContent = lines.map(row => row.join(',')).join('\n');
    
    // Write to the new CSV file
    fs.writeFile(path.join(__dirname, 'uploads', 'test.csv'), csvContent, (err) => {
        if (err) {
            return console.error('Error writing file:', err);
        }
        console.log('File has been created');
    });
});
