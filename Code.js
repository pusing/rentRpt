const TEMPLATE_SHEET_NAME = 'Payment Template';
const TEMP_SHEET_NAME = 'Payment PDF';
const PAYMENT_DATE_CELL = 'B5';
const RECIPIENT_EMAIL_CELL = 'B10';
const DRIVE_FOLDER_ID = '1zvcWrweChv892f9_f9jsTdDV8IcjeWNP';

const RENT_REPORT_RECIPIENT_EMAIL = 'rentreporting@propertymanagercloud.com';
const RENT_REPORT_SUBJECT = 'Rent Report for 40736 Robin St, Fremont, CA';
const RENT_REPORT_BODY = "Hi:\n\nAttached is my tenant's rent report.\nThe rent is paid on time.\n\nThank you.\n\n-Kenny";

function onOpen() {
  const menuName = getCurrentMonthSheetName_();
  logStatus_('Creating custom menu: ' + menuName);

  SpreadsheetApp.getUi()
    .createMenu(menuName)
    .addItem('Generate Rent PDF and Email', 'generateRentPdfAndEmail')
    .addToUi();

  logStatus_('Custom menu created.');
}

function generateRentPdfAndEmail() {
  const ui = SpreadsheetApp.getUi();
  logStatus_('Generate rent PDF and email process started.');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const today = new Date();
    const timeZone = ss.getSpreadsheetTimeZone();
    const currentMonthSheetName = getCurrentMonthSheetName_(today, timeZone);
    const previousMonthSheetName = getPreviousMonthSheetName_(today, timeZone);

    logStatus_('Spreadsheet ID: ' + ss.getId());
    logStatus_('Spreadsheet timezone: ' + timeZone);
    logStatus_('Previous month sheet name: ' + previousMonthSheetName);
    logStatus_('Current month sheet name: ' + currentMonthSheetName);

    logStatus_('Checking whether current month sheet already exists.');
    const existingCurrentMonthSheet = ss.getSheetByName(currentMonthSheetName);
    if (existingCurrentMonthSheet) {
      ss.setActiveSheet(existingCurrentMonthSheet);
      logStatus_('Sheet ' + currentMonthSheetName + ' already exists. Activated existing sheet and stopped process.');
      ui.alert('Sheet ' + currentMonthSheetName + ' already exists.');
      return;
    }

    logStatus_('Looking for previous month sheet: ' + previousMonthSheetName);
    const previousMonthSheet = ss.getSheetByName(previousMonthSheetName);
    if (!previousMonthSheet) {
      throw new Error('Previous month sheet not found: ' + previousMonthSheetName);
    }
    logStatus_('Previous month sheet found.');

    logStatus_('Copying ' + previousMonthSheetName + ' to new sheet ' + currentMonthSheetName + '.');
    const currentMonthSheet = previousMonthSheet.copyTo(ss);
    currentMonthSheet.setName(currentMonthSheetName);
    ss.setActiveSheet(currentMonthSheet);
    logStatus_('New current month sheet created and activated.');

    logStatus_('Updating payment date cell ' + PAYMENT_DATE_CELL + ' to today.');
    currentMonthSheet.getRange(PAYMENT_DATE_CELL).setValue(today);
    SpreadsheetApp.flush();
    logStatus_('Payment date updated.');

    const fileName = Utilities.formatDate(today, timeZone, 'yyyyMMdd') + '_RentRpt.pdf';
    logStatus_('Exporting sheet ' + currentMonthSheetName + ' as PDF: ' + fileName);
    const pdfBlob = exportSingleSheetAsPdf_(ss, currentMonthSheet).setName(fileName);
    logStatus_('PDF export completed. Blob content type: ' + pdfBlob.getContentType());

    logStatus_('Saving PDF to Drive folder: ' + DRIVE_FOLDER_ID);
    const pdfFile = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(pdfBlob);
    logStatus_('PDF saved. File ID: ' + pdfFile.getId() + ', URL: ' + pdfFile.getUrl());

    logStatus_('Creating Gmail draft to: ' + RENT_REPORT_RECIPIENT_EMAIL);
    GmailApp.createDraft(RENT_REPORT_RECIPIENT_EMAIL, RENT_REPORT_SUBJECT, RENT_REPORT_BODY, {
      attachments: [pdfFile.getBlob()]
    });
    logStatus_('Gmail draft created.');

    logStatus_('Generate rent PDF and email process completed successfully.');
    ui.alert('Sheet ' + currentMonthSheetName + ' created. PDF saved and draft email created.');
  } catch (error) {
    logStatus_('ERROR: ' + error.message);
    if (error.stack) {
      logStatus_('ERROR STACK: ' + error.stack);
    }
    ui.alert('Unable to generate rent PDF and draft email: ' + error.message);
    throw error;
  }
}

function exportSingleSheetAsPdf_(spreadsheet, sheet) {
  const spreadsheetId = spreadsheet.getId();
  const sheetId = sheet.getSheetId();

  logStatus_('Building PDF export URL for sheet ID: ' + sheetId);
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

  logStatus_('Getting OAuth token for PDF export.');
  const token = ScriptApp.getOAuthToken();

  logStatus_('Fetching PDF export from Google Sheets.');
  const response = UrlFetchApp.fetch(exportUrl, {
    headers: {
      Authorization: 'Bearer ' + token
    }
  });
  logStatus_('PDF fetch response code: ' + response.getResponseCode());

  return response.getBlob().setName(sheet.getName() + '.pdf');
}

function getCurrentMonthSheetName_(date, timeZone) {
  return getMonthSheetName_(date || new Date(), timeZone || Session.getScriptTimeZone());
}

function getPreviousMonthSheetName_(date, timeZone) {
  const targetDate = date || new Date();
  const previousMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1);
  return getMonthSheetName_(previousMonthDate, timeZone || Session.getScriptTimeZone());
}

function getMonthSheetName_(date, timeZone) {
  return Utilities.formatDate(date, timeZone, 'yyMM');
}

function logStatus_(message) {
  Logger.log('[rentRpt] ' + message);
}
