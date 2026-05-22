import { processCsvReport } from './csv_report_filter';

export function processInventoryReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'INVENTORY_REPORT',
    fallbackPrefixes: ['REPORT'],
    defaultDateField: 'Received Date',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
