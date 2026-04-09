#!/usr/bin/env bash
# Render.com build script for Benzard Sports Management

set -o errexit

# Install dependencies
pnpm install --frozen-lockfile

# Build the application
pnpm build
