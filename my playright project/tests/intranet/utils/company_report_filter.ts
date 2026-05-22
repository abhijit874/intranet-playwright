import { processCsvReport } from './csv_report_filter';

export function processCompanyReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'COMPANY_REPORT',
    fallbackPrefixes: ['REPORT'],
    defaultDateField: 'Created At',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
