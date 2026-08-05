const API_BASE = "https://goli-doli-ott-backend.vercel.app/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const GOLI_DOLI_CONFIG = {
  brandName: "Goli Doli",
  legalName: "Prism Media Networks Private Limited",
  supportEmail: "support@golidoli.com",
  businessEmail: "business@golidoli.com",
  phone: "+91-8279544828",
  office: "802/16A, Vasundhara, Ghaziabad, Uttar Pradesh 201012, India",
  hours: "Monday to Saturday, 10 AM to 6 PM IST",
};

function getAuthToken() {
  return localStorage.getItem("golidoli_token") || "";
}

function buildApiUrl(endpoint) {
  const cleanedEndpoint = endpoint.replace(/^\/api\/?/, "").replace(/^\//, "");
  return `${API_BASE}/${cleanedEndpoint}`;
}

function resolveAssetUrl(url) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}/${String(url).replace(/^\//, "")}`;
}
