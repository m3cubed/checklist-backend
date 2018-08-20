#!/bin/bash
export PGPASSWORD="Alphamon11!@#"

echo "Configuring database: usersdb"

dropdb -U node_user usersdb
createdb -U node_user usersdb

psql -U node_user usersdb < ./init.sql

echo "usersdb configured"