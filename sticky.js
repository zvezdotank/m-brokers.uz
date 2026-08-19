/* Интерфейсные мелочи, общие для всех страниц:
   1. Плавающая шапка — дубль исходной, выезжает, когда первый экран ушёл.
   2. Панель звонка внизу на телефоне — главное целевое действие.
   3. Карта грузится по клику: виджет Яндекса весит больше всей страницы,
      а нужен единицам, поэтому в разметке лежит кнопка, а не iframe. */
(function () {
  'use strict';

  var topbar = document.querySelector('.topbar');
  var bar = null, callbar = null, threshold = 0, on = false;

  /* ---- плавающая шапка ---- */
  if (topbar) {
    bar = document.createElement('div');
    bar.className = 'stickybar';
    bar.setAttribute('aria-hidden', 'true');
    var inner = document.createElement('div');
    inner.className = 'stickybar__in';
    inner.innerHTML = topbar.innerHTML;
    bar.appendChild(inner);
    // копия не должна попадать в таб-порядок и к скринридеру:
    // иначе на странице оказывается две одинаковые навигации
    inner.querySelectorAll('a, button, [tabindex]').forEach(function (el) {
      el.setAttribute('tabindex', '-1');
    });
    document.body.appendChild(bar);
  }

  /* ---- панель звонка на телефоне ---- */
  var tel = document.querySelector('a[href^="tel:"]');
  var tg = document.querySelector('a[href*="t.me/"]');
  if (tel) {
    var uz = document.documentElement.lang === 'uz';
    callbar = document.createElement('div');
    callbar.className = 'callbar';
    callbar.innerHTML =
      '<a class="callbar__call" href="' + tel.getAttribute('href') + '">' +
        (uz ? 'Qo'ng'iroq qilish' : 'Позвонить') + '</a>' +
      (tg ? '<a class="callbar__tg" href="' + tg.getAttribute('href') +
            '" target="_blank" rel="noopener">Telegram</a>' : '');
    document.body.appendChild(callbar);
    document.body.classList.add('has-callbar');
  }

  /* ---- общий порог показа ---- */
  // низ первого блока: тёмный герой на главной, шапка страницы на внутренних.
  // от самой .topbar считать нельзя — она ~90px, и бар выезжал бы
  // поверх ещё видимого первого экрана
  var anchor = topbar ? (topbar.closest('.hero, .pagehead') || topbar) : null;

  function measure() {
    if (!anchor) return;
    threshold = anchor.getBoundingClientRect().bottom + window.pageYOffset - 80;
  }

  function update() {
    var should = window.pageYOffset > threshold;
    if (should === on) return;
    on = should;
    if (bar) bar.classList.toggle('is-on', on);
    if (callbar) callbar.classList.toggle('is-on', on);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  window.addEventListener('load', function () { measure(); update(); });

  /* ---- карта по клику ---- */
  document.querySelectorAll('.map__load').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = btn.getAttribute('data-map');
      frame.title = btn.getAttribute('data-title') || '';
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('loading', 'eager');
      var box = btn.closest('.map');
      box.appendChild(frame);
      box.classList.add('is-loaded');
      btn.remove();
    });
  });
})();
