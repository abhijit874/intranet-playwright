import { expect, Page } from '@playwright/test';

const USERS = {
  employee: {
    email: process.env.EMPLOYEE_USER_EMAIL ?? '',
    password: process.env.EMPLOYEE_USER_PASSWORD ?? '',
  },
  hr: {
    email: process.env.HR_USER_EMAIL ?? '',
    password: process.env.HR_USER_PASSWORD ?? '',
  },
  admin: {
    email: process.env.ADMIN_USER_EMAIL ?? '',
    password: process.env.ADMIN_USER_PASSWORD ?? '',
  },
  leader: {
    email: process.env.LEADER_USER_EMAIL ?? '',
    password: process.env.LEADER_USER_PASSWORD ?? '',
  },
  sales: {
    email: process.env.SALES_USER_EMAIL ?? '',
    password: process.env.SALES_USER_PASSWORD ?? '',
  },
};

type UserKey = keyof typeof USERS;

export async function login(page: Page, user: UserKey = 'employee') {
  const { email, password } = USERS[user];
  if (!email || !password) {
    throw new Error(
      `Missing credentials for user "${user}". ` +
      'Set the corresponding env vars (e.g. HR_USER_EMAIL / HR_USER_PASSWORD) ' +
      'in your .env file or environment.'
    );
  }
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await expect(page.getByRole('alert')).toHaveText(/signed in successfully/i);
  await expect(page.getByText('Hello,')).toBeVisible();
}
