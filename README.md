# Servidor MCP de Cloudflare Model Context Protocol

El Protocolo de contexto de modelo (MCP) es un [nuevo protocolo estandarizado](https://modelcontextprotocol.io/introduction) para gestionar el contexto entre modelos de lenguaje grandes (LLM) y sistemas externos. En este repositorio, proporcionamos un instalador y un servidor MCP para la [API de Cloudflare](https://api.cloudflare.com).

Esto le permite usar Claude Desktop, o cualquier cliente MCP, para usar lenguaje natural y lograr cosas en su cuenta de Cloudflare, por ejemplo:

* `Implemente un nuevo Worker con un objeto duradero de ejemplo.`
* `¿Puede informarme sobre los datos en mi base de datos D1 llamada '...'?`
* `¿Puede copiar todas las entradas de mi espacio de nombres KV '...' en mi depósito R2 '...'?`

## Demostración

<div align="center">
<a href="https://www.youtube.com/watch?v=vGajZpl_9yA">
<img src="https://img.youtube.com/vi/vGajZpl_9yA/maxresdefault.jpg" alt="Demostración del servidor MCP recientemente lanzado para explorar las propiedades de Cloudflare, como Workers, KV y D1". width="600"/>
</a>
</div>

## Configuración

1. Ejecuta `npx @cloudflare/mcp-server-cloudflare init`

<div align="left">
<img src="https://github.com/user-attachments/assets/163bed75-ec0c-478a-94b2-179969a90923" alt="Ejemplo de salida de consola" width="300"/>
</div>

2. Reinicia Claude Desktop. Deberías ver un pequeño ícono 🔨 que muestra las siguientes herramientas disponibles para usar:

<div align="left">
<img src="https://github.com/user-attachments/assets/a24275b1-1c6f-4754-96ef-dd7b9f0f5903" alt="Ejemplo de ícono de herramienta" height="160"/>
<img src="https://github.com/user-attachments/assets/4fb8badb-6800-4a3f-a530-a344b3584bec" alt="Ejemplo de lista de herramientas" height="160"/>
</div>

## Características

### Administración de almacenamiento de KV
- `get_kvs`: enumera todos los espacios de nombres de KV en su cuenta
- `kv_get`: obtiene un valor de un espacio de nombres de KV
- `kv_put`: almacena un valor en un espacio de nombres de KV
- `kv_list`: enumera las claves en un espacio de nombres de KV
- `kv_delete`: elimina una clave de un espacio de nombres de KV

### Administración de almacenamiento de R2
- `r2_list_buckets`: enumera todos los depósitos de R2 en su cuenta
- `r2_create_bucket`: crea un nuevo depósito de R2
- `r2_delete_bucket`: eliminar un depósito R2
- `r2_list_objects`: enumerar objetos en un depósito R2
- `r2_get_object`: obtener un objeto de un depósito R2
- `r2_put_object`: colocar un objeto en un depósito R2
- `r2_delete_object`: eliminar un objeto de un depósito R2

### Administración de bases de datos D1
- `d1_list_databases`: enumerar todas las bases de datos D1 en su cuenta
- `d1_create_database`: crear una nueva base de datos D1
- `d1_delete_database`: eliminar una base de datos D1
- `d1_query`: ejecutar una consulta SQL en una base de datos D1

### Administración de Workers
- `worker_list`: enumerar todos los Workers en su cuenta
- `worker_get`: obtener el contenido del script de un Workers
- `worker_put`: crear o actualizar un script de Worker
- `worker_delete`: eliminar un script de Worker

### Análisis
- `analytics_get`: recuperar datos analíticos para su dominio
- Incluye métricas como solicitudes, ancho de banda, amenazas y vistas de página
- Admite filtrado por rango de fechas

## Desarrollo

En la carpeta del proyecto actual, ejecute:

```
pnpm install
pnpm build:watch
```

Luego, en una segunda terminal:

```
node dist/index.js init
```

Esto vinculará Claude Desktop con su versión instalada localmente para que pueda probarla.

## Uso fuera de Claude

Para ejecutar el servidor localmente, ejecute `node dist/index run <account-id>`.

Si está usando un cliente MCP alternativo o está probando cosas localmente, emita el comando `tools/list` para obtener una lista actualizada de todas las herramientas disponibles. Luego, puede llamarlas directamente usando el comando `tools/call`.

### Workers

```javascript
// Listar Workers
worker_list()

// Obtener el código del Worker
worker_get({ name: "my-worker" })

// Actualizar Worker
worker_put({
name: "my-worker",
script: "export default { async fetch(request, env, ctx) { ... }}",
bindings: [
{
type: "kv_namespace",
name: "MY_KV",
namespace_id: "abcd1234"
},
{
type: "r2_bucket",
name: "MY_BUCKET",
bucket_name: "my-files"
}
],
compatible_date: "2024-01-01",
compatible_flags: ["nodejs_compat"]
})

// Eliminar Workers
worker_delete({ name: "my-worker" })
```

### KV Store

```javascript
// Lista de espacios de nombres de KV
get_kvs()

// Obtener valor
kv_get({
namespaceId: "your_namespace_id",
key: "myKey"
})

// Almacenar valor
kv_put({
namespaceId: "your_namespace_id",
key: "myKey",
value: "myValue",
expirationTtl: 3600 // opcional, en segundos
})

// Lista de claves
kv_list({
namespaceId: "your_namespace_id",
prefix: "app_", // opcional
limit: 10 // opcional
})

// Eliminar clave
kv_delete({
namespaceId: "your_namespace_id",
key: "myKey"
})
```

### R2 Almacenamiento

```javascript
// Lista de depósitos
r2_list_buckets()

// Crear depósito
r2_create_bucket({ name: "my-bucket" })

// Eliminar depósito
r2_delete_bucket({ name: "my-bucket" })

// Listar objetos en el depósito
r2_list_objects({
depósito: "my-bucket",
prefijo: "carpeta/", // opcional
delimitador: "/", // opcional
límite: 1000 // opcional
})

// Obtener objeto
r2_get_object({
depósito: "my-bucket",
clave: "carpeta/archivo.txt"
})

// Poner objeto
r2_put_object({
