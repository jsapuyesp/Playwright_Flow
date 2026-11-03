import { Page } from '@playwright/test';
import { UserCredentials } from '../data/users';
import { CartPage } from '../pages/cart.page';
import { InventoryPage } from '../pages/inventory.page';
import { LoginFlow } from './login.flow';

export class PurchaseFlow {
  readonly cartPage: CartPage;
  private readonly loginFlow: LoginFlow;
  private readonly inventoryPage: InventoryPage;

  constructor(page: Page) {
    this.loginFlow = new LoginFlow(page);
    this.inventoryPage = new InventoryPage(page);
    this.cartPage = new CartPage(page);
  }

  async addProductToCart(
    credentials: UserCredentials,
    productName: string,
  ): Promise<void> {
    await this.loginFlow.login(credentials);
    await this.inventoryPage.addProductToCart(productName);
    await this.inventoryPage.openCart();
  }
}
