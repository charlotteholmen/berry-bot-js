FROM opensearchproject/opensearch:2.19

ENV discovery.type=single-node
ENV OPENSEARCH_INITIAL_ADMIN_PASSWORD=z0yYhfj$5#HzIC

COPY create-index.json /usr/share/opensearch/create-index.json
COPY create-index.sh /usr/share/opensearch/create-index.sh

RUN chmod +x /usr/share/opensearch/create-index.sh

EXPOSE 9200

CMD /usr/local/bin/docker-entrypoint.sh & \
    sleep 30 && /usr/share/opensearch/create-index.sh && wait
