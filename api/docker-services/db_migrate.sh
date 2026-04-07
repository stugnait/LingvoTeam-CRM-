#!/bin/sh

echo "### Running Migrations ###"
python manage.py migrate --noinput

exec "$@"