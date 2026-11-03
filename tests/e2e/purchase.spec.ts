import { expect, test } from '@playwright/test';
import { standardUser } from '../data/users';
import { PurchaseFlow } from '../flows/purchase.flow';

test('adds a product to the cart', async ({ page }) => {
  // Arrange: definir el producto y crear el flow con la página del navegador.
  const productName = 'Sauce Labs Backpack';
  const purchaseFlow = new PurchaseFlow(page);

  // Act: iniciar sesión, agregar el producto y abrir el carrito.
  await purchaseFlow.addProductToCart(standardUser, productName);

  // Assert: confirmar que el producto elegido aparece en el carrito.
  await expect(purchaseFlow.cartPage.product(productName)).toBeVisible();
});
