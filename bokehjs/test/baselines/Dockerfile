# Keep the renderer ABI aligned with the core22 base used by the Chromium Snap
# that produced the existing Linux baselines. Newer font stacks change pixels.
FROM ubuntu:22.04@sha256:2edbbc5dc405e9612ba3584ce95480277e3eb374407b5505fe26f17df77c7dbc

ARG CHROME_VERSION=141.0.7390.54
ARG CHROME_SHA256=5023ec2b8995b74caa5de0e22d5e30f871c3ecce67a6e52d3c9f9dfed423ed01
ARG NODE_VERSION=24.11.0
ARG NODE_SHA256=46da9a098973ab7ba4fca76945581ecb2eaf468de347173897044382f10e0a0a

ENV DEBIAN_FRONTEND=noninteractive

# The base, Node archive, Chrome archive, and font families are explicit. A
# published image can additionally pin the resolved Ubuntu package layer by its
# image digest.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      fonts-dejavu-core \
      fonts-liberation \
      fonts-noto-color-emoji \
      fonts-noto-core \
      git \
      unzip \
      xz-utils && \
    rm -rf /var/lib/apt/lists/*

RUN curl --fail --location --silent --show-error \
      --output /tmp/node.tar.xz \
      "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" && \
    echo "${NODE_SHA256}  /tmp/node.tar.xz" | sha256sum --check --strict && \
    tar --extract --xz --file /tmp/node.tar.xz --directory /usr/local --strip-components=1 && \
    rm /tmp/node.tar.xz && \
    rm -rf \
      /usr/local/include/node \
      /usr/local/lib/node_modules/corepack \
      /usr/local/bin/corepack

RUN curl --fail --location --silent --show-error \
      --output /tmp/chrome.zip \
      "https://storage.googleapis.com/chrome-for-testing-public/${CHROME_VERSION}/linux64/chrome-linux64.zip" && \
    echo "${CHROME_SHA256}  /tmp/chrome.zip" | sha256sum --check --strict && \
    unzip -q /tmp/chrome.zip -d /opt && \
    mv /opt/chrome-linux64 /opt/chrome && \
    rm /tmp/chrome.zip && \
    find /opt/chrome/locales -type f ! -name 'en-US.pak' -delete && \
    rm -rf /opt/chrome/WidevineCdm && \
    apt-get update && \
    xargs --delimiter='\n' apt-get satisfy -y --no-install-recommends < /opt/chrome/deb.deps && \
    rm -rf /var/lib/apt/lists/*

ENV BOKEH_CHROME=/opt/chrome/chrome
ENV BOKEH_IN_DOCKER=1

LABEL org.opencontainers.image.source="https://github.com/bokeh/bokeh"
