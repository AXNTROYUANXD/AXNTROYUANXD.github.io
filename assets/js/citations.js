(function () {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    var copied = document.execCommand('copy');
    field.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error('Clipboard access is unavailable.'));
  }

  document.querySelectorAll('.cite-button').forEach(function (button) {
    button.addEventListener('click', function () {
      var source = document.getElementById(button.dataset.bibtexTarget);
      var bibtex = source && source.content ? source.content.textContent.trim() : source && source.textContent.trim();
      if (!bibtex) return;

      copyText(bibtex).then(function () {
        var originalLabel = button.textContent;
        button.textContent = '[Copied]';
        window.setTimeout(function () {
          button.textContent = originalLabel;
        }, 1400);
      }).catch(function () {
        button.textContent = '[Copy failed]';
      });
    });
  });
}());
