FROM ubuntu:22.04

ARG CHROME_DEB=google-chrome-stable_current_amd64.deb
ARG FIXUID_VERSION=0.5.1

ENV DEBIAN_FRONTEND=noninteractive

# fonts-dejavu-core needed for headless chrome unicode characters.
RUN apt update -y && \
    apt upgrade -y && \
    apt install -y curl fonts-dejavu-core git make sudo unzip

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

# Download correct version of chromedriver and put in path.
RUN CHROME_VERSION=$(google-chrome --version | awk '{print $NF}' | sed 's/\.[0-9]\+$//g') && \
    DRIVER_VERSION=$(curl https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$CHROME_VERSION) && \
    curl -LO https://chromedriver.storage.googleapis.com/$DRIVER_VERSION/chromedriver_linux64.zip && \
    unzip chromedriver_linux64.zip && \
    mv chromedriver /usr/bin && \
    rm chromedriver_linux64.zip

EXPOSE 5006

COPY entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod a+x /usr/bin/entrypoint.sh
ENTRYPOINT ["/usr/bin/entrypoint.sh"]

ENV BOKEH_IN_DOCKER=1
USER docker:docker
WORKDIR /bokeh
