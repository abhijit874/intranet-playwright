import { processCsvReport } from './csv_report_filter';

export function processMaintenanceReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'MAINTENANCE_REPORT',
    fallbackPrefixes: ['REPORT'],
    defaultDateField: 'Given Date',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
