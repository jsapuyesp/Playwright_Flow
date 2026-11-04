import { Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  product(productName: string) {
    return this.page
      .locator('[data-test="inventory-item-name"]')
      .getByText(productName, { exact: true });
  }

  async checkout(): Promise<void> {
    await this.page.locator('[data-test="checkout"]').click();
  }
}
