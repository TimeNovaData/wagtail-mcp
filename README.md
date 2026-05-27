# Wagtail MCP Server

MCP server for Wagtail CMS: **read** via Wagtail API v2 and **write** via [wagtail-write-api](https://tomdyson.github.io/wagtail-write-api/).

Built on [`FastMCP`](https://github.com/punkpeye/fastmcp).

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for architecture and setup plan.

## Prerequisites

- Node.js >= 21.7
- Wagtail instance with:
  - API v2 enabled (`/api/v2/`)
  - [wagtail-write-api](https://pypi.org/project/wagtail-write-api/) installed (`/api/write/v1/`)
  - API token: `python manage.py create_api_token <username>`

## Configuration

Add the following JSON to the MCP configuration file for your environment (e.g. `claude_desktop_config.json` for Claude Desktop):

```json
{
  "mcpServers": {
    "wagtail-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "wagtail-mcp"
      ],
      "env": {
        "WAGTAIL_BASE_URL": "https://api.example.com",
        "WAGTAIL_WRITE_API_PATH": "/api/write/v1",
        "WAGTAIL_API_KEY": "your-token-here"
      }
    }
  }
}
```

Make sure to set `WAGTAIL_BASE_URL` to the base URL of your Wagtail API instance.


## Implemented Tools

### Read (Wagtail API v2)

*   **`search_pages`**: Searches pages from the Wagtail CMS API.
    *   Parameters:
        *   `query` (string): The term to search for in page content.
        *   `type` (string, optional): Filters results to a specific page type (e.g., `blog.BlogPage`, `myapp.StandardPage`).
        *   `locale` (string, optional, default: `en`): Filters pages by a specific locale code (e.g., `en` for English, `es` for Spanish).
        *   `search_operator` (string, optional, values: `and`, `or`): Determines how multiple terms in the `query` are combined. Defaults based on the Wagtail search backend configuration.
        *   `limit` (integer, optional, default: `50`): The maximum number of page results to return.
        *   `offset` (integer, optional): The starting point for paginated results (e.g., an `offset` of `10` skips the first 10 results).
        *   `fields` (string, optional): A comma-separated list to control which fields are returned in the response for each page. Examples: `title,body` (returns only title and body), `*,-summary` (returns all fields except summary), `_,custom_field_name` (returns default fields plus a specific custom field). Refer to Wagtail API documentation for more on field selection syntax.
    *   Usage: Useful for finding pages matching certain keywords, potentially filtered by their type or language. For example, searching for all "news" articles in Spanish. Returns a list of pages with their details.

*   **`get_page_details`**: Retrieves the full details of a specific Wagtail page.
    *   Parameters (at least one of `id`, `slug`, or `url` is **required**; priority is `id` > `slug` > `url`):
        *   `id` (integer, optional): The unique numeric ID of the page.
        *   `slug` (string, optional): The slug (URL path component) of the page (e.g., `about-us/team`).
        *   `url` (string, optional): The full public URL of the page.
        *   `fields` (string, optional): A comma-separated list to control which fields are returned in the response. This allows for fetching specific data points or excluding others.
            *   Examples:
                *   `body,feed_image`: Returns only the `body` and `feed_image` fields.
                *   `*,-title`: Returns all fields except `title`.
                *   `_,my_custom_field`: Returns default fields plus `my_custom_field`. (Refer to Wagtail API documentation for more on field selection syntax).
    *   Usage: Use this to fetch comprehensive data for a known page, such as its content, metadata, or custom fields, after identifying it via `search_pages` or other means. Returns the full page object.

*   **`search_documents`**: Searches for Wagtail documents (e.g., PDFs, images uploaded to the media library).
    *   Parameters:
        *   `query` (string, **required**): The search term to use for finding documents by their title or other indexed metadata.
        *   `search_operator` (string, optional, values: `and`, `or`, default: `and`): Specifies how multiple terms in the `query` are combined (`and` requires all terms to match, `or` requires at least one).
    *   Usage: Helps locate documents within the Wagtail CMS based on keywords. For instance, finding all PDF documents containing "annual report". Returns a list of matching documents including their ID, title, and download URL.

*   **`get_document_details`**: Retrieves detailed information for a specific Wagtail document.
    *   Parameters:
        *   `id` (integer, **required**): The unique numeric ID of the document.
    *   Usage: After finding a document's ID (e.g., via `search_documents`), use this to get its specific details, primarily its ID, title and download URL.

### Write (wagtail-write-api)

Requires `WAGTAIL_API_KEY` (Bearer token).

*   **`get_content_schema`**: Returns page types, fields, StreamField blocks, and InlinePanel children. Call before create/update.
*   **`list_write_pages`**: Lists pages (filter by type, parent, search). Use to find FeedPage parent IDs.
*   **`get_write_page`**: Full page detail including draft content and sections.
*   **`create_page`**: Creates a page (draft by default). Params: `type`, `parent`, `title`, optional `slug`, `fields`, `action`.
*   **`update_page`**: PATCH page fields. Params: `id`, `fields`, optional `action=publish`.
*   **`publish_page`**: Publishes the latest draft revision.
*   **`upload_image`**: Uploads image from local `file_path`. Returns image ID for use in page fields.


## Configuration Details

Environment variables can be passed in via the MCP configuration file for your environment (e.g. `claude_desktop_config.json`):

*   **Wagtail API Configuration:**
    *   `WAGTAIL_BASE_URL`: **Required**. The base URL of your Wagtail instance (e.g., `http://127.0.0.1:8000`).
    *   `WAGTAIL_API_PATH`: (Optional) Read API path. Defaults to `/api/v2`.
    *   `WAGTAIL_WRITE_API_PATH`: (Optional) Write API path. Defaults to `/api/write/v1`.
    *   `WAGTAIL_API_KEY`: **Required for write tools**. Bearer token from `python manage.py create_api_token`.
