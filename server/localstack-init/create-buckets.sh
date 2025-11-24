#!/bin/bash

# Esperar a que LocalStack esté listo
echo "Esperando a que LocalStack esté listo..."
sleep 5

# Crear el bucket de S3
echo "Creando bucket S3: miniyoutube"
awslocal s3 mb s3://miniyoutube

echo "Bucket creado exitosamente"
