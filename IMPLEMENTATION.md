# Plano de implementação — Wagtail MCP Write

## Objetivo

Permitir criação, edição, publicação de páginas e upload de imagens no Wagtail via chat (Cursor Agent), com **mínima alteração no Django** e **foco no fork MCP**.

## Arquitetura

```
Cursor Agent
    └── wagtail-mcp (fork, Node/TS)
            ├── GET  /api/v2/*          → leitura (tools existentes)
            └── *    /api/write/v1/*    → escrita (wagtail-write-api)
                    └── Wagtail ORM
```

## Backend (logbit_b2b) — ~10% do esforço

| Item | Arquivo | Status |
|------|---------|--------|
| Dependência | `requirements-dev.txt` → `wagtail-write-api==0.8.4` | Feito |
| App | `logbit_b2b/settings/base.py` → `wagtail_write_api` | Feito |
| URL | `logbit_b2b/urls.py` → `/api/write/v1/` | Feito |
| Migrate | `python manage.py migrate` | Pendente (local) |
| Token | `python manage.py create_api_token admin` | Pendente (local) |

Docs interativas: `http://127.0.0.1:8000/api/write/v1/docs`

## MCP (wagtail-mcp fork) — ~90% do esforço

### Estrutura

```
src/
├── tools/              # leitura (v2 API)
├── actions/            # escrita (write API)
│   ├── get-content-schema.action.ts
│   ├── list-write-pages.action.ts
│   ├── get-write-page.action.ts
│   ├── create-page.action.ts
│   ├── update-page.action.ts
│   ├── publish-page.action.ts
│   ├── upload-image.action.ts
│   └── index.ts
└── utils/
    ├── config.ts       # v2 + write API URLs
    ├── http-client.ts  # axios + auth + multipart
    └── errors.ts
```

### Tools de escrita

| Tool | Endpoint write-api |
|------|-------------------|
| `get_content_schema` | `GET /schema/` |
| `list_write_pages` | `GET /pages/` |
| `get_write_page` | `GET /pages/{id}/` |
| `create_page` | `POST /pages/` |
| `update_page` | `PATCH /pages/{id}/` |
| `publish_page` | `POST /pages/{id}/publish/` |
| `upload_image` | `POST /images/` |

## Configuração MCP (Cursor)

```json
{
  "mcpServers": {
    "wagtail-mcp": {
      "command": "node",
      "args": ["/path/to/wagtail-mcp/dist/server.js"],
      "env": {
        "WAGTAIL_BASE_URL": "http://127.0.0.1:8000",
        "WAGTAIL_WRITE_API_PATH": "/api/write/v1",
        "WAGTAIL_API_KEY": "<token>"
      }
    }
  }
}
```

## Fluxo no Agente (PaginaConteudoLivrePremium)

1. `get_content_schema` → `page_type=home.PaginaConteudoLivrePremium`
2. `list_write_pages` → `type=home.FeedPage` (achar pai)
3. `create_page` → draft com `type`, `parent`, `title`, `fields`
4. `upload_image` → banner; `update_page` → `banner_image: <id>`
5. `update_page` → `secaopaginalivre_set` com blocos StreamField
6. `publish_page` → publicar

## Escopo MVP

- Page type: `home.PaginaConteudoLivrePremium`
- Idioma: pt-br (multi-idioma depois)
- Publicação: draft por padrão, `publish_page` explícito

## Próximos passos (local)

```bash
# Backend
cd logbit_b2b_master
pip install wagtail-write-api==0.8.4
python manage.py migrate
python manage.py create_api_token admin

# MCP
cd ../wagtail-mcp
npm install
npm run build
```

Validar pilot:

```bash
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/write/v1/schema/
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/write/v1/pages/?type=home.FeedPage
```

## Agente CMS (plataforma / chat)

O pacote [`wagtail_cms_agent`](file:///home/natalia/natalia/projetos_ndt/logbit/logbit_b2b_master/wagtail_cms_agent) no logbit conecta ao wagtail-mcp via MCP stdio + OpenAI para executar prompts.

- CLI: `python -m wagtail_cms_agent`
- API: `uvicorn wagtail_cms_agent.api:app --port 8765`

Documentação: [`docs/WAGTAIL_CMS_AGENT.md`](file:///home/natalia/natalia/projetos_ndt/logbit/logbit_b2b_master/docs/WAGTAIL_CMS_AGENT.md)

- `wagtail-write-api` não integra com `wagtail-localize` (multi-idioma adiado)
- Plugin em alpha — validar InlinePanel `secaopaginalivre_set` no pilot
- `upload_image` exige `file_path` local (filesystem do MCP server)

## Resultados do pilot (2026-05-27)

| Teste | Resultado |
|-------|-----------|
| `GET /schema/` | OK — FeedPage e PaginaConteudoLivrePremium listados |
| `GET /schema/home.PaginaConteudoLivrePremium/` | OK — campos expostos |
| `POST /pages/` (create draft) | OK após sync do campo `show_modal_comentarios` no model |
| `PATCH /pages/{id}/` (banner_image) | OK |
| `POST /pages/{id}/publish/` | OK — página live em `/conteúdo/teste-mcp-pilot/` |
| `POST /images/` (upload) | OK — image id 341 |
| `PATCH secaopaginalivre_set` (seções) | **OK** — Orderable + patch `wagtail_write_api_serialize.py` |

### Orderable (2026-05-27)

- `SecaoPaginaLivre` agora herda de `Orderable` + migration `0315` com `sort_order` preservando ordem por `id`
- Template usa `dictsort:"sort_order"`
- Schema expõe `secaopaginalivre_set` no write-api

**Formato de bloco `rich_text`:** enviar HTML string (`"<p>...</p>"`), não dict markdown — markdown em StreamField interno não é convertido.

**Páginas de teste:** 2108 (patch seção), 2109 (create com seção, live)

Página de teste criada: **id 2108**, slug `teste-mcp-pilot`, pai FeedPage **413** (Conteúdo).

### Fix aplicado no model

Coluna `show_modal_comentarios` existia no banco mas faltava no model Django — adicionado em `pagina_livre_premium.py` com `default=False`.

### Próximo passo para seções

Orderable + patch de serialização implementados. Ao atualizar seções via API, envie a **lista completa** de `secaopaginalivre_set` (o write-api substitui todos os filhos).
