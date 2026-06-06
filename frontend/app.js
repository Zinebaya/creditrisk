const featureSchema = [
  "loan_amnt",
  "term",
  "int_rate",
  "installment",
  "annual_inc",
  "dti",
  "delinq_2yrs",
  "inq_last_6mths",
  "open_acc",
  "pub_rec",
  "revol_bal",
  "revol_util",
  "total_acc",
  "debt_to_income_ratio",
  "credit_utilization",
  "income_stability_index",
];

const form = document.getElementById("predict-form");
const inputsContainer = document.getElementById("inputs");
const resultSection = document.getElementById("result");
const errorSection = document.getElementById("error");

function createInputs() {
  featureSchema.forEach((feature) => {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = feature.replace(/_/g, " ");
    const input = document.createElement("input");
    input.name = feature;
    input.type = "number";
    input.step = "any";
    input.placeholder = `Enter ${feature}`;
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    inputsContainer.appendChild(wrapper);
  });
}

function showResult(data) {
  resultSection.classList.remove("hidden");
  errorSection.classList.add("hidden");
  resultSection.innerHTML = `
    <h3>Prediction result</h3>
    <p><strong>Risk:</strong> ${data.risk}</p>
    <p><strong>Decision:</strong> ${data.decision}</p>
    <p><strong>Probability:</strong> ${data.probability}</p>
  `;
}

function showError(message) {
  errorSection.classList.remove("hidden");
  resultSection.classList.add("hidden");
  errorSection.textContent = message;
}

async function login(credentials) {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }
  return response.json();
}

async function predict(payload) {
  const token = localStorage.getItem("credit_risk_token") || "";
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Prediction failed");
  }
  return response.json();
}

const loginForm = document.getElementById("login-form");
const predictForm = document.getElementById("predict-form");
const loginStatus = document.getElementById("login-status");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get("email").trim();
  const password = formData.get("password").trim();

  try {
    const data = await login({ email, password });
    localStorage.setItem("credit_risk_token", data.access_token);
    loginStatus.textContent = `Logged in as ${email}`;
    loginStatus.style.color = "#166534";
    predictForm.classList.remove("hidden");
  } catch (err) {
    loginStatus.textContent = err.message;
    loginStatus.style.color = "#991b1b";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const payload = {};
  featureSchema.forEach((field) => {
    payload[field] = parseFloat(formData.get(field) || 0);
  });

  try {
    const result = await predict(payload);
    showResult(result);
  } catch (err) {
    showError(err.message);
  }
});

createInputs();
