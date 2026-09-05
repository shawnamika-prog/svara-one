CREATE TABLE sound_provider_capabilities (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_version TEXT,
    discovery_hash TEXT,
    capabilities_json TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    discovered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    last_verified_at TEXT,
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE (provider),
    CHECK (status IN ('active','discovery_failed','disabled')),
    CHECK (source IN ('provider_api','provider_adapter','configuration'))
);

CREATE INDEX idx_sound_provider_capabilities_provider
    ON sound_provider_capabilities(provider);

CREATE INDEX idx_sound_provider_capabilities_status
    ON sound_provider_capabilities(status);
