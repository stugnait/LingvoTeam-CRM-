FROM postgres:16-alpine

COPY docker-entrypoint-env.sh /usr/local/bin/docker-entrypoint-env.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-env.sh

ENTRYPOINT ["docker-entrypoint-env.sh"]
CMD ["postgres"]
