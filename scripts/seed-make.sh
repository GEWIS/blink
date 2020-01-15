#!/usr/bin/env bash
# A hack for prepending the timestamp to seed names until the knex guy
# gets off his high horse: https://github.com/knex/knex/issues/3623
yarn seed:make "$(date '+%Y%m%d%H%M%S')-$@"
