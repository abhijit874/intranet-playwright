import { processCsvReport } from './csv_report_filter';

export function processAllocationReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'ALLOCATION_REPORT',
    fallbackPrefixes: ['REPORT'],
    defaultDateField: 'Allocation Date',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
