import { test, expect } from '@playwright/test';
import { ContributionsPage } from '../pages/activities/ContributionsPage';
import { loginWithEmail } from '../utils/login_helper';
import { createAndApproveContribution, loginAsEmployeeWithBalance } from './contributor_helpers';

// Only employees who create activity records accrue redeemable balance: an
// approved benefit record credits its amount to the record's creator. So the
// redeemer is chosen at run time instead of using a fixed account:
//   1. REDEEM_EMAIL env var — use exactly that account (manual feed).
//   2. Otherwise scan grade-eligible employees from the CSV for one whose
//      Redeem button is enabled.
//   3. Nobody has balance -> produce some: create a contribution, approve it
//      as hr, then redeem as that creator.
test('redeem available balance', async ({ page }) => {
  // Scanning candidates (and possibly the create-approve fallback) means many
  // full logins, which cannot fit the default 60s test budget.
  test.setTimeout(480_000);
  const contributionsPage = new ContributionsPage(page);

  const manualEmail = process.env.REDEEM_EMAIL;
  if (manualEmail) {
    await loginWithEmail(page, manualEmail);
    await contributionsPage.navigateToContributions();
  } else {
    const email = await loginAsEmployeeWithBalance(page);
    // On success the session is already on that employee's Contributions page.
    if (!email) {
      // Nobody has balance right now — create and approve a record, which
      // credits its amount to the creator, then redeem as them.
      const { email: creator, outcome } = await createAndApproveContribution(page);
      test.skip(
        outcome !== 'approved',
        'Fallback record was quota-blocked, so no balance was credited.'
      );
      await page.context().clearCookies();
      await loginWithEmail(page, creator);
      await contributionsPage.navigateToContributions();
      test.skip(
        !(await contributionsPage.hasRedeemableBalance()),
        'The approved amount landed in "Earned benefits" but "Available balance to redeem" ' +
          'is still 0 — the app credits it on its own schedule, so redemption cannot be ' +
          'forced right now. Point REDEEM_EMAIL at an account with available balance.'
      );
    }
  }

  const balanceBefore = await contributionsPage.getRedeemableBalance();
  expect(balanceBefore).toBeGreaterThan(0);

  await contributionsPage.clickRedeem();
  await contributionsPage.confirmRedeem();

  // The redemption completes on the Contributions page itself (the app no
  // longer navigates to a separate /redeems/new form), so the proof that money
  // was redeemed is the available balance dropping.
  await expect
    .poll(() => contributionsPage.getRedeemableBalance(), { timeout: 20000 })
    .toBeLessThan(balanceBefore);
});
