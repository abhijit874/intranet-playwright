import { processCsvReport } from './csv_report_filter';

export function processActivityReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'ACTIVITY_REPORT',
    fallbackPrefixes: ['REPORT'],
    defaultDateField: 'Activity Date',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
