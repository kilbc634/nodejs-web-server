FROM tuyn76801/ubuntu-18.04:201126
ENV APP_NAME="nodejs-web-server"
ENV LANG="C.UTF-8"
# install Chinese fonts for FaceBook web page
# RUN apt install -y fonts-wqy-*
# RUN fc-cache -f -v
WORKDIR /home/${APP_NAME}

EXPOSE 21126
EXPOSE 443
EXPOSE 80

ADD ./ ./
RUN npm install --save

CMD node app.js
