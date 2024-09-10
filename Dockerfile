FROM node:19.6.1
WORKDIR /app/
COPY . . 
COPY package.json
RUN npm install
CMD ['npm','start']