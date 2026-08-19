/* Обработчик заявок с сайта m-brokers.uz.
 *
 * Зачем он нужен. Отправлять заявку из браузера прямо в Telegram нельзя:
 * для этого пришлось бы положить токен бота в скрипт на сайте, а он
 * открыт всем. По такому токену посторонний может писать в канал от имени
 * бота, читать переписку и удалять сообщения. Поэтому токен лежит здесь,
 * в переменных окружения воркера, и наружу не выходит.
 *
 * Переменные окружения (Settings → Variables, оба как Secret):
 *   BOT_TOKEN — токен бота от @BotFather
 *   CHAT_ID   — идентификатор канала, например -1001234567890
 *
 * Развернуть: dash.cloudflare.com → Workers & Pages → Create → Worker,
 * вставить этот файл, задать переменные, скопировать адрес *.workers.dev
 * и вписать его в config.js на сайте.
 */

const ALLOWED = ['https://m-brokers.uz', 'https://www.m-brokers.uz'];

function cors(origin) {
  const allow = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = cors(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
    if (origin && !ALLOWED.includes(origin)) return new Response('Forbidden', { status: 403, headers });

    let data;
    try { data = await request.json(); }
    catch { return Response.json({ ok: false, error: 'bad json' }, { status: 400, headers }); }

    const name = String(data.name || '').trim().slice(0, 100);
    const phone = String(data.phone || '').trim().slice(0, 40);
    const digits = (phone.match(/\d/g) || []).length;
    if (digits < 9) return Response.json({ ok: false, error: 'bad phone' }, { status: 400, headers });

    const lines = [
      '<b>Заявка с сайта m-brokers.uz</b>',
      '',
      `<b>Имя:</b> ${esc(name) || '—'}`,
      `<b>Телефон:</b> ${esc(phone)}`,
      `<b>Страница:</b> ${esc(String(data.page || '').slice(0, 120))}`,
      `<b>Язык:</b> ${esc(String(data.lang || '').slice(0, 5))}`
    ];
    const ref = String(data.ref || '').slice(0, 200);
    if (ref) lines.push(`<b>Откуда пришёл:</b> ${esc(ref)}`);
    const url = String(data.url || '').slice(0, 200);
    if (url) lines.push('', esc(url));

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: lines.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!tg.ok) {
      // тело ответа Telegram в браузер не отдаём — там бывает эхо токена
      console.log('telegram error', tg.status, await tg.text());
      return Response.json({ ok: false }, { status: 502, headers });
    }
    return Response.json({ ok: true }, { headers });
  }
};
