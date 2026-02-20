EVIDENCIAS DE PRUEBAS Y BUILD

Fecha: 2026-02-19

Resumen:
- Se generó el build de frontend en frontend/dist apuntando a VITE_API_URL durante el build.
- Se arrancó el API Gateway con simulación (SIMULATE_LATENCY_MS=1500, SIMULATE_FAIL_RATE=20).
- Se ejecutó el script de simulación tools/simtests/test.js que produjo tools/simtests/simtests-report.json.

Archivos generados:
- Build frontend: frontend/dist
- Reporte de simulación: tools/simtests/simtests-report.json

Comandos ejecutados localmente (resumen):
- Build frontend con VITE_API_URL apuntando al gateway local.
- Iniciar gateway: node backend/api-gateway/index.js con variables de entorno para servicios y simulación.
- Ejecutar simtests: node tools/simtests/test.js (genera simtests-report.json).

Resultados clave:
- Durante las pruebas se observaron respuestas 503 (simulated failure) y 500 (errores reenviados por el gateway). Esto valida el manejo de errores y permite probar loader/retry en la UI.

Próximos pasos / recomendaciones:
- Subir tools/simtests/simtests-report.json como artefacto en CI para evidencias.
- En CI/CD setear VITE_API_URL a la URL real del API Gateway antes del build.
- Añadir health endpoints en servicios y usarlos en Docker/Orquestador.
