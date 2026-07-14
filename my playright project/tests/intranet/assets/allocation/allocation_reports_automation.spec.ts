import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { AssetAllocationReportsPage } from '../../pages/assets/AssetAllocationReportsPage';
import { processAllocationReportCsv } from '../../utils/allocation_report_filter';
import { processPidWiseAssetCostReportCsv } from '../../utils/pid_wise_asset_cost_report_filter';

// Data-driven: both automations download a report and process its CSV, differing
// only by which report is downloaded and which processor is applied.
interface ProcessedReport {
  totalRows: number;
  filteredRows: number;
  filteredPath: string;
}

const reports: Array<{
  name: string;
  download: (p: AssetAllocationReportsPage, dir: string) => Promise<string>;
  process: (filePath: string) => ProcessedReport;
}> = [
  {
    name: 'allocation report',
    download: (p, dir) => p.downloadAllocationReport(dir),
    process: processAllocationReportCsv,
  },
  {
    name: 'pid-wise asset cost report',
    download: (p, dir) => p.downloadPidWiseAssetCostReport(dir),
    process: processPidWiseAssetCostReportCsv,
  },
];

for (const report of reports) {
  test(`${report.name} automation - download and process csv`, async ({ page }) => {
    const reportsPage = new AssetAllocationReportsPage(page);
    await reportsPage.loginAs('hr');
    await reportsPage.navigateTo();
    await reportsPage.clickDownloadIcon();

    const downloadDir = path.resolve(__dirname, '../../downloads');
    const filePath = await report.download(reportsPage, downloadDir);
    expect(fs.existsSync(filePath)).toBe(true);

    const processed = report.process(filePath);
    console.log(
      `${report.name} saved: ${filePath}. Filtered rows: ${processed.filteredRows}/${processed.totalRows}. Filtered file: ${processed.filteredPath}`
    );
    expect(fs.existsSync(processed.filteredPath)).toBe(true);
  });
}
