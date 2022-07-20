# # // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# # // SPDX-License-Identifier: MIT-0

# #vsock demo image
# FROM public.ecr.aws/amazonlinux/amazonlinux:2

# # Install python for running the server and net-tools for modifying network config
# RUN curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - &&\
#     yum -y install python3 iproute gcc gcc-c++ make python3-devel git nodejs 

# ENV VIRTUAL_ENV=/opt/venv
# RUN python3 -m venv $VIRTUAL_ENV
# ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# WORKDIR /app

# COPY index.js ./
# COPY package.json ./
# COPY requirements.txt ./
# COPY zokrates_pycrypto ./zokrates_pycrypto
# COPY server.py ./
# COPY traffic_forwarder.py ./
# COPY run.sh ./
# COPY config.py ./

# RUN npm cache clean --force &&\
#     rm -rf node_modules package-lock.json $HOME/.node-gyp &&\
#     npm update &&\
#     npm install &&\
#     pip install -r requirements.txt &&\
#     chmod +x /app/run.sh

# # RUN npm install
# # RUN npm --version
# # RUN node index.js 100000 -0.05

# CMD ["/app/run.sh"]


# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0

#vsock demo image
FROM node:16 AS build

WORKDIR /app

COPY package.json ./

RUN npm install

FROM public.ecr.aws/amazonlinux/amazonlinux:2 

# Install python for running the server and net-tools for modifying network config
RUN curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - &&\
    yum -y install python3 iproute gcc gcc-c++ make python3-devel nodejs 

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY --from=build /app /app

WORKDIR /app

COPY requirements.txt ./
COPY zokrates_pycrypto ./zokrates_pycrypto
COPY server.py ./
COPY traffic_forwarder.py ./
COPY run.sh ./
COPY index.js ./
COPY config.py ./

RUN pip install -r requirements.txt &&\
    chmod +x /app/run.sh

# CMD ["node", "index.js"]
CMD ["/app/run.sh"]