FROM node:latest AS build
WORKDIR /usr/local/app
COPY ./ /usr/local/app/
RUN npm install --legacy-peer-deps
RUN npm run build -- --configuration production

FROM nginx:latest
COPY --from=build /usr/local/app/dist/MiniML/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]