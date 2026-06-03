-- V14: Multi-channel + Disaster Mode (Fase 3C)

-- Tabela de envios por canal. Cada linha = uma tentativa de envio por um canal
-- específico (LOG, EMAIL, SMS, etc.). Liga o destinatário (1 row por usuário/alerta
-- em iara_alerta_destinatario) aos canais que foram acionados.
CREATE TABLE iara_notificacao_envio (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_alerta       UUID NOT NULL REFERENCES iara_alerta(id) ON DELETE CASCADE,
    id_usuario      UUID NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    canal           VARCHAR(20) NOT NULL,         -- LOG | EMAIL | SMS | WHATSAPP | PUSH
    status          VARCHAR(20) NOT NULL,         -- ENVIADO | FALHOU | IGNORADO
    erro            TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_envio_alerta ON iara_notificacao_envio (id_alerta, sent_at DESC);
CREATE INDEX idx_notif_envio_canal  ON iara_notificacao_envio (canal, sent_at DESC);

-- Estado global da aplicação. Atualmente: flag de disaster mode.
-- Modelado como key-value para extensibilidade. Sempre lido com cache de 30s.
CREATE TABLE iara_app_config (
    chave           VARCHAR(80) PRIMARY KEY,
    valor           TEXT,
    descricao       TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID REFERENCES iara_usuario(id)
);

INSERT INTO iara_app_config (chave, valor, descricao) VALUES
    ('DISASTER_MODE_ATIVO', 'false',
     'Quando ATIVO: jobs não-críticos são pausados, alertas automáticos param de disparar, e a UI mostra banner.'),
    ('CANAIS_HABILITADOS', 'LOG',
     'CSV de canais ativados globalmente. Default LOG. Valores possíveis: LOG,EMAIL,SMS,WHATSAPP,PUSH.');
