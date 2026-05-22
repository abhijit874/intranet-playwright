import { processCsvReport } from './csv_report_filter';

export function processProjectReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'PROJECT_REPORT',
    fallbackPrefixes: ['REPORT'],
    defaultDateField: 'Start Date',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
