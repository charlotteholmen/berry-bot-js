FROM opensearchproject/opensearch:latest

ENV discovery.type=single-node
ENV OPENSEARCH_INITIAL_ADMIN_PASSWORD=z0yYhfj5#HzIC

USER root
COPY docker/create-index.json /usr/share/opensearch/create-index.json
COPY docker/create-index.sh /usr/share/opensearch/create-index.sh

RUN chmod +x /usr/share/opensearch/create-index.sh
USER opensearch

EXPOSE 9200

CMD /usr/share/opensearch/opensearch-docker-entrypoint.sh & \
    sleep 30 && /usr/share/opensearch/create-index.sh && wait
