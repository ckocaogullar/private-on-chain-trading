# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0

#vsock demo image
FROM public.ecr.aws/amazonlinux/amazonlinux:2

RUN yum install python3 iproute  -y

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install python for running the server and net-tools for modifying network config
RUN yum -y install gcc python3-devel tar

# Install Zokrates and set the path
RUN curl -LSfs get.zokrat.es | sh
RUN export PATH=$PATH:/home/ec2-user/.zokrates/bin

WORKDIR /app

COPY zokrates_decision_proof ./

RUN chmod +x /app/run.sh

CMD ["/app/run.sh"]