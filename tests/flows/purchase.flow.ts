import { Page } from '@playwright/test';
import { CheckoutCustomer } from '../data/checkout';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { InventoryPage } from '../pages/inventory.page';

export class PurchaseFlow {
  readonly cartPage: CartPage;
  readonly checkoutPage: CheckoutPage;
  private readonly inventoryPage: InventoryPage;

  constructor(page: Page) {
    this.inventoryPage = new InventoryPage(page);
    this.cartPage = new CartPage(page);
    this.checkoutPage = new CheckoutPage(page);
  }

  async addProductToCart(
    productName: string,
  ): Promise<void> {
    // La autenticacion es una precondicion, no se repite por cada producto.
    await this.inventoryPage.addProductToCart(productName);
    await this.inventoryPage.openCart();
  }

  async completeCheckout(customer: CheckoutCustomer): Promise<void> {
    await this.cartPage.checkout();
    await this.checkoutPage.fillCustomer(customer);
    await this.checkoutPage.continue();
    await this.checkoutPage.finish();
  }
}
