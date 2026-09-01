/* Аналитика и цели. Без идентификатора в config.js ничего не грузится,
   поэтому файл безопасно висит на всех страницах заранее. */
(function () {
  'use strict';
  var id = (window.MB && window.MB.ga4 || '').trim();
  if (!id) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id);

  // Google Ads считает конверсию сам, не дожидаясь, пока GA4 обработает
  // событие и отдаст его на импорт. Один gtag.js обслуживает оба адресата.
  var aw = (window.MB && window.MB.aw || '').trim();
  var awLabel = (window.MB && window.MB.awPhoneLabel || '').trim();
  if (aw) gtag('config', aw);

  // Цели. Клик считаем в момент нажатия: переход по tel: уводит со страницы,
  // поэтому событие отправляем до того, как браузер откроет звонилку.
  // Имена click_phone и click_telegram заданы системой Sales HUB —
  // именно под ними там размечается «звонок». Не переименовывать.
  function track(name, params) {
    gtag('event', name, params || {});
  }
  window.mbTrack = track;

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var where = a.closest('.callbar') ? 'мобильная панель'
              : a.closest('.stickybar') ? 'плавающая шапка'
              : a.closest('.topbar') ? 'шапка'
              : a.closest('.cta') ? 'блок призыва'
              : a.closest('.foot') ? 'подвал'
              : a.closest('.hero') ? 'первый экран' : 'страница';

    if (href.indexOf('tel:') === 0) {
      track('click_phone', { placement: where });
      // То же нажатие уходит в Google Ads отдельной конверсией. Без ярлыка
      // не отправляем ничего: пустой send_to Google молча проглатывает, и
      // потом не понять, считается конверсия или нет.
      if (aw && awLabel) gtag('event', 'conversion', { send_to: aw + '/' + awLabel });
    }
    else if (href.indexOf('t.me/') > -1) track('click_telegram', { placement: where });
    else if (href.indexOf('mailto:') === 0) track('email_click', { placement: where });
  }, true);
})();
