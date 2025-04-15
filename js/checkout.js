const venmoRadio = document.getElementById('venmo');
const paypalRadio = document.getElementById('paypal');
const mastercardRadio = document.getElementById('mastercard');


const venmoDetails = document.getElementById('venmo-details');
const paypalDetails = document.getElementById('paypal-details');
const mastercardDetails = document.getElementById('mastercard-details');


function togglePaymentFields() {
  if (venmoRadio.checked) {
    venmoDetails.style.display = 'block';
    paypalDetails.style.display = 'none';
    mastercardDetails.style.display = 'none';
  } else if (paypalRadio.checked) {
    venmoDetails.style.display = 'none';
    paypalDetails.style.display = 'block';
    mastercardDetails.style.display = 'none';
  } else if (mastercardRadio.checked) {
    venmoDetails.style.display = 'none';
    paypalDetails.style.display = 'none';
    mastercardDetails.style.display = 'block';
  } else {
    venmoDetails.style.display = 'none';
    paypalDetails.style.display = 'none';
    mastercardDetails.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  togglePaymentFields();

  venmoRadio.addEventListener('change', togglePaymentFields);
  paypalRadio.addEventListener('change', togglePaymentFields);
  mastercardRadio.addEventListener('change', togglePaymentFields);
});
