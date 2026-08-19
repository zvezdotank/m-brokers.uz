/* Форма заявки. Отправляет имя и телефон в обработчик, который кладёт
   лид в Telegram. Пока в config.js не задан formEndpoint, форма скрыта:
   лучше не показывать её вовсе, чем показать неработающей. */
(function () {
  'use strict';
  var endpoint = (window.MB && window.MB.formEndpoint || '').trim();
  var forms = document.querySelectorAll('.lead');
  if (!forms.length) return;
  if (!endpoint) return;                     // остаётся display:none из CSS

  var uz = document.documentElement.lang === 'uz';
  var T = uz ? {
    sending: 'Yuborilmoqda…',
    ok: 'Ariza qabul qilindi',
    okNote: 'Ish vaqtida 15 daqiqa ichida qo\'ng\'iroq qilamiz. Shoshilinch bo\'lsa — o\'zingiz qo\'ng\'iroq qiling:',
    err: 'Yuborilmadi',
    errNote: 'Aloqa uzilgan bo\'lsa kerak. Qo\'ng\'iroq qiling yoki Telegramga yozing:',
    badPhone: 'Telefon raqamini tekshiring'
  } : {
    sending: 'Отправляем…',
    ok: 'Заявка принята',
    okNote: 'Перезвоним в течение 15 минут в рабочее время. Если срочно — позвоните сами:',
    err: 'Не отправилось',
    errNote: 'Похоже, пропала связь. Позвоните или напишите в Telegram:',
    badPhone: 'Проверьте номер телефона'
  };

  /* Модальное окно с той же формой — для кнопки «Оставить заявку»
     в нижней панели на телефоне. Берём копию первой формы на странице,
     чтобы разметка и тексты не разъезжались. */
  var dlg = null;
  function buildModal(sample) {
    dlg = document.createElement('dialog');
    dlg.className = 'leadmodal';
    dlg.innerHTML =
      '<button class="leadmodal__close" type="button" aria-label="' +
        (uz ? 'Yopish' : 'Закрыть') + '">&times;</button>' +
      '<h2>' + (uz ? 'Raqamingizni qoldiring' : 'Оставьте номер') + '</h2>' +
      '<p>' + (uz
        ? 'Ish vaqtida 15 daqiqa ichida qo\'ng\'iroq qilamiz.'
        : 'В рабочее время перезваниваем в течение 15 минут.') + '</p>';
    var copy = sample.cloneNode(true);
    copy.dataset.place = 'модальное окно';
    copy.classList.remove('is-ready');
    dlg.appendChild(copy);
    document.body.appendChild(dlg);
    dlg.querySelector('.leadmodal__close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    bind(copy);
    copy.classList.add('is-ready');
    return copy;
  }

  window.mbOpenLead = function () {
    if (!dlg) buildModal(forms[0]);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    var first = dlg.querySelector('input[name=name]');
    if (first) setTimeout(function () { first.focus(); }, 50);
    if (window.mbTrack) window.mbTrack('lead_modal_open', {});
  };

  forms.forEach(bind);

  function bind(form) {
    form.classList.add('is-ready');
    var btn = form.querySelector('button[type=submit]');
    var btnText = btn.textContent;
    var status = form.querySelector('.lead__status');
    var phone = form.querySelector('input[name=phone]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.dataset.busy) return;

      // ловушка для ботов: поле скрыто от людей, заполнить его может только робот
      if (form.querySelector('input[name=company]').value) { form.reset(); return; }

      var digits = (phone.value.match(/\d/g) || []).length;
      if (digits < 9) {
        status.textContent = T.badPhone;
        status.className = 'lead__status is-err';
        phone.focus();
        return;
      }

      form.dataset.busy = '1';
      btn.disabled = true;
      btn.textContent = T.sending;
      status.textContent = '';
      status.className = 'lead__status';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.querySelector('input[name=name]').value.trim(),
          phone: phone.value.trim(),
          page: document.title,
          url: location.href,
          lang: document.documentElement.lang,
          ref: document.referrer || ''
        })
      })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json().catch(function(){return {}}); })
      .then(function () {
        if (window.mbTrack) window.mbTrack('form_submit', { placement: form.dataset.place || 'страница' });
        form.innerHTML =
          '<p class="lead__done"><strong>' + T.ok + '</strong>' + T.okNote +
          ' <a href="tel:+998957006216">+998 95 700-62-16</a></p>';
      })
      .catch(function () {
        delete form.dataset.busy;
        btn.disabled = false;
        btn.textContent = btnText;
        status.className = 'lead__status is-err';
        status.innerHTML = '<strong>' + T.err + '.</strong> ' + T.errNote +
          ' <a href="tel:+998957006216">+998 95 700-62-16</a>';
      });
    });
  }
})();
