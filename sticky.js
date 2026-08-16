/* Плавающая шапка.
   Клонирует исходную .topbar и показывает копию, когда оригинал ушёл за экран.
   Копия помечена aria-hidden и убрана из таб-порядка: для скринридера и
   клавиатуры остаётся одна шапка — исходная, иначе вышло бы две навигации. */
(function () {
  var topbar = document.querySelector('.topbar');
  if (!topbar) return;

  var bar = document.createElement('div');
  bar.className = 'stickybar';
  bar.setAttribute('aria-hidden', 'true');

  var inner = document.createElement('div');
  inner.className = 'stickybar__in';
  inner.innerHTML = topbar.innerHTML;
  bar.appendChild(inner);

  inner.querySelectorAll('a, button, [tabindex]').forEach(function (el) {
    el.setAttribute('tabindex', '-1');
  });

  document.body.appendChild(bar);

  // Порог — низ первого блока: тёмного героя на главной или шапки страницы
  // на внутренних. Считать от самой .topbar нельзя: она высотой ~90px, и бар
  // выезжал бы поверх ещё видимого первого экрана.
  var anchor = topbar.closest('.hero, .pagehead') || topbar;

  var threshold = 0;
  function measure() {
    var r = anchor.getBoundingClientRect();
    threshold = r.bottom + window.pageYOffset - 80;
  }

  var on = false;
  function update() {
    var should = window.pageYOffset > threshold;
    if (should === on) return;
    on = should;
    bar.classList.toggle('is-on', on);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    // при переносе меню на другое число строк высота шапки меняется
    measure();
    update();
  });
  window.addEventListener('load', function () { measure(); update(); });
})();
