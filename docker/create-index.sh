#!/bin/bash
set -e

curl -u admin:z0yYhfj5#HzIC -k -XPUT "https://localhost:9200/messages" -H 'Content-Type: application/json' -d @docker/create-index.json
