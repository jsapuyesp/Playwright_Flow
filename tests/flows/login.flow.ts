import { Page } from '@playwright/test';
import { UserCredentials } from '../data/users';
import { LoginPage } from '../pages/login.page';

export class LoginFlow {
  private readonly loginPage: LoginPage;

  constructor(page: Page) {
    this.loginPage = new LoginPage(page);
  }

  async login(credentials: UserCredentials): Promise<void> {
    await this.loginPage.open();
    await this.loginPage.login(credentials);
  }
}
