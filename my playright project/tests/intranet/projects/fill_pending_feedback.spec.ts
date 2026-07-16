import { test } from '@playwright/test';
import { PendingFeedbackPage } from '../pages/PendingFeedbackPage';

// Automates the Projects -> Pending Feedback flow: opens the first available
// pending feedback record (found via the table, not a hardcoded employee), fills
// the employee's performance feedback form — selects a rating and fills the
// free-text fields with random text — and submits.
//
// Because it picks whatever pending feedback currently exists, it stays
// re-runnable (submitting one just removes it and the next becomes first).
test('fill pending feedback form', async ({ page }) => {
  const fb = new PendingFeedbackPage(page);
  await fb.loginAs('hr');
  await fb.navigateToPendingFeedback();
  const employee = await fb.openFirstPendingFeedback();
  console.log(`Filling pending feedback for: ${employee}`);
  await fb.fillFeedbackForm();
  await fb.submit();
  await fb.assertSubmitted();
});
