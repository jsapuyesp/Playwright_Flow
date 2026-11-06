# Modelo de automatizacion: Playwright + BDD + Flows

Este proyecto automatiza SauceDemo con TypeScript, escenarios Gherkin y
`playwright-bdd`. Separa el comportamiento esperado de los detalles de
automatizacion para servir como guia para suites que puedan crecer.

## Playwright, BDD y Cucumber

- **BDD** es el enfoque de describir y acordar comportamientos mediante ejemplos.
- **Gherkin** es el lenguaje de las features: `Given`, `When`, `Then`, escenarios,
  tablas y ejemplos.
- **playwright-bdd** conecta las features y sus definiciones de steps con
  Playwright Test, generando tests ejecutables.
- **Playwright Test** ejecuta esos tests y administra navegador, contextos,
  fixtures, paralelismo, reintentos y reporteros.
- **Cucumber.js** es otro runner para escenarios Gherkin. Este proyecto NO
  ejecuta `cucumber-js` ni utiliza su `World` y hooks.

Usamos el lenguaje Gherkin y expresiones de steps del ecosistema Cucumber,
pero conservamos Playwright Test como runner. No son dos runners ejecutandose
al mismo tiempo.

## Estructura

```text
tests\
  features\                  Comportamientos y datos de escenarios
    swaglabs_login.feature
    buy_item.feature
  steps\                     Conexion de frases con codigo y verificaciones
    login.steps.ts
    purchase.steps.ts
  flows\                     Operaciones reutilizables de negocio
    login.flow.ts
    purchase.flow.ts
  pages\                     Selectores y acciones de cada pantalla
    login.page.ts
    inventory.page.ts
    cart.page.ts
    checkout.page.ts
  data\                      Datos reutilizables y tipos
    users.ts
    checkout.ts
.features-gen\               Tests generados; fuera de Git
playwright.config.ts         Configuracion de BDD y Playwright
tsconfig.json                Comprobacion estricta de tipos
package.json                 Dependencias y comandos
```

## Flujo de ejecucion

```text
Feature -> bddgen -> Test generado -> Step -> Flow -> Page -> Aplicacion
                                      |
                                      +-> expect: resultado esperado
```

1. Una feature declara un escenario y sus pasos en orden.
2. `bddgen` lee las features y las definiciones de steps configuradas.
3. Relaciona cada frase con el patron registrado y genera tests en
   `.features-gen`.
4. Playwright ejecuta los tests generados.
5. Cada step recibe la `page` del escenario y llama al flow correspondiente.
6. El flow coordina acciones mediante Page Objects.
7. Los steps verifican el resultado con `expect`.

Los tests generados son codigo derivado: no se editan ni se versionan.
Los scripts de ejecucion regeneran los tests antes de correrlos. En CI tambien
se generan despues de instalar las dependencias.

### Como se conectan las capas

Este paso de [buy_item.feature](tests/features/buy_item.feature):

```gherkin
When User adds "Sauce Labs Backpack" to the cart
```

coincide con la expresion registrada en
[purchase.steps.ts](tests/steps/purchase.steps.ts):

```ts
import { createBdd } from 'playwright-bdd';
import { PurchaseFlow } from '../flows/purchase.flow';

const { When } = createBdd();

When(
  'User adds {string} to the cart',
  async ({ page }, productName: string) => {
    const purchaseFlow = new PurchaseFlow(page);
    await purchaseFlow.addProductToCart(productName);
  },
);
```

`{string}` recibe el texto entre comillas. No se registra la palabra `When`
como parte de la expresion. `And` continua el tipo de paso anterior; no hace
falta una definicion duplicada para esa palabra.

La relacion feature-step depende del texto y sus parametros, no de que los
archivos tengan el mismo nombre. La relacion step-flow es un import y una
llamada TypeScript normal.

En [PurchaseFlow](tests/flows/purchase.flow.ts), la operacion agrega el producto
mediante `InventoryPage` y abre el carrito. No inicia sesion: la autenticacion
es una precondicion del escenario.

## Responsabilidad de cada capa

### Features: que debe pasar

Describen precondiciones, acciones y resultados en lenguaje de negocio.
No contienen selectores ni detalles de Playwright.

- `Background` establece pasos comunes antes de cada escenario de su alcance.
- `Scenario Outline` ejecuta un caso por cada fila de `Examples`.
- Los placeholders, como `<username>`, se sustituyen antes de ejecutar el step.
- Las tablas se entregan como `DataTable`; los steps validan su forma antes
  de utilizar sus datos.
- Las etiquetas permiten identificar y filtrar escenarios.

Los escenarios actuales cubren cuatro logins invalidos, login valido,
producto en carrito y compra completa: siete casos funcionales, mas un caso
de fallo intencional para verificar capturas.

