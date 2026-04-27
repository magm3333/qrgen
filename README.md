# QR Generator

Generador de códigos QR con editor de plantillas visuales. Desplegado en GitHub Pages: https://magm3333.github.io/qrgen/

## Características

- Generación de códigos QR con configuración personalizable
- Editor visual de plantillas con arrastre, redimensión y rotación
- Soporte para imágenes de fondo
- Exportación a PNG/SVG
- Proyectos guardados en localStorage
- Modo oscuro/claro
- Autenticación con usuario/password

## Desarrollo Local

```bash
cd /home/mariano/Documentos/proyectos/qrgen
npm install
npm run dev
```

Para build de producción:
```bash
npm run build
```

Los archivos de build quedan en `dist/`. Para probar localmente:
```bash
npx serve dist
```

## Despliegue a GitHub Pages

El proyecto usa la rama `gh-pages` para GitHub Pages:

```bash
npm run build
cp passwords dist/
cp -r dist/* ../qrgen-pages/
cd ../qrgen-pages
git add .
git commit -m "deploy"
git push -f https://USUARIO:TOKEN@github.com/USUARIO/qrgen.git gh-pages:gh-pages
```

O usar el script:
```bash
./deploy.sh
```

## Usuarios y Contraseñas

El sistema de-auth usa hashes SHA256. El archivo `passwords` contiene líneas formato:
```
usuario:hashSHA256
```

### Agregar nuevo usuario

1. Generar hash SHA256 de la contraseña:
```bash
echo -n "micontraseña" | sha256sum
```

2. Agregar al archivo `passwords`:
```
nuevousuario:HASH_GENERADO
```

### Ejemplo: agregar usuario "test" con password "123456"

```bash
echo -n "123456" | sha256sum
# Salida: 8d969eef6ecad3c29d3a529097cf2fbda25ffc2b9f2ad044e5b9cbd1c7e8e2d5
```

Agregar al archivo:
```
test:8d969eef6ecad3c29d3a529097cf2fbda25ffc2b9f2ad044e5b9cbd1c7e8e2d5
```

## Atajos de teclado

- `Ctrl+Shift+L` - Cerrar sesión (logout)

## Stack

- Vue 3 + Vite
- QRCode.js para generación de QR
- Canvas API para edición visual
- Autenticación SHA256