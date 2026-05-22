import { processCsvReport } from './csv_report_filter';

export function processEmployeeReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'EMPLOYEE_REPORT',
    fallbackPrefixes: ['REPORT'],
    defaultDateField: 'Joining Date',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
