import { expect } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';
import { PurchaseFlow } from '../flows/purchase.flow';

const { When, Then } = createBdd();

When(
  'User adds {string} to the cart',
  async ({ page }, productName: string) => {
    const purchaseFlow = new PurchaseFlow(page);
    await purchaseFlow.addProductToCart(productName);
  },
);

When(
  'User completes checkout with the following details',
  async ({ page }, table: DataTable) => {
    expect(table.raw()[0]).toEqual(['firstName', 'lastName', 'postalCode']);
    const rows = table.hashes();
    expect(rows).toHaveLength(1);
    const customer = rows[0];
    const purchaseFlow = new PurchaseFlow(page);
    await purchaseFlow.completeCheckout({
      firstName: customer.firstName,
      lastName: customer.lastName,
      postalCode: customer.postalCode,
    });
  },
);

Then(
  'the cart contains {string}',
  async ({ page }, productName: string) => {
    const purchaseFlow = new PurchaseFlow(page);
    await expect(purchaseFlow.cartPage.product(productName)).toBeVisible();
  },
);

Then(
  'he can see finalized his purchase',
  async ({ page }, table: DataTable) => {
    expect(table.raw()).toHaveLength(1);
    expect(table.raw()[0]).toHaveLength(1);
    const purchaseFlow = new PurchaseFlow(page);
    await expect(purchaseFlow.checkoutPage.confirmationMessage()).toHaveText(
      table.raw()[0][0],
    );
  },
);
