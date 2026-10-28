import { SubscriptionInput, SubscriptionsPage } from '../pages/SubscriptionsPage';
import { futureDateValue } from '../utils/test_helpers';

// Every spec that needs a subscription creates its own (self-contained — no
// dependency on a pre-seeded record). The name is the list's search key and the
// seed of the auto-generated license IDs, so it must be unique per run.
export function uniqueSubscriptionName(prefix = 'PW-Sub'): string {
  return `${prefix}-${Date.now()}`;
}

export interface CreatedSubscription extends Required<Pick<SubscriptionInput, 'name'>> {
  id: number;
  input: SubscriptionInput;
}

// Opens the Add form from the inventory list, fills it, saves, and looks up the
// new id in the list (create redirects to the list, not the detail page). Defaults to a
// 2-seat Organization subscription billed monthly in USD by credit card.
export async function createSubscription(
  subs: SubscriptionsPage,
  overrides: Partial<SubscriptionInput> = {}
): Promise<CreatedSubscription> {
  const input: SubscriptionInput = {
    name: uniqueSubscriptionName(),
    category: 'Development',
    licenseType: 'Organization',
    totalLicenses: 2,
    billingFrequency: 'Monthly',
    currency: 'USD',
    spendAmount: 10,
    paymentMode: 'Credit Card',
    cardHolder: 'Playwright Tester',
    cardLast4: '4242',
    renewalDate: futureDateValue(30),
    ...overrides,
  };
  await subs.navigateToInventory();
  await subs.clickAddSubscription();
  await subs.fillForm(input);
  await subs.submitCreate();
  await subs.assertSaved('Created');
  const id = await subs.idOf(input.name);
  return { id, name: input.name, input };
}
