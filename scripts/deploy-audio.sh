#!/bin/sh
# Deploy audio-source/ to the Firebase Hosting audio site. See docs/DEPLOY.md.
set -e
cd "$(dirname "$0")/.."
firebase deploy --only hosting --config firebase/firebase.json
