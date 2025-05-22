#!/bin/sh

# until nc -z -v -w30 postgres 5432
# do
#   echo "Waiting for PostgreSQL database connection..."
#   sleep 1
# done

# sleep 3

# pnpm db:push
pnpm start --filter backend
