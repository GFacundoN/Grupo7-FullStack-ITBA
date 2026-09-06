document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const form = document.getElementById("contact-form");
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const mensajeInput = document.getElementById("mensaje");

  const errorNombre = document.getElementById("error-nombre");
  const errorEmail = document.getElementById("error-email");
  const errorMensaje = document.getElementById("error-mensaje");
  const successMessage = document.getElementById("success-message");
  const cartCounter = document.getElementById("cart-counter");

  // Simular contador del carrito leyendo desde localStorage 
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cartCounter.textContent = cart.length;

  // Manejo del envío del formulario
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Evita recargar la página

    // Limpiar errores previos
    clearErrors();

    let isValid = true;

    // Validación Nombre
    if (nombreInput.value.trim() === "") {
      showError(nombreInput, errorNombre, "El nombre es obligatorio.");
      isValid = false;
    }

    // Validación Email
    if (emailInput.value.trim() === "") {
      showError(emailInput, errorEmail, "El correo electrónico es obligatorio.");
      isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      showError(emailInput, errorEmail, "Ingresa un correo electrónico válido.");
      isValid = false;
    }

    // Validación Mensaje
    if (mensajeInput.value.trim() === "") {
      showError(mensajeInput, errorMensaje, "El mensaje no puede estar vacío.");
      isValid = false;
    } else if (mensajeInput.value.trim().length < 10) {
      showError(mensajeInput, errorMensaje, "El mensaje debe tener al menos 10 caracteres.");
      isValid = false;
    }

    // Si todo está correcto
    if (isValid) {
      // Ocultar formulario o limpiar campos y mostrar éxito con manipulación del DOM
      form.reset();
      successMessage.classList.remove("hidden");

      // Ocultar mensaje de éxito tras 4 segundos
      setTimeout(() => {
        successMessage.classList.add("hidden");
      }, 4000);
    }
  });

  // Funciones auxiliares
  function showError(input, errorElement, message) {
    input.classList.add("invalid");
    errorElement.textContent = message;
  }

  function clearErrors() {
    [nombreInput, emailInput, mensajeInput].forEach((input) => {
      input.classList.remove("invalid");
    });
    [errorNombre, errorEmail, errorMensaje].forEach((element) => {
      element.textContent = "";
    });
  }

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
});