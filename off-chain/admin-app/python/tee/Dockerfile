# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0

#vsock demo image
FROM public.ecr.aws/amazonlinux/amazonlinux:2
# FROM node:12.18.1


RUN yum install python3 iproute  -y

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install python for running the server and net-tools for modifying network config
RUN yum -y install gcc
RUN yum install python3-devel  -y
# RUN curl -fsSL https://rpm.nodesource.com/setup_17.x | bash -
RUN yum install -y nodejs

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY zokrates_pycrypto ./zokrates_pycrypto
COPY server.py ./
COPY traffic_forwarder.py ./
COPY run.sh ./
COPY config.py ./

COPY index.js .
COPY package.json .
COPY package-lock.json .

# RUN chmod +x /app/run.sh
RUN node start .

CMD ["/app/run.sh"]