CREATE TABLE sound_provider_capabilities (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_version TEXT,
    discovery_hash TEXT,
    capabilities_json TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'provider',
    status TEXT NOT NULL DEFAULT 'active',
    discovered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    last_verified_at TEXT,
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE (provider),
    CHECK (status IN ('active','discovery_failed','invalid')),
    CHECK (source IN ('provider','adapter','configuration'))
);

CREATE INDEX idx_sound_provider_capabilities_status
    ON sound_provider_capabilities(status);

CREATE INDEX idx_sound_provider_capabilities_verified
    ON sound_provider_capabilities(last_verified_at);

CREATE INDEX idx_sound_provider_capabilities_hash
    ON sound_provider_capabilities(discovery_hash);
