function myFunction() {
  
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Payment')
    .addItem('Generate PDF and Email', 'generatePaymentPdfAndEmail')
    .addToUi();
}

function generatePaymentPdfAndEmail() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Change these names to match your file
  const templateSheetName = 'Payment Template';
  const outputSheetName = 'Payment PDF';
  const folderId = 'PUT_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';

  // Change these cells to match your sheet
  const paymentDateCell = 'B5';
  const emailToCell = 'B10';

  const template = ss.getSheetByName(templateSheetName);
  if (!template) {
    throw new Error('Template sheet not found: ' + templateSheetName);
  }

  // Remove old output sheet if it exists
  const oldSheet = ss.getSheetByName(outputSheetName);
  if (oldSheet) {
    ss.deleteSheet(oldSheet);
  }

  // Copy template sheet
  const outputSheet = template.copyTo(ss);
  outputSheet.setName(outputSheetName);

  // Modify payment date
  const today = new Date();
  outputSheet.getRange(paymentDateCell).setValue(today);

  // Get recipient email
  const recipient = outputSheet.getRange(emailToCell).getValue();
  if (!recipient) {
    throw new Error('Recipient email is empty.');
  }

  // Export this single sheet as PDF
  const pdfBlob = exportSingleSheetAsPdf_(ss, outputSheet);

  // Save PDF to Drive
  const folder = DriveApp.getFolderById(folderId);
  const fileName = 'Payment_' + Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), 'yyyyMMdd') + '.pdf';
  const pdfFile = folder.createFile(pdfBlob).setName(fileName);

  // Email PDF
  MailApp.sendEmail({
    to: recipient,
    subject: 'Payment PDF - ' + Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), 'MM/dd/yyyy'),
    body: 'Attached is the payment PDF.',
    attachments: [pdfFile.getBlob()]
  });

  SpreadsheetApp.getUi().alert('PDF generated and emailed successfully.');
}

function exportSingleSheetAsPdf_(spreadsheet, sheet) {
  const spreadsheetId = spreadsheet.getId();
  const sheetId = sheet.getSheetId();

  const exportUrl =
    'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?' +
    'format=pdf' +
    '&gid=' + sheetId +
    '&portrait=true' +
    '&size=letter' +
    '&fitw=true' +
    '&sheetnames=false' +
    '&printtitle=false' +
    '&pagenumbers=false' +
    '&gridlines=false' +
    '&fzr=false';

  const token = ScriptApp.getOAuthToken();

  const response = UrlFetchApp.fetch(exportUrl, {
    headers: {
      Authorization: 'Bearer ' + token
    }
  });

  return response.getBlob().setName(sheet.getName() + '.pdf');
}