### Steps: traducir y verificar

Registran frases con `createBdd()`, reciben parametros y tablas, instancian los
flows y verifican los resultados esperados.

No deben duplicar selectores ni contener grandes procesos de negocio.
Para reutilizar una operacion, llaman al flow, no a otro step.

### Flows: coordinar operaciones

Agrupan acciones con sentido de negocio y pueden utilizar varias paginas.
Son independientes del texto Gherkin y pueden reutilizarse desde otros tests.

- `LoginFlow`: abrir login, enviar credenciales o realizar ambas acciones.
- `PurchaseFlow`: agregar un producto y abrir el carrito; completar checkout.

No es obligatorio crear un flow por cada accion. Un step simple tambien puede
usar directamente una page. Las verificaciones del `Then` pertenecen a los
steps; un flow puede comprobar condiciones necesarias para garantizar su
propio contrato.

### Pages: interactuar con la interfaz

Encapsulan selectores y acciones de cada pantalla. Exponen localizadores
cuando los steps necesitan comprobar el resultado.

Crear `new CartPage(page)` no abre una pantalla: crea un objeto que sabe
interactuar con la `page` recibida.

### Data: datos y contratos

Contiene datos reutilizables y tipos, como `UserCredentials` y
`CheckoutCustomer`. Los datos particulares de un escenario tambien pueden
estar en su feature.

Las credenciales incluidas son datos publicos de la aplicacion de demostracion.
No guardar secretos reales en features, codigo ni Git.

## Instancias, constructor y readonly

Los flows usan **composicion**, no herencia: un flow tiene Page Objects.

```ts
readonly cartPage: CartPage;

constructor(page: Page) {
  this.cartPage = new CartPage(page);
}
```

La propiedad declara el tipo; el constructor crea el objeto usando la pagina
del escenario. `readonly` impide reasignar la referencia desde TypeScript,
pero permite llamar sus metodos y no congela el navegador.

`private` limita el acceso desde fuera de la clase. Las paginas publicas del
flow actual permiten a los steps acceder a localizadores para verificaciones.

## Por que no hay una capa support

Los steps usan las fixtures incorporadas de Playwright y crean sus flows
directamente. No necesitamos fixtures propias, un contenedor global ni hooks
manuales de navegador.

Dentro de un escenario, los steps reciben la misma `page`. Crear otro flow
sobre ella no pierde la sesion ni abre otro navegador. Cada escenario tiene
su propio contexto aislado.

Actualmente los flows no guardan estado de negocio adicional entre steps.
Si en el futuro se necesita compartir ese estado, debe gestionarse por
escenario, nunca mediante variables globales.

## Instalacion

Usar una version de Node.js compatible con las dependencias instaladas; este
modelo se ha ejecutado con Node.js 24.

Desde la raiz del proyecto:

```powershell
npm ci
npx playwright install chromium
```

`npm ci` instala las versiones registradas en el lockfile. Cuando se cambien
dependencias de forma intencional, usar `npm install` para actualizarlo.

## Comandos

| Comando | Funcion |
| --- | --- |
| `npm test` | Genera y ejecuta todos los escenarios |
| `npm run test:headed` | Genera y ejecuta con navegador visible |
| `npm run test:ui` | Genera y abre Playwright UI |
| `npm run bdd:generate` | Solo genera tests |
| `npm run typecheck` | Comprueba tipos sin emitir JavaScript |
| `npm run report:allure` | Genera el reporte desde `allure-results` |
| `npx playwright show-report` | Abre el reporte HTML de Playwright |

Los scripts usan `bddgen && playwright test`: si falla la generacion, no se
ejecutan tests desactualizados. Ese `&&` pertenece al script de npm; en
Windows PowerShell los comandos manuales se pueden ejecutar por separado.

Para listar escenarios sin ejecutarlos:

```powershell
npm run bdd:generate
npx playwright test --list
```

Para ejecutar un escenario o etiqueta:

```powershell
npm test -- --grep "Buy Item"
npm test -- --grep "@UserHistory=1234"
```

Si cambias features o definiciones mientras tienes la UI abierta, regenera
los tests para que reflejen esos cambios.

### URL del entorno

La URL predeterminada es `https://www.saucedemo.com`. En PowerShell:

```powershell
$env:BASE_URL = 'https://www.saucedemo.com'
npm test
Remove-Item Env:\BASE_URL
```

No hay carga automatica de un archivo `.env` configurada.

## Reportes y trazas

[playwright.config.ts](playwright.config.ts) configura reporteros de consola,
HTML, Allure y JSON Cucumber. Todos reciben los resultados de la misma
ejecucion de Playwright; no es necesario instalar ni ejecutar Cucumber.js.

