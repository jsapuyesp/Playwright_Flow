import { Locator, Page } from '@playwright/test';
import { CheckoutCustomer } from '../data/checkout';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillCustomer(customer: CheckoutCustomer): Promise<void> {
    await this.page.locator('[data-test="firstName"]').fill(customer.firstName);
    await this.page.locator('[data-test="lastName"]').fill(customer.lastName);
    await this.page.locator('[data-test="postalCode"]').fill(customer.postalCode);
  }

  async continue(): Promise<void> {
    await this.page.locator('[data-test="continue"]').click();
  }

  async finish(): Promise<void> {
    await this.page.locator('[data-test="finish"]').click();
  }

  confirmationMessage(): Locator {
    return this.page.locator('[data-test="complete-header"]');
  }
}
