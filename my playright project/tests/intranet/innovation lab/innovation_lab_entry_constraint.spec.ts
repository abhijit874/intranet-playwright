import { test, expect } from '@playwright/test';
import { InnovationLabPage } from '../pages/InnovationLabPage';
import { FutureAvailabilityPage } from '../pages/FutureAvailabilityPage';
import { dataTableSearchBox } from '../utils/test_helpers';

// Business rule under test:
//   In the Innovation Lab tab, an employee can have only ONE entry — regardless of which project
//   they are allocated to. Duplicate entries for the same employee are not allowed.
// The employee is read from the Innovation Lab table itself rather than hardcoded.

test.describe('Innovation Lab - one entry per employee', () => {

  test('employee appears exactly once in the Innovation Lab tab', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await innovationLabPage.navigateTo();
    const { employee } = await innovationLabPage.getFirstInnovationLabEntry();
    await innovationLabPage.searchEmployee(employee);

    const employeeRows = page.locator('table tbody tr')
      .filter({ hasText: employee });

    await expect(employeeRows).toHaveCount(1);
  });

  test('add-to-Innovation-Lab icon is absent in Future Availability for an employee already in Innovation Lab', async ({ page }) => {
    const innovationLabPage = new InnovationLabPage(page);
    await innovationLabPage.loginAs('admin');
    await innovationLabPage.navigateTo();
    // Everyone who is definitely in the Innovation Lab already.
    const employees = await innovationLabPage.getInnovationLabEmployees();

    const futureAvailabilityPage = new FutureAvailabilityPage(page);
    await futureAvailabilityPage.navigateToFutureAvailability();
    const searchBox = dataTableSearchBox(page);

    // Not everyone in the Innovation Lab also has an upcoming release row, so
    // work through the list until one of them turns up in Future Availability.
    let checked: string | undefined;
    for (const employee of employees) {
      await searchBox.fill(employee);
      await searchBox.press('Enter');
      await page.waitForTimeout(1000);

      const row = page.locator('table tbody tr').filter({ hasText: employee }).first();
      if (!(await row.count())) continue;

      // Employee is already in Innovation Lab — system must not allow adding them again
      await expect(row.locator('i.text-success.ri-user-add-fill')).toHaveCount(0);
      checked = employee;
      break;
    }

    if (!checked) {
      throw new Error(
        `None of the ${employees.length} Innovation Lab employees appear in Future Availability, ` +
          'so the constraint could not be verified.'
      );
    }
  });

});
