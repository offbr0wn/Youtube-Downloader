FROM node:latest
WORKDIR /yt-downloader-frontend
COPY package*.json ./
RUN npm install 
COPY . .
EXPOSE 3000
CMD [ "npm", "run", "dev" ]