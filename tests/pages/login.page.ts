import { Locator, Page } from '@playwright/test';
import { UserCredentials } from '../data/users';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async login(credentials: UserCredentials): Promise<void> {
    await this.page.locator('[data-test="username"]').fill(credentials.username);
    await this.page.locator('[data-test="password"]').fill(credentials.password);
    await this.page.locator('[data-test="login-button"]').click();
  }

  errorMessage(): Locator {
    return this.page.locator('[data-test="error"]');
  }
}
