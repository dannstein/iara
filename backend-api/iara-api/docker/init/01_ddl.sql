-- Executado pelo postgres (superuser) antes do Flyway.
-- Cria as extensões necessárias para que a migration V1 funcione.
-- O schema completo é gerenciado pelo Flyway (V1__initial_schema.sql).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;