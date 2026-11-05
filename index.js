/**
 * Host half of the opencode-go bundle.
 *
 * Two contributions:
 *  - `llm-pi-ai/request-headers` adds the `x-opencode-session` header that
 *    OpenCode Go requires on inference calls. The value is the real DSH
 *    Session id for session-bound calls; auxiliary calls without one get a
 *    stable process-local fallback so they are still routable.
 *  - A same-origin catalog relay so the settings page does not depend on
 *    browser CORS or a deployment CSP allowing a cross-origin request to
 *    opencode.ai.
 */
import { randomUUID } from 'node:crypto';

const MODELS_URL = 'https://opencode.ai/inference/go/v1/models';
const ROUTE_PATH = '/dsh-opencode-go/models';
const FALLBACK_SESSION = 'dsh-opencode-' + randomUUID();

function isOpenCodeRoute(provider) {
  return (
    provider === 'opencode-go' ||
    provider === 'opcode-go' ||
    provider.startsWith('opencode-go--') ||
    provider.startsWith('opcode-go--')
  );
}

function sessionHeaderValue(request) {
  const id = request.sessionId;
  if (typeof id === 'string' && id.length > 0) return id;
  const raw =
    typeof request.purpose === 'string' && request.purpose.length > 0 ? request.purpose : 'default';
  const purpose = raw.replace(/[^A-Za-z0-9._:-]/g, '_').slice(0, 64) || 'default';
  return FALLBACK_SESSION + ':' + purpose;
}

export function apply(ctx) {
  ctx.effect(
    () =>
      ctx.on('llm-pi-ai/request-headers', (request, headers, next) => {
        if (isOpenCodeRoute(request.provider)) {
          const id = request.sessionId;
          if (typeof id === 'string' && id.length > 0) {
            headers.set('x-opencode-session', id);
          } else if (!headers.has('x-opencode-session')) {
            headers.set('x-opencode-session', sessionHeaderValue(request));
          }
        }
        return next();
      }),
    'opencode-go: session header',
  );

  ctx.inject(['webServer'], (child) => {
    child.effect(
      () =>
        child.webServer.register({
          kind: 'exact',
          path: ROUTE_PATH,
          resource: async (request) => {
            if (request.method !== 'GET' && request.method !== 'HEAD') {
              return new Response('Method Not Allowed', {
                status: 405,
                headers: { allow: 'GET, HEAD' },
              });
            }
            try {
              const upstream = await fetch(MODELS_URL, {
                headers: { accept: 'application/json' },
                signal: AbortSignal.timeout(15000),
              });
              const body = await upstream.text();
              return new Response(request.method === 'HEAD' ? null : body, {
                status: upstream.status,
                headers: {
                  'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
                  'cache-control': 'no-store',
                },
              });
            } catch (error) {
              return Response.json(
                { error: error instanceof Error ? error.message : String(error) },
                { status: 502 },
              );
            }
          },
        }),
      'opencode-go: catalog relay',
    );
  });
}
