# Automatización E2E con Playwright y BDD

Proyecto de pruebas end-to-end para [SauceDemo](https://www.saucedemo.com),
escrito en TypeScript. Las features Gherkin se convierten en tests de
Playwright con `playwright-bdd`; Playwright Test es el único runner.

## Requisitos e instalación

Instala Node.js compatible con las dependencias del proyecto. Desde la raíz:

```powershell
npm ci
npx playwright install chromium
```

## Ejecutar y revisar

| Comando | Resultado |
| --- | --- |
| `npm test` | Genera los tests BDD y ejecuta todos los escenarios |
| `npm run test:headed` | Ejecuta con el navegador visible |
| `npm run test:ui` | Abre la interfaz de Playwright |
| `npm run typecheck` | Comprueba los tipos TypeScript |
| `npm run bdd:generate` | Genera los tests sin ejecutarlos |
| `npm run report:playwright` | Abre el reporte HTML de la última ejecución |

Para filtrar por nombre o etiqueta:

```powershell
npm test -- --grep "Buy Item"
npm test -- --grep "@intentional-failure"
```

El escenario `@intentional-failure` comprueba la captura de errores y falla
intencionalmente. Por eso `npm test` incluye un fallo esperado. Para ejecutar
solo los escenarios funcionales:

```powershell
npm test -- --grep-invert "@intentional-failure"
```

Los reportes HTML, JUnit y Cucumber, junto con las evidencias, se guardan bajo
`results\`. El reporte HTML se abre por separado con
`npm run report:playwright`.

## Configuración

La configuración está en [playwright.config.ts](playwright.config.ts):

- La URL por defecto es `https://www.saucedemo.com`; se puede cambiar con la
  variable de entorno `BASE_URL`.
- Se ejecuta en Chromium.
- Playwright captura screenshots solo cuando falla una prueba y recoge trazas
  en el primer reintento.
- Los reportes configurados son línea de comandos, HTML, JUnit y JSON Cucumber.
- En CI (`CI` definido) se prohíben tests exclusivos, se usan dos reintentos y
  un worker.

En PowerShell, para apuntar a otro entorno:

```powershell
$env:BASE_URL = 'https://www.saucedemo.com'
npm test
```

No está configurada la carga automática de archivos `.env`.

## Estructura y práctica

```text
tests/
  features/   Escenarios y ejemplos Gherkin
  steps/      Implementación de los pasos y verificaciones
  flows/      Operaciones de negocio reutilizables
  pages/      Selectores e interacción con cada pantalla
  data/       Tipos y datos compartidos
```

El recorrido es:

```text
Feature -> step -> flow -> page -> aplicación
                 step -> expect
```

- Las **features** describen el comportamiento, sin selectores.
- Los **steps** conectan las frases Gherkin con el código, llaman flows y
  verifican los resultados con `expect`.
- Los **flows** coordinan operaciones, por ejemplo iniciar sesión o completar
  una compra.
- Las **pages** encapsulan localizadores y acciones de la interfaz.
- **data** contiene tipos y datos reutilizables.

Los escenarios actuales cubren inicio de sesión válido e inválido, añadir un
producto al carrito y completar una compra. El flujo de compra inicia sesión
en el `Background` de la feature y reutiliza ese estado para sus escenarios.

Por ejemplo, la frase de [buy_item.feature](tests/features/buy_item.feature):

```gherkin
When User adds "Sauce Labs Backpack" to the cart
```

se implementa en [purchase.steps.ts](tests/steps/purchase.steps.ts), que llama
a `PurchaseFlow.addProductToCart()`. El flow coordina
`InventoryPage`; la verificación del carrito queda en el step `Then`.

## Añadir o modificar un escenario

1. Define el comportamiento y sus datos en `tests/features/`.
2. Reutiliza un step existente o registra el nuevo en `tests/steps/` con
   `createBdd()`.
3. Implementa operaciones reutilizables en `tests/flows/` e interacción de
   interfaz en `tests/pages/`.
4. Ejecuta `npm run typecheck` y prueba el escenario:

   ```powershell
   npm test -- --grep "Nombre del escenario"
   ```

`npm test` genera los tests en `.features-gen` antes de ejecutarlos. Esa
carpeta y los resultados de `results\` son artefactos generados; no se editan
ni se versionan.
