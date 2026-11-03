import { Page } from '@playwright/test';

export class InventoryPage {
  constructor(private readonly page: Page) {}

  async addProductToCart(productName: string): Promise<void> {
    const product = this.page
      .locator('.inventory_item')
      .filter({ hasText: productName });

    await product.getByRole('button', { name: 'Add to cart' }).click();
  }

  async openCart(): Promise<void> {
    await this.page.locator('[data-test="shopping-cart-link"]').click();
  }
}
