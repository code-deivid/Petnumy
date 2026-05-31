import { createApp } from "vue";
import { Icon } from "@iconify/vue";
import { ICONS } from "./lib/icons.js";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router/index.js";
import i18n from "./i18n/index.js";

// Estilos globales
import "./assets/styles/main.css";
import "./assets/styles/components.css";
import "./assets/styles/animations.css";

// ── Restaurar tema (dark/light) antes de montar ───────────────
// Esto evita el "flash" de tema incorrecto al recargar
const savedTheme = localStorage.getItem("petnumy_theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
  document.documentElement.setAttribute("data-theme", "dark");
}

// ── Restaurar idioma ──────────────────────────────────────────
const savedLocale = localStorage.getItem("petnumy_locale") || "es";
document.documentElement.setAttribute("lang", savedLocale);

const app = createApp(App);
const pinia = createPinia();

app.component("Icon", Icon);
app.config.globalProperties.$icons = ICONS;

app.use(pinia);
app.use(router);
app.use(i18n);

// Restaurar sesión desde localStorage
import { useAuthStore } from "./stores/auth.store.js";
const authStore = useAuthStore();
authStore.restoreSession();

app.mount("#app");
