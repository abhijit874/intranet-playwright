import { processCsvReport } from './csv_report_filter';

export function processBepReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'BEP_REPORT',
    fallbackPrefixes: ['REPORT'],
    defaultDateField: 'Activity Date',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
