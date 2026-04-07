/**
 * Cloudflare Worker - HTMLRewriter によるheader/footer サーバーサイドインクルード
 * 
 * 静的アセットの配信 + HTMLページへの header.html / footer.html 注入
 * itscom並行運用中はクライアント側 loadHTML() がフォールバックとして残る
 */

// header/footer HTMLのキャッシュ（Worker起動中は保持）
let headerCache = null;
let footerCache = null;

/**
 * parts/header.html と parts/footer.html を取得（キャッシュ付き）
 */
async function getPartials(env, url) {
    if (!headerCache || !footerCache) {
        const base = new URL('/', url).href;
        const [headerRes, footerRes] = await Promise.all([
            env.ASSETS.fetch(new URL('/parts/header.html', base)),
            env.ASSETS.fetch(new URL('/parts/footer.html', base)),
        ]);
        if (headerRes.ok) headerCache = await headerRes.text();
        if (footerRes.ok) footerCache = await footerRes.text();
    }
    return { header: headerCache || '', footer: footerCache || '' };
}

export default {
    async fetch(request, env, ctx) {
        // ASSETS binding の存在確認
        if (!env?.ASSETS) {
            console.error('ASSETS binding is undefined. env keys:', Object.keys(env || {}));
            return new Response('ASSETS binding not available', { status: 500 });
        }

        // 静的アセットからレスポンスを取得
        const response = await env.ASSETS.fetch(request);
        const url = new URL(request.url);

        // HTMLでないレスポンスはそのまま返す（静的アセットにキャッシュヘッダー付与）
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
            // フォント・CSS・JS・画像に長期キャッシュを設定
            if (url.pathname.match(/\.(woff2|css|js|webp|ico)$/)) {
                const newHeaders = new Headers(response.headers);
                newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
            }
            return response;
        }

        // parts/ 自体へのリクエストはそのまま返す（無限ループ防止）
        if (url.pathname.startsWith('/parts/')) {
            return response;
        }

        // header/footer のHTML取得
        const { header, footer } = await getPartials(env, request.url);

        // HTMLRewriter で #header と #footer に注入
        return new HTMLRewriter()
            .on('#header', {
                element(el) {
                    if (header) {
                        el.setInnerContent(header, { html: true });
                    }
                }
            })
            .on('#footer', {
                element(el) {
                    if (footer) {
                        el.setInnerContent(footer, { html: true });
                    }
                }
            })
            .transform(response);
    }
};
