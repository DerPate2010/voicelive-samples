# Known Issues — Java Backend (azure-ai-voicelive 1.0.0-beta.5)

## .env File Loading

Java doesn't have a built-in `dotenv` equivalent. The `Application.loadDotEnv()` method provides a simple `.env` file parser that sets values as system properties (not environment variables).

Environment variable lookups check `System.getenv()` first, then fall back to `System.getProperty()`. For production, set environment variables directly.

## Netty Version Mismatch Warning

Spring Boot 3.3.6 bundles Netty 4.1.115.Final, while the Azure SDK expects 4.1.130.Final. A warning is logged at startup but has no runtime impact. Override the Netty version in `pom.xml` if desired.
