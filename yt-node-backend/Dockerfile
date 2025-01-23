FROM node:20.17.0
WORKDIR /yt-node-backend
COPY package.json ./
RUN npm install 
COPY . .
EXPOSE 3001
CMD [ "npm", "run", "dev" ]
