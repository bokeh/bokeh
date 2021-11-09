FROM ubuntu:20.04

ARG CHROME_DEB=google-chrome-stable_current_amd64.deb
ARG FIXUID_VERSION=0.5

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -y && \
    apt upgrade -y && \
    apt install -y curl git sudo

# User and group setup using fixuid.
RUN addgroup --gid 1000 docker && \
    adduser --uid 1000 --ingroup docker --home /home/docker --shell /bin/bash --disabled-password --gecos "" docker && \
    USER=docker && \
    GROUP=docker && \
    ARCH="$(dpkg --print-architecture)" && \
    curl -fsSL "https://github.com/boxboat/fixuid/releases/download/v$FIXUID_VERSION/fixuid-$FIXUID_VERSION-linux-$ARCH.tar.gz" | tar -C /usr/local/bin -xzf - && \
    chown root:root /usr/local/bin/fixuid && \
    chmod 4755 /usr/local/bin/fixuid && \
    mkdir -p /etc/fixuid && \
    printf "user: $USER\ngroup: $GROUP\n" > /etc/fixuid/config.yml

# Cannot 'snap install chromium' in docker container, so instead install google-chrome deb.
RUN curl -LO https://dl.google.com/linux/direct/$CHROME_DEB && \
    apt install --no-install-recommends -y ./$CHROME_DEB && \
    rm $CHROME_DEB && \
    apt autoremove -y && \
    apt clean -y && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 5006

COPY entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod a+x /usr/bin/entrypoint.sh
ENTRYPOINT ["/usr/bin/entrypoint.sh"]

ENV BOKEH_IN_DOCKER=1
USER docker:docker
WORKDIR /bokeh
