FROM node:20

WORKDIR /app

COPY . .

RUN npm install || echo "Sin dependencias aún"

EXPOSE 3000

CMD ["node", "-e", "console.log('Contenedor Plataforma Web ejecutándose')"]
