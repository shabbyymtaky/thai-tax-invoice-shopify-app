(function () {
  document.querySelectorAll('[data-tax-invoice-request]').forEach(function (root) {
    var form = root.querySelector('[data-tax-invoice-form]');
    var status = root.querySelector('[data-tax-invoice-status]');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      status.textContent = 'Submitting…';
      fetch('/apps/tax-invoice/request', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (response) { return response.json().then(function (body) { return { ok: response.ok, body: body }; }); })
        .then(function (result) {
          status.textContent = result.ok && result.body.ok ? result.body.message : (result.body.error || 'Could not submit request');
          if (result.ok && result.body.ok) form.reset();
        })
        .catch(function () { status.textContent = 'Could not submit request. Please contact the seller.'; });
    });
  });
})();
