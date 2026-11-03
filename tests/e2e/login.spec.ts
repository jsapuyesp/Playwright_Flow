import { expect, test } from '@playwright/test';
import { invalidUser, standardUser } from '../data/users';
import { LoginFlow } from '../flows/login.flow';
import { LoginPage } from '../pages/login.page';

test('allows a user to log in with valid credentials', async ({ page }) => {
  // Arrange: el flow usa la pantalla de login y las credenciales de prueba.
  const loginFlow = new LoginFlow(page);

  // Act: navegar a SauceDemo e intentar iniciar sesión.
  await loginFlow.login(standardUser);

  // Assert: el inventario solo aparece cuando el login fue correcto.
  await expect(page.getByText('Products', { exact: true })).toBeVisible();
});

test('shows an error when credentials are invalid', async ({ page }) => {
  // Arrange: se usan credenciales inválidas definidas en data/users.ts.
  const loginFlow = new LoginFlow(page);
  const loginPage = new LoginPage(page);

  // Act: enviar las credenciales inválidas desde la pantalla de login.
  await loginFlow.login(invalidUser);

  // Assert: el mensaje explica por qué no se pudo iniciar sesión.
  await expect(loginPage.errorMessage()).toContainText(
    'Username and password do not match',
  );
});
