import { expect } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';
import { standardUser } from '../data/users';
import { LoginFlow } from '../flows/login.flow';
import { LoginPage } from '../pages/login.page';

const { Given, When, Then } = createBdd();

Given('User is on the login page', async ({ page }) => {
  const loginFlow = new LoginFlow(page);
  await loginFlow.open();
});

Given('User is logged in with valid credentials', async ({ page }) => {
  const loginFlow = new LoginFlow(page);
  await loginFlow.login(standardUser);
  await expect(page.getByText('Products', { exact: true })).toBeVisible();
});

When(
  'User attempts to login with the following credentials',
  async ({ page }, table: DataTable) => {
    // Scenario Outline sustituye los ejemplos antes de entregar la tabla al step.
    expect(table.raw()[0]).toEqual(['username', 'password']);
    const rows = table.hashes();
    expect(rows).toHaveLength(1);
    const credentials = rows[0];
    const loginFlow = new LoginFlow(page);
    await loginFlow.submitCredentials({
      username: credentials.username,
      password: credentials.password,
    });
  },
);

Then(
  'he should be presented with the error message',
  async ({ page }, table: DataTable) => {
    expect(table.raw()[0]).toEqual(['message']);
    const rows = table.hashes();
    expect(rows).toHaveLength(1);
    await expect(new LoginPage(page).errorMessage()).toHaveText(rows[0].message);
  },
);

Then('User can see the products', async ({ page }) => {
  await expect(page.getByText('Products', { exact: true })).toBeVisible();
});
