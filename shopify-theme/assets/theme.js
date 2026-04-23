// Toggle header transparent/opaque on scroll on the home page.
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;
  var isHome = header.classList.contains('is-home');
  if (!isHome) {
    header.classList.add('is-opaque');
    return;
  }
  var setState = function () {
    if (window.scrollY > 60) {
      header.classList.add('is-opaque');
      header.classList.remove('is-transparent');
    } else {
      header.classList.remove('is-opaque');
      header.classList.add('is-transparent');
    }
  };
  setState();
  window.addEventListener('scroll', setState, { passive: true });
})();

// Mobile menu toggle.
(function () {
  var btn = document.querySelector('[data-mobile-menu]');
  var panel = document.querySelector('[data-mobile-panel]');
  if (!btn || !panel) return;
  btn.addEventListener('click', function () {
    panel.toggleAttribute('hidden');
  });
})();
