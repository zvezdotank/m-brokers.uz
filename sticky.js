/* Интерфейсные мелочи, общие для всех страниц:
   1. Плавающая шапка — дубль исходной, выезжает, когда первый экран ушёл.
   2. Нижняя панель на телефоне: звонок и заявка — целевые действия.
   Шапка и панель показываются на одном и том же отрезке страницы:
   после первого экрана и до подвала. */
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

  /* ---- нижняя панель на телефоне: звонок и заявка ---- */
  var tel = document.querySelector('a[href^="tel:"]');
  var tg = document.querySelector('a[href*="t.me/"]');
  var uz = document.documentElement.lang === 'uz';
  if (tel) {
    callbar = document.createElement('div');
    callbar.className = 'callbar';
    var call = '<a class="callbar__call" href="' + tel.getAttribute('href') + '">' +
      (uz ? 'Qo\'ng\'iroq qilish' : 'Позвонить') + '</a>';
    // вторая кнопка открывает форму в модальном окне; если обработчик
    // заявок не настроен, форма не работает — тогда ведём в Telegram
    var second;
    if (window.MB && (window.MB.formEndpoint || '').trim()) {
      second = '<button class="callbar__lead" type="button">' +
        (uz ? 'Ariza qoldirish' : 'Оставить заявку') + '</button>';
    } else if (tg) {
      second = '<a class="callbar__tg" href="' + tg.getAttribute('href') +
        '" target="_blank" rel="noopener">Telegram</a>';
    } else { second = ''; }
    callbar.innerHTML = call + second;
    document.body.appendChild(callbar);
    document.body.classList.add('has-callbar');
    var leadBtn = callbar.querySelector('.callbar__lead');
    if (leadBtn) leadBtn.addEventListener('click', function () {
      if (window.mbOpenLead) window.mbOpenLead();
    });
  }

  /* ---- общий порог показа ---- */
  // низ первого блока: тёмный герой на главной, шапка страницы на внутренних.
  // от самой .topbar считать нельзя — она ~90px, и бар выезжал бы
  // поверх ещё видимого первого экрана
  var anchor = topbar ? (topbar.closest('.hero, .pagehead') || topbar) : null;

  var foot = document.querySelector('.foot');
  var until = Infinity;

  function measure() {
    if (!anchor) return;
    // нижняя граница: первый экран ушёл наверх
    threshold = anchor.getBoundingClientRect().bottom + window.pageYOffset - 80;
    // верхняя: показался подвал. Там уже есть телефон, адрес и Telegram,
    // и плавающая полоса поверх него только закрывает содержимое
    if (foot) {
      var footTop = foot.getBoundingClientRect().top + window.pageYOffset;
      until = footTop - window.innerHeight;
      if (until <= threshold) until = Infinity;   // короткая страница
    }
  }

  function update() {
    var y = window.pageYOffset;
    var should = y > threshold && y < until;
    if (should === on) return;
    on = should;
    if (bar) bar.classList.toggle('is-on', on);
    if (callbar) callbar.classList.toggle('is-on', on);
  }

  // без requestAnimationFrame: обработчик делает одно сравнение и
  // переключение класса, а в фоновой вкладке rAF не вызывается вовсе
  function onScroll() { update(); }

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  window.addEventListener('load', function () { measure(); update(); });

  /* ---- клавиатура на телефоне ----
     Панель прибита к низу экрана и при наборе перекрывает поля формы
     и кнопку отправки. Пока курсор в поле — убираем её. */
  if (callbar) {
    document.addEventListener('focusin', function (e) {
      if (e.target.closest && e.target.closest('form')) callbar.classList.add('is-typing');
    });
    document.addEventListener('focusout', function () {
      setTimeout(function () {
        var a = document.activeElement;
        if (!a || !a.closest || !a.closest('form')) callbar.classList.remove('is-typing');
      }, 80);
    });
  }

})();
