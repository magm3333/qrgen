#!/bin/bash
# Deploy script for qrgen GitHub Pages

set -e

echo "Building..."
npm run build

echo "Copying passwords..."
cp passwords dist/

echo "Copying to gh-pages..."
cp -r dist/* ../qrgen-pages/

cd ../qrgen-pages

echo "Committing..."
git add .
git commit -m "deploy" || echo "Nothing to commit"

echo "Pushing..."
# Edita con tu token personal para producción
git push -f https://USUARIO:TU_TOKEN@github.com/magm3333/qrgen.git gh-pages:gh-pages

echo "Done! https://magm3333.github.io/qrgen/"