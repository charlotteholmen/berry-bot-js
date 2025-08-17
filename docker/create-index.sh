#!/bin/bash
set -e

until curl -u admin:admin -s http://localhost:9200/_cluster/health | grep '"status":"green"'; do
  echo "Waiting for OpenSearch..."
  sleep 5
done

curl -u admin:z0yYhfj$5#HzIC -XPUT "http://localhost:9200/messages" -H 'Content-Type: application/json' -d @/usr/share/opensearch/create-index.json