### Screenshots de fallos y Allure

La opcion `screenshot: 'only-on-failure'` captura automaticamente la pagina
cuando falla una prueba. Playwright guarda el PNG en `test-results` y lo
adjunta al resultado; `allure-playwright` incluye ese mismo adjunto en Allure,
sin hooks ni llamadas manuales a `allure.attachment`. Tambien queda disponible
en el reporte HTML de Playwright. Las pruebas exitosas no generan capturas.

La captura requiere que la prueba haya abierto una pagina y esta siga
disponible al capturar; un fallo antes de crearla no tendra screenshot.

El escenario `Intentional failure to verify screenshot attachments`, marcado
con `@intentional-failure`, compara deliberadamente un mensaje incorrecto
despues de un login invalido. Debe fallar y adjuntar la captura:

```powershell
npm test -- --grep "@intentional-failure" --retries=0
npm run report:allure
```

Mientras este escenario exista, `npm test` tambien lo ejecutara y terminara
con error. Para ejecutar solo los siete casos funcionales:

```powershell
npm test -- --grep-invert "@intentional-failure"
```

Allure se genera por separado para poder hacerlo incluso si las pruebas
fallan. Sus resultados pueden incluir ejecuciones anteriores: para un reporte
de una sola ejecucion, limpiar unicamente los resultados previos de
`allure-results` antes de correr la suite.

```powershell
npm test
npm run report:allure
```

### JSON Cucumber para Azure DevOps

Cada ejecucion escribe `cucumber-results/cucumber.json` con features,
escenarios, pasos y estados. El archivo se reemplaza en cada ejecucion,
incluso cuando hay fallos. Las capturas automaticas se verifican en Allure
y en el reporte HTML de Playwright; no se garantiza que aparezcan en la
extension Cucumber.

Este es el formato que consume la extension
[Azure Pipelines Cucumber Reporter](https://marketplace.visualstudio.com/items?itemName=MaciejMaciejewski.azure-pipelines-cucumber).
Instalarla primero en la organizacion de Azure DevOps. En el pipeline, despues
de instalar Node.js y las dependencias, ejecutar las pruebas y publicar:

```yaml
steps:
- task: NodeTool@0
  inputs:
    versionSpec: '24.x'
  displayName: 'Install Node.js'

- script: npm ci
  displayName: 'Install dependencies'

- script: npx playwright install --with-deps chromium
  displayName: 'Install Chromium'

- script: npm test
  displayName: 'Run BDD tests'
  env:
    CI: 'true'

- task: PublishCucumberReport@1
  displayName: 'Publish Cucumber report'
  condition: always()
  inputs:
    jsonDir: '$(System.DefaultWorkingDirectory)/cucumber-results'
    outputPath: '$(System.DefaultWorkingDirectory)/cucumber-report'
    name: 'BDD tests'
    title: 'Playwright + BDD'
```

`condition: always()` permite publicar aunque las pruebas fallen, sin ocultar
el fallo del paso `npm test`. Si la ejecucion se interrumpe antes de generar
el JSON, la publicacion no tendra resultados que procesar.
`jsonDir` debe apuntar solo a los JSON Cucumber, no a `allure-results` ni a
toda la raiz del proyecto: la extension intenta procesar todos los JSON
encontrados. Este ejemplo asume que el repositorio esta en el directorio
de trabajo predeterminado; ajustar las rutas si se ejecuta desde otro.

La extension genera su propio HTML y lo muestra en Azure DevOps; no consume
el HTML de Playwright ni el de Allure. Conservar tambien `allure-results` y
`test-results` como artefactos del pipeline si se necesitan para diagnostico.

### Trazas

La configuracion actual captura trazas en el primer reintento. En local no
hay reintentos por defecto; en CI hay dos. Para investigar un fallo local:

```powershell
npm test -- --grep "Buy Item" --trace on
```

No subir a Git tests generados, dependencias, resultados ni reportes.

## Como agregar una nueva automatizacion

1. Escribir el comportamiento en una feature, con datos y resultado claros.
2. Reutilizar steps existentes cuando su significado coincida.
3. Registrar las frases nuevas en steps usando `createBdd()`.
4. Reutilizar o ampliar flows para operaciones de negocio.
5. Agregar selectores y acciones a las pages correspondientes.
6. Definir tipos o datos reutilizables en data cuando sea necesario.
7. Ejecutar `npm run typecheck`.
8. Ejecutar el escenario con `npm test -- --grep "Nombre del escenario"`.
9. Revisar los reportes y ejecutar los casos afectados.

Mantener esta estructura simple mientras sea suficiente. Agrupar por dominio
cuando el volumen lo requiera, sin agregar clases base ni capas obligatorias
que solo reenvien llamadas.
