import { processCsvReport } from './csv_report_filter';

export function processPidWiseAssetCostReportCsv(downloadedFilePath: string) {
  return processCsvReport(downloadedFilePath, {
    prefix: 'PID_WISE_ASSET_COST_REPORT',
    fallbackPrefixes: ['ASSET_COST_REPORT', 'REPORT'],
    defaultDateField: '',
    outputSubdir: 'filtered',
    outputSuffix: 'filtered',
  });
}
