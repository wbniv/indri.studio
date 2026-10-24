# Builder image for a signed APT repo on Cloudflare R2: the local and lab copy.
#
# Inherits home-lab's stack-deb (Ubuntu 26.04 + build-essential, debhelper,
# devscripts, dpkg-dev, fakeroot, file, lintian, aptly, gnupg, rclone, python3,
# curl, git, jq, rsync), pinned by digest from home-lab stacks/stacks.lock.json.
# It installs only this repo's own packages: a missing shared system package is
# added to stack-deb and the stack is rebuilt (home-lab
# docs/plans/2026-10-23-standard-container-stacks.md, "The rule").
#
# Used locally (`task apt:*` → scripts/in-docker.sh) on the workstation or a lab
# build VM. registry.lab.home.arpa:5000 is reachable only inside the lab, so a
# GitHub-hosted runner cannot pull this base: .github/workflows/publish.yml
# builds Dockerfile.github instead (FROM ubuntu:26.04 with the same packages)
# until CI runs inside the lab. stack-deb is built for linux/amd64 only.
#
# stack-deb is Ubuntu 26.04, the target distribution: dpkg-shlibdeps pins to the
# build host's library sonames, so a Debian builder ships .debs that won't
# install on Ubuntu 26.04 (vgmstream_2083-1foundry2, 2026-05-20).
#
# To move to a newer stack-deb, copy its "image" from home-lab
# stacks/stacks.lock.json.

FROM registry.lab.home.arpa:5000/stacks/stack-deb@sha256:86c63a46301a9aee9d797ae7bfa49aa593dc6cc44f0190b7698fa4455c1708c2

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# The stack ends as user dev; root only for apt and to write /usr/local/bin.
USER root

# claude-usage build-deb.sh: icon bake + payload copy
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3-cairo \
        python3-pil \
    && rm -rf /var/lib/apt/lists/*

# Tailwind CSS standalone binary — single executable, no Node.js required.
RUN set -eu; \
    curl -fsSL -o /usr/local/bin/tailwindcss \
        "https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64"; \
    chmod +x /usr/local/bin/tailwindcss; \
    /usr/local/bin/tailwindcss --help 2>&1 | head -3
USER dev

# Aptly state goes under $HOME/.aptly — point HOME at a per-run-writable
# location so --user $(id -u):$(id -g) (set by scripts/in-docker.sh) works.
# /tmp is world-writable inside the container.
ENV HOME=/tmp

WORKDIR /work/apt

CMD ["bash"]
