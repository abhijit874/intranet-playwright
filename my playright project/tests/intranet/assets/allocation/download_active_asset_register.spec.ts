import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { AssetAllocationReportsPage } from '../../pages/assets/AssetAllocationReportsPage';

/**
 * Active Asset Register — the third item in the asset allocations download
 * dropdown, alongside the Asset Allocation Report and the PID-wise Asset Cost
 * Report. Like the PID-wise report it opens a modal with a rolling month
 * picker rather than downloading straight away.
 */
const downloadDir = path.resolve(__dirname, '../../downloads');

test('download active asset register', async ({ page }) => {
  const reportsPage = new AssetAllocationReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();
  await reportsPage.clickDownloadIcon();

  const filePath = await reportsPage.downloadActiveAssetRegister(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);
  expect(fs.statSync(filePath).size).toBeGreaterThan(0);
});

test('download active asset register for a previous month', async ({ page }) => {
  const reportsPage = new AssetAllocationReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();
  await reportsPage.clickDownloadIcon();

  await reportsPage.openActiveAssetRegisterModal();
  // Takes the second option so the assertion does not age out with the calendar.
  const month = await reportsPage.selectActiveAssetRegisterMonth();
  expect(month).toMatch(/^[A-Z][a-z]{2}-\d{4}$/);

  const filePath = await reportsPage.downloadFromActiveAssetRegisterModal(downloadDir);
  expect(fs.existsSync(filePath)).toBe(true);
});

test('the download dropdown offers all three allocation reports', async ({ page }) => {
  const reportsPage = new AssetAllocationReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();
  await reportsPage.clickDownloadIcon();

  const items = page.locator('a.dropdown-item');
  await expect(items.filter({ hasText: 'Asset Allocation Report' })).toHaveCount(1);
  await expect(items.filter({ hasText: 'PID-wise Asset Cost Report' })).toHaveCount(1);
  await expect(items.filter({ hasText: 'Active Asset Register' })).toHaveCount(1);
});

test('the Active Asset Register modal carries a month picker and a Download action', async ({ page }) => {
  const reportsPage = new AssetAllocationReportsPage(page);
  await reportsPage.loginAs('hr');
  await reportsPage.navigateTo();
  await reportsPage.clickDownloadIcon();

  const modal = await reportsPage.openActiveAssetRegisterModal();
  await expect(modal.locator('.modal-title')).toHaveText('Download Active Asset Register');
  await expect(modal.locator('#activeAssetRegisterReportDate')).toBeVisible();
  // Rolling month list, so assert it is populated rather than pinning a count.
  expect(await modal.locator('#activeAssetRegisterReportDate option').count()).toBeGreaterThan(1);
  await expect(modal.locator('button[type="submit"]', { hasText: 'Download' })).toBeVisible();
});
