# rentRpt Apps Script Requirements

Use these requirements to generate or update the Google Apps Script code for the
`rentRpt` project. The project is synced with Google Apps Script using `clasp`
and must run inside the Google Apps Script V8 runtime.

## Runtime and Platform

- This is a Google Apps Script project for Google Sheets.
- Keep the code compatible with Google Apps Script V8 runtime.
- Do not use Node.js-only libraries or browser-only APIs.
- Use Apps Script services such as `SpreadsheetApp`, `DriveApp`, `GmailApp`,
  `UrlFetchApp`, `Utilities`, `Logger`, `ScriptApp`, and `Session`.

## Required Constants

Define clear constants at the top of the main script file:

- `TEMPLATE_SHEET_NAME`
- `TEMP_SHEET_NAME`
- `PAYMENT_DATE_CELL`
- `RECIPIENT_EMAIL_CELL`
- `DRIVE_FOLDER_ID`

Project-specific values:

- `DRIVE_FOLDER_ID`: `1zvcWrweChv892f9_f9jsTdDV8IcjeWNP`
- `PAYMENT_DATE_CELL`: `A5`
- Recipient email: `rentreporting@propertymanagercloud.com`
- Email subject: `Rent Report for 40736 Robin St, Fremont, CA`
- PDF file name pattern: `yyyyMMdd_RentRpt.pdf`

Email body must be plain text formatted with line breaks:

```text
Hi:

Attached is my tenant's rent report.
The rent is paid on time.

Thank you.

-Kenny
```

## Google Sheets Menu

- Add an `onOpen()` function.
- Create a custom Google Sheets menu named for the current month in `yyMM`
  format.
- Example: in May 2026, the menu name is `2605`.
- The menu must include one item:
  - Item label: `Generate Rent PDF and Email`
  - Handler function: generate the rent PDF and draft email.

## Month Sheet Workflow

When the user clicks `Generate Rent PDF and Email`:

1. Determine today's date using the spreadsheet timezone.
2. Determine the current month sheet name in `yyMM` format.
   - Example: May 2026 is `2605`.
3. Determine the previous month sheet name in `yyMM` format.
   - Example: if today is in May 2026, previous month is `2604`.
4. If the current month sheet already exists:
   - Activate/switch to that sheet.
   - Show a user alert saying the sheet already exists.
   - Stop the process without creating another PDF or draft email.
5. If the previous month sheet does not exist:
   - Show a clear error alert.
   - Log the error.
   - Throw the error.
6. Copy the previous month sheet into a new sheet.
7. Rename the copied sheet to the current month sheet name.
8. Activate/switch to the new current month sheet.
9. Update `PAYMENT_DATE_CELL` in the current month sheet to today's date.
10. Flush spreadsheet changes before exporting.

## PDF Export

- Export only the current month sheet as a PDF.
- The export must use the single-sheet `gid`.
- Use the active spreadsheet ID and target sheet ID.
- Use `ScriptApp.getOAuthToken()` with `UrlFetchApp.fetch()` to export from:
  `https://docs.google.com/spreadsheets/d/{spreadsheetId}/export?...`
- Suggested PDF export options:
  - `format=pdf`
  - `portrait=true`
  - `size=letter`
  - `fitw=true`
  - `sheetnames=false`
  - `printtitle=false`
  - `pagenumbers=false`
  - `gridlines=false`
  - `fzr=false`
- Name the PDF using `yyyyMMdd_RentRpt.pdf`.

## Drive Save

- Save the generated PDF into the Drive folder with ID:
  `1zvcWrweChv892f9_f9jsTdDV8IcjeWNP`.
- Log the saved file ID and URL.

## Gmail Draft

- Create a Gmail draft, do not send the email automatically.
- Use `GmailApp.createDraft()`.
- To: `rentreporting@propertymanagercloud.com`
- Subject: `Rent Report for 40736 Robin St, Fremont, CA`
- Body: use the plain text body specified above.
- Attach the generated PDF.

## Logging and Error Handling

- Add `Logger.log()` tracing throughout the process so errors and status can be
  reviewed in Apps Script Executions.
- Prefix logs with `[rentRpt]`.
- Log at least:
  - Menu creation.
  - Process start.
  - Spreadsheet ID.
  - Spreadsheet timezone.
  - Previous and current month sheet names.
  - Existing current month sheet detection.
  - Previous sheet lookup.
  - Sheet copy and rename.
  - Payment date update.
  - PDF export start and response code.
  - Drive save file ID and URL.
  - Gmail draft creation.
  - Process success.
  - Error message and stack trace when available.
- Wrap the main generation function in `try/catch`.
- In `catch`, show the user a clear alert and rethrow the error after logging.

## Deployment

- After code changes, run a syntax check if possible.
- Push Apps Script changes with `clasp push`.
- Commit project changes to Git and push to GitHub.
