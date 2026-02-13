
(() => {
  const LANGUAGE_STORAGE_KEY = "techstuf_language";
  const LANGUAGE_OVERRIDE_KEY = "techstuf_language_override";
  const COUNTRY_CODE_KEY = "techstuf_country_code";
  const GEO_OVERRIDE_KEY = "techstuf_geo_override";
  const GEO_TTL_MS = 1000 * 60 * 60 * 24 * 14;

  const SUPPORTED_LANGS = ["en", "ru"];
  const LOCALE_MAP = {
    en: "en-US",
    ru: "ru-RU",
  };

  const COUNTRY_LANGUAGE_MAP = {
    RU: "ru",
    BY: "ru",
    KZ: "ru",
    UA: "ru",
    KG: "ru",
    US: "en",
    GB: "en",
    UK: "en",
    CA: "en",
    AU: "en",
    NZ: "en",
    IE: "en",
    ZA: "en",
    FR: "en",
    DE: "en",
    IT: "en",
    ES: "en",
    PT: "en",
    NL: "en",
    SE: "en",
    NO: "en",
    DK: "en",
    FI: "en",
    CH: "en",
    AT: "en",
    BE: "en",
  };

  const TRANSLATIONS = {
    en: {
      meta: {
        title: "Techstuf | High-performance tech for everyday missions",
        description:
          "Techstuf is a professional tech store for everyday customers and business buyers. Premium gear, fast shipping, and reliable bundles.",
      },
      brand: {
        tagline: "Netlify + Supabase storefront",
        admin_tagline: "Admin & owner access",
        owner_tagline: "Owner dashboard",
        admin_console_tagline: "Admin console",
      },
      nav: {
        shop: "Shop",
        bundles: "Bundles",
        studio: "Studio Picks",
        account: "Account",
        support: "Support",
        back_to_store: "Back to store",
        admin_login: "Admin login",
        owner_dashboard: "Owner dashboard",
      },
      header: {
        search_label: "Search",
        search_placeholder: "Search gear",
        cart: "Cart",
      },
      lang: {
        label: "Language",
        auto: "Auto",
        en: "English",
        ru: "Russian",
        use_gps: "Use GPS",
        detecting: "Detecting your location...",
        gps_denied: "Location access denied.",
        gps_failed: "Could not detect location.",
        gps_set: "Language updated from GPS.",
        ip_failed: "Could not detect location by IP.",
      },
      hero: {
        eyebrow: "Techstuf drop 02",
        title: "Gear that keeps up with fast, ambitious work.",
        lede:
          "Techstuf is a professional tech retailer offering curated products sourced from trusted suppliers and delivered with care.",
        cta_shop: "Shop the drop",
        cta_bundle: "Build a bundle",
        meta_rating: "avg product rating",
        meta_delivery: "average delivery window",
        meta_supabase: "Supabase",
        meta_connecting: "connecting...",
        card1_tag: "Creator kit",
        card1_desc: "Balanced audio, instant voice isolation.",
        card2_tag: "Pro build",
        card2_desc: "Desktop-class power without the tower.",
        card3_tag: "Desk flow",
        card3_desc: "Wide, warm, color-accurate workspace.",
        badge_weekend: "Weekend",
        badge_drop: "Drop",
      },
      shop: {
        title: "Shop the Techstuf floor",
        subtitle:
          "Every item is verified for build quality, firmware support, and creator-friendly return windows.",
      },
      bundles: {
        title: "Bundle builder",
        subtitle:
          "Pick a focus. We stack complementary gear with shared color temperature, cable standards, and power needs.",
        option_creator: "Creator Studio",
        option_gaming: "Latency Killer",
        option_remote: "Remote Command",
        option_mobile: "Mobile Vault",
        summary_loading: "Popular bundle loading...",
        card_title: "Supabase-ready catalog",
        card_desc:
          "Sync inventory, pricing, and product images directly from your Supabase table. Netlify deploys the storefront in seconds.",
        card_li1: "Live stock status and pricing",
        card_li2: "Customer favorites + ratings",
        card_li3: "Cart persistence in local storage",
        view_setup: "View setup notes",
        kit: "{{bundle}} kit",
      },
      studio: {
        title: "Built for everyday customers and business buyers.",
        desc:
          "Techstuf serves home users, teams, and growing businesses with reliable gear, clear warranties, and fast restocks.",
        list1_title: "Sound + stream",
        list1_desc: "Mixers, microphones, and voice isolation gear.",
        list2_title: "Desk command",
        list2_desc: "Monitors, light bars, and productivity controllers.",
        list3_title: "Compute muscle",
        list3_desc: "Docking stations, thermal modules, and NAS kits.",
        panel1_title: "Shipment rhythm",
        panel1_desc: "Daily restocks at 10:00 and 16:00 UTC. Most orders ship same day.",
        panel2_title: "Community feedback",
        panel2_desc: "Requests and spec changes flow straight into the Supabase backlog.",
      },
      auth: {
        buyer_title: "Buyer account",
        buyer_desc: "Create an account to track orders and speed up checkout.",
        buyer_create: "Create buyer account",
        buyer_login: "Buyer login",
        buyer_status_default: "Not signed in.",
        admin_title: "Admin access",
        admin_desc: "Admins need owner approval before accessing management tools.",
        admin_request: "Request admin account",
        admin_login: "Admin login",
        admin_status_default: "Admin access requires approval.",
        owner_title: "Owner login",
        owner_desc: "Owner accounts are created in Supabase Auth and approved manually.",
        owner_login: "Owner login",
        sign_out: "Sign out",
        owner_status_default: "Owner access only.",
        email_placeholder: "Email address",
        password_placeholder: "Password",
        create_password_placeholder: "Create password",
        admin_email_placeholder: "Admin email",
        owner_email_placeholder: "Owner email",
        reason_placeholder: "Why do you need admin access?",
        admin_helper: "Need access? Request admin access on the main site.",
      },
      support: {
        title: "Need help tuning a rig?",
        desc: "Tech advisors run live chat every day. We answer within 12 minutes.",
        chat_btn: "Start live chat",
        newsletter_title: "Get the signal update",
        newsletter_desc: "Weekly drops, open-box deals, and exclusive kits.",
        newsletter_placeholder: "you@studio.com",
        newsletter_join: "Join",
      },
      footer: {
        tagline: "Future-ready gear, shipped fast.",
        secure_checkout: "Secure checkout",
        returns: "30-day returns",
        studio_pricing: "Studio pricing",
      },
      cart: {
        title: "Your cart",
        close: "Close",
        subtotal: "Subtotal",
        paypal_note: "Secure checkout with PayPal.",
        checkout: "Checkout",
        taxes_note: "Taxes and shipping calculated at checkout.",
        empty: "Add items to checkout with PayPal.",
        qty: "Qty",
        remove: "Remove",
      },
      toast: {
        added: "Added to cart",
        newsletter: "Welcome to the signal update",
        payment_complete: "Payment complete",
        payment_failed: "Payment failed",
        paypal_failed: "PayPal failed to load",
        auth_missing: "Supabase auth not configured",
        buyer_created: "Buyer account created. Check email to confirm.",
        buyer_login: "Buyer login successful",
        admin_created: "Admin account created. Requesting approval.",
        admin_login: "Admin login successful",
        owner_login: "Owner login successful",
        signed_out: "Signed out",
        admin_request_saved_error:
          "Admin request not saved. Check admin_requests table and policies.",
        admin_request_submitted: "Admin request submitted",
        sign_in_first: "Sign in first to request admin access",
      },
      review: {
        title: "Product reviews",
        meta: "Customer ratings and feedback.",
        close: "Close",
        rating_label: "Rating",
        comment_label: "Comment",
        comment_placeholder: "Share your experience",
        submit: "Submit review",
        login_required: "Login required to post.",
        no_reviews: "No reviews yet. Be the first to review.",
        no_comment: "No comment provided.",
        verified_buyer: "Verified buyer",
        view_video: "View video",
        select_label: "Select",
        opt_5: "5 - Excellent",
        opt_4: "4 - Great",
        opt_3: "3 - Good",
        opt_2: "2 - Fair",
        opt_1: "1 - Poor",
        rating_error: "Please select a rating between 1 and 5.",
        submit_success: "Review submitted.",
        submit_failed: "Submit failed: {{message}}",
        title_with_product: "{{name}} reviews",
        count: "{{count}} review(s)",
      },
      setup: {
        title: "Supabase setup notes",
        step1:
          "Create a `products` table with columns: name, category, price, rating, badge, description, image_url, video_url, image_hue.",
        step2: "Enable RLS and add a public read policy for active products.",
        step3: "Fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` in app.js to connect.",
        got_it: "Got it",
      },
      analytics: {
        title: "Sales analytics",
        desc: "PayPal captures recorded in Supabase.",
        total_revenue: "Total revenue",
        total_orders: "Total orders",
        avg_order: "Avg order",
        last_7: "Last 7 days",
        top_product: "Top product",
        recent_orders: "Recent orders",
        order_date: "Date",
        order_id: "Order",
        order_email: "Customer",
        order_total: "Total",
        order_status: "Status",
        no_orders: "No orders yet.",
        loading: "Loading sales data...",
        not_ready: "Orders table not accessible. Run the sales analytics SQL.",
        updated: "Sales data updated.",
      },
      supabase: {
        local_demo: "local demo",
        offline_demo: "offline, using demo",
        synced: "synced {{count}} items",
      },
      filters: {
        all: "All",
      },
      product: {
        add_to_cart: "Add to cart",
        reviews: "Reviews",
        unnamed: "Unnamed product",
        default_category: "Gear",
        default_badge: "Live",
        default_desc: "Supabase item",
      },
      status: {
        auth_missing: "Auth not configured.",
        admin_requires: "Admin access requires approval.",
        owner_only: "Owner access only.",
        not_signed_in: "Not signed in.",
        signed_in_as: "Signed in as {{email}}.",
        owner_logged_in: "Owner logged in.",
        owner_access_granted: "Owner access granted.",
        admin_access_approved: "Admin access approved.",
        admin_access_pending: "Admin access pending owner approval.",
      },
      review_form: {
        login_required: "Please log in to submit a review.",
      },
      admin: {
        request_saved_error:
          "Admin request not saved. Check admin_requests table and policies.",
      },
    },
    ru: {
      meta: {
        title: "Techstuf | Профессиональная техника для ежедневных задач",
        description:
          "Techstuf — профессиональный магазин техники для частных клиентов и бизнеса. Надежные товары, быстрая доставка и готовые наборы.",
      },
      brand: {
        tagline: "Витрина на Netlify + Supabase",
        admin_tagline: "Доступ администратора и владельца",
        owner_tagline: "Панель владельца",
        admin_console_tagline: "Консоль администратора",
      },
      nav: {
        shop: "Магазин",
        bundles: "Наборы",
        studio: "Подборки",
        account: "Аккаунт",
        support: "Поддержка",
        back_to_store: "Назад в магазин",
        admin_login: "Вход администратора",
        owner_dashboard: "Панель владельца",
      },
      header: {
        search_label: "Поиск",
        search_placeholder: "Искать товары",
        cart: "Корзина",
      },
      lang: {
        label: "Язык",
        auto: "Авто",
        en: "English",
        ru: "Русский",
        use_gps: "Использовать GPS",
        detecting: "Определяем местоположение...",
        gps_denied: "Доступ к геолокации запрещен.",
        gps_failed: "Не удалось определить местоположение.",
        gps_set: "Язык обновлен по GPS.",
        ip_failed: "Не удалось определить местоположение по IP.",
      },
      hero: {
        eyebrow: "Дроп Techstuf 02",
        title: "Техника, которая успевает за быстрым темпом работы.",
        lede:
          "Techstuf — профессиональный ритейлер техники с отобранными товарами от надежных поставщиков и аккуратной доставкой.",
        cta_shop: "Купить сейчас",
        cta_bundle: "Собрать набор",
        meta_rating: "средняя оценка",
        meta_delivery: "средняя доставка",
        meta_supabase: "Supabase",
        meta_connecting: "подключение...",
        card1_tag: "Набор создателя",
        card1_desc: "Сбалансированный звук и мгновенная шумоизоляция.",
        card2_tag: "Проф. сборка",
        card2_desc: "Мощность уровня ПК без громоздкого корпуса.",
        card3_tag: "Порядок на столе",
        card3_desc: "Широкое, теплое и точное по цвету рабочее пространство.",
        badge_weekend: "Уикенд",
        badge_drop: "Дроп",
      },
      shop: {
        title: "Каталог Techstuf",
        subtitle:
          "Каждый товар проверен по качеству сборки, поддержке прошивок и условиям возврата.",
      },
      bundles: {
        title: "Конструктор наборов",
        subtitle:
          "Выберите фокус. Мы подбираем совместимую технику по температуре цвета, кабелям и питанию.",
        option_creator: "Студия создателя",
        option_gaming: "Низкая задержка",
        option_remote: "Удаленная команда",
        option_mobile: "Мобильный комплект",
        summary_loading: "Загрузка популярного набора...",
        card_title: "Каталог, готовый для Supabase",
        card_desc:
          "Синхронизируйте склад, цены и изображения прямо из таблицы Supabase. Netlify разворачивает витрину за секунды.",
        card_li1: "Актуальные остатки и цены",
        card_li2: "Любимые товары и рейтинги",
        card_li3: "Корзина сохраняется в браузере",
        view_setup: "Инструкции по настройке",
        kit: "Набор {{bundle}}",
      },
      studio: {
        title: "Для обычных клиентов и корпоративных покупателей.",
        desc:
          "Techstuf обслуживает домашних пользователей, команды и растущий бизнес: надежная техника, понятные гарантии и быстрые пополнения.",
        list1_title: "Звук и стрим",
        list1_desc: "Микшеры, микрофоны и оборудование для шумоизоляции.",
        list2_title: "Контроль рабочего стола",
        list2_desc: "Мониторы, световые панели и контроллеры продуктивности.",
        list3_title: "Вычислительная мощь",
        list3_desc: "Док-станции, охлаждение и NAS-комплекты.",
        panel1_title: "График отгрузок",
        panel1_desc: "Пополнения ежедневно в 10:00 и 16:00 UTC. Большинство заказов отправляем в тот же день.",
        panel2_title: "Обратная связь",
        panel2_desc: "Запросы и изменения спецификаций сразу попадают в бэклог Supabase.",
      },
      auth: {
        buyer_title: "Аккаунт покупателя",
        buyer_desc: "Создайте аккаунт, чтобы отслеживать заказы и ускорить оформление.",
        buyer_create: "Создать аккаунт покупателя",
        buyer_login: "Вход покупателя",
        buyer_status_default: "Вы не вошли.",
        admin_title: "Доступ администратора",
        admin_desc: "Администратору нужно одобрение владельца.",
        admin_request: "Запросить доступ администратора",
        admin_login: "Вход администратора",
        admin_status_default: "Доступ администратора требует одобрения.",
        owner_title: "Вход владельца",
        owner_desc: "Аккаунты владельца создаются в Supabase Auth и подтверждаются вручную.",
        owner_login: "Вход владельца",
        sign_out: "Выйти",
        owner_status_default: "Только владелец.",
        email_placeholder: "Email",
        password_placeholder: "Пароль",
        create_password_placeholder: "Создайте пароль",
        admin_email_placeholder: "Email администратора",
        owner_email_placeholder: "Email владельца",
        reason_placeholder: "Зачем вам доступ администратора?",
        admin_helper: "Нужен доступ? Запросите его на основном сайте.",
      },
      support: {
        title: "Нужна помощь с подбором?",
        desc: "Тех?консультанты на связи ежедневно. Отвечаем в течение 12 минут.",
        chat_btn: "Начать чат",
        newsletter_title: "Получать новости",
        newsletter_desc: "Еженедельные поставки, распродажи и эксклюзивные наборы.",
        newsletter_placeholder: "you@company.com",
        newsletter_join: "Подписаться",
      },
      footer: {
        tagline: "Готовая к будущему техника с быстрой доставкой.",
        secure_checkout: "Безопасная оплата",
        returns: "30 дней на возврат",
        studio_pricing: "Профессиональные цены",
      },
      cart: {
        title: "Ваша корзина",
        close: "Закрыть",
        subtotal: "Итого",
        paypal_note: "Безопасная оплата через PayPal.",
        checkout: "Оформить заказ",
        taxes_note: "Налоги и доставка рассчитываются при оформлении.",
        empty: "Добавьте товары, чтобы оплатить через PayPal.",
        qty: "Кол-во",
        remove: "Удалить",
      },
      toast: {
        added: "Добавлено в корзину",
        newsletter: "Спасибо за подписку",
        payment_complete: "Оплата завершена",
        payment_failed: "Оплата не прошла",
        paypal_failed: "PayPal не загрузился",
        auth_missing: "Supabase не настроен",
        buyer_created: "Аккаунт покупателя создан. Проверьте почту для подтверждения.",
        buyer_login: "Вход покупателя выполнен",
        admin_created: "Аккаунт администратора создан. Запрос на одобрение отправлен.",
        admin_login: "Вход администратора выполнен",
        owner_login: "Вход владельца выполнен",
        signed_out: "Вы вышли",
        admin_request_saved_error:
          "Запрос не сохранен. Проверьте таблицу admin_requests и политики.",
        admin_request_submitted: "Запрос администратора отправлен",
        sign_in_first: "Сначала войдите, чтобы запросить доступ администратора",
      },
      review: {
        title: "Отзывы",
        meta: "Оценки и отзывы покупателей.",
        close: "Закрыть",
        rating_label: "Оценка",
        comment_label: "Комментарий",
        comment_placeholder: "Поделитесь опытом",
        submit: "Отправить отзыв",
        login_required: "Нужно войти, чтобы оставить отзыв.",
        no_reviews: "Пока нет отзывов. Будьте первым.",
        no_comment: "Комментарий отсутствует.",
        verified_buyer: "Проверенный покупатель",
        view_video: "Смотреть видео",
        select_label: "Выберите",
        opt_5: "5 - Отлично",
        opt_4: "4 - Хорошо",
        opt_3: "3 - Нормально",
        opt_2: "2 - Средне",
        opt_1: "1 - Плохо",
        rating_error: "Выберите оценку от 1 до 5.",
        submit_success: "Отзыв отправлен.",
        submit_failed: "Не удалось отправить: {{message}}",
        title_with_product: "Отзывы о {{name}}",
        count: "{{count}} отзыв(ов)",
      },
      setup: {
        title: "Настройка Supabase",
        step1:
          "Создайте таблицу `products` с колонками: name, category, price, rating, badge, description, image_url, video_url, image_hue.",
        step2: "Включите RLS и добавьте политику чтения для активных товаров.",
        step3: "Укажите `SUPABASE_URL` и `SUPABASE_ANON_KEY` в app.js для подключения.",
        got_it: "Понятно",
      },
      analytics: {
        title: "Аналитика продаж",
        desc: "Захваты PayPal, сохраненные в Supabase.",
        total_revenue: "Выручка всего",
        total_orders: "Всего заказов",
        avg_order: "Средний заказ",
        last_7: "За 7 дней",
        top_product: "Топ-товар",
        recent_orders: "Недавние заказы",
        order_date: "Дата",
        order_id: "Заказ",
        order_email: "Покупатель",
        order_total: "Сумма",
        order_status: "Статус",
        no_orders: "Пока нет заказов.",
        loading: "Загрузка продаж...",
        not_ready: "Таблица заказов недоступна. Запустите SQL для аналитики.",
        updated: "Данные обновлены.",
      },
      supabase: {
        local_demo: "локальная демо",
        offline_demo: "офлайн, демо-режим",
        synced: "синхронизировано: {{count}}",
      },
      filters: {
        all: "Все",
      },
      product: {
        add_to_cart: "В корзину",
        reviews: "Отзывы",
        unnamed: "Без названия",
        default_category: "Техника",
        default_badge: "В наличии",
        default_desc: "Товар из Supabase",
      },
      status: {
        auth_missing: "Авторизация не настроена.",
        admin_requires: "Доступ администратора требует одобрения.",
        owner_only: "Только владелец.",
        not_signed_in: "Вы не вошли.",
        signed_in_as: "Вы вошли как {{email}}.",
        owner_logged_in: "Владелец вошел.",
        owner_access_granted: "Доступ владельца предоставлен.",
        admin_access_approved: "Доступ администратора подтвержден.",
        admin_access_pending: "Ожидает одобрения владельца.",
      },
      review_form: {
        login_required: "Войдите, чтобы оставить отзыв.",
      },
      admin: {
        request_saved_error:
          "Запрос не сохранен. Проверьте таблицу admin_requests и политики.",
      },
    },
  };

  let currentLanguage = "en";

  function safeUpper(value) {
    return typeof value === "string" ? value.trim().toUpperCase() : "";
  }

  function resolveLanguage(lang) {
    const normalized = typeof lang === "string" ? lang.split("-")[0].toLowerCase() : "";
    return SUPPORTED_LANGS.includes(normalized) ? normalized : "en";
  }

  function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function interpolate(template, vars) {
    if (!vars) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (vars[key] === undefined || vars[key] === null) return match;
      return String(vars[key]);
    });
  }

  function t(key, fallback, vars) {
    const langPack = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    const basePack = TRANSLATIONS.en;
    const value = getNestedValue(langPack, key) ?? getNestedValue(basePack, key) ?? fallback;
    if (value === undefined || value === null) return fallback || key;
    if (typeof value === "string") {
      return interpolate(value, vars);
    }
    return String(value);
  }

  function applyTranslations(lang) {
    currentLanguage = resolveLanguage(lang);

    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";

    const title = t("meta.title");
    if (title) {
      document.title = title;
    }

    const description = document.querySelector("meta[name='description']");
    if (description) {
      description.setAttribute("content", t("meta.description"));
    }

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (!key) return;
      const fallback = element.textContent || "";
      element.textContent = t(key, fallback);
    });

    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      const key = element.getAttribute("data-i18n-html");
      if (!key) return;
      const fallback = element.innerHTML || "";
      element.innerHTML = t(key, fallback);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      if (!key) return;
      const fallback = element.getAttribute("placeholder") || "";
      element.setAttribute("placeholder", t(key, fallback));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      if (!key) return;
      const fallback = element.getAttribute("title") || "";
      element.setAttribute("title", t(key, fallback));
    });

    document.querySelectorAll("[data-i18n-value]").forEach((element) => {
      const key = element.getAttribute("data-i18n-value");
      if (!key) return;
      const fallback = element.value || "";
      element.value = t(key, fallback);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const key = element.getAttribute("data-i18n-aria");
      if (!key) return;
      const fallback = element.getAttribute("aria-label") || "";
      element.setAttribute("aria-label", t(key, fallback));
    });

    const event = new CustomEvent("techstuf:languagechange", { detail: { lang: currentLanguage } });
    window.dispatchEvent(event);
  }

  function notify(message) {
    if (!message) return;
    const event = new CustomEvent("techstuf:toast", { detail: { message } });
    window.dispatchEvent(event);
  }

  function storeLanguage(lang, override) {
    try {
      if (lang) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        if (override) {
          localStorage.setItem(LANGUAGE_OVERRIDE_KEY, "1");
        }
      } else {
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        localStorage.removeItem(LANGUAGE_OVERRIDE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }

  function readGeoOverride() {
    try {
      const raw = localStorage.getItem(GEO_OVERRIDE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.countryCode || !parsed.updatedAt) return null;
      if (Date.now() - parsed.updatedAt > GEO_TTL_MS) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeGeoOverride(countryCode) {
    if (!countryCode) return;
    try {
      localStorage.setItem(
        GEO_OVERRIDE_KEY,
        JSON.stringify({ countryCode: countryCode.toUpperCase(), updatedAt: Date.now() })
      );
    } catch {
      // ignore storage errors
    }
  }

  function mapCountryToLanguage(countryCode) {
    const code = safeUpper(countryCode);
    if (!code) return null;
    return COUNTRY_LANGUAGE_MAP[code] || null;
  }

  async function fetchJson(url, timeoutMs = 3500) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  function parseIpLocation(data) {
    if (!data || data?.success === false) return null;

    const city =
      data.city ||
      data.region ||
      data.region_name ||
      data.state ||
      data.province ||
      data.locality;

    const countryCode =
      data.country_code ||
      data.countryCode ||
      data.country_code_iso2 ||
      data.country;

    let latRaw = data.latitude ?? data.lat ?? data.location?.lat;
    let lngRaw = data.longitude ?? data.lon ?? data.lng ?? data.location?.lng;

    const locRaw = data.loc || data.location?.loc;
    if ((latRaw === undefined || lngRaw === undefined) && typeof locRaw === "string" && locRaw.includes(",")) {
      const [latPart, lngPart] = locRaw.split(",");
      if (latRaw === undefined) latRaw = latPart;
      if (lngRaw === undefined) lngRaw = lngPart;
    }

    const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
    const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);

    const location = {};
    if (typeof city === "string" && city.trim()) location.city = city.trim();
    if (typeof countryCode === "string" && countryCode.trim()) location.countryCode = countryCode.trim().toUpperCase();
    if (!Number.isNaN(lat)) location.lat = lat;
    if (!Number.isNaN(lng)) location.lng = lng;

    if (!location.city && !location.countryCode && location.lat === undefined && location.lng === undefined) {
      return null;
    }

    return location;
  }

  async function detectCountryCode() {
    const sources = [
      "/.netlify/functions/ip-geo",
      "https://ipwho.is/",
      "https://ipapi.co/json/",
      "https://geolocation-db.com/json/",
    ];

    for (const url of sources) {
      const data = await fetchJson(url, url.includes("/functions/") ? 2500 : 3500);
      const location = parseIpLocation(data);
      if (location?.countryCode) {
        try {
          localStorage.setItem(COUNTRY_CODE_KEY, location.countryCode);
        } catch {
          // ignore storage errors
        }
        return location.countryCode;
      }
    }

    return null;
  }

  function getTimezoneLanguage() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const key = tz.toLowerCase();
      const kzZones = [
        "asia/almaty",
        "asia/aqtau",
        "asia/aqtobe",
        "asia/atyrau",
        "asia/oral",
        "asia/qyzylorda",
      ];
      if (kzZones.includes(key)) return "ru";
    } catch {
      // ignore timezone errors
    }
    return null;
  }

  function getPreferredLanguage() {
    const tzLang = getTimezoneLanguage();
    if (tzLang) return tzLang;
    const browser = resolveLanguage(navigator.language || "en");
    return browser || "en";
  }

  async function detectLanguage() {
    try {
      const override = localStorage.getItem(LANGUAGE_OVERRIDE_KEY);
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (override === "1" && storedLang) {
        return resolveLanguage(storedLang);
      }
    } catch {
      // ignore storage errors
    }

    const preferredLang = getPreferredLanguage();
    if (preferredLang && preferredLang !== "en") {
      return preferredLang;
    }

    const geoOverride = readGeoOverride();
    if (geoOverride?.countryCode) {
      const mapped = mapCountryToLanguage(geoOverride.countryCode);
      if (mapped) return resolveLanguage(mapped);
    }

    try {
      const storedCountry = localStorage.getItem(COUNTRY_CODE_KEY);
      if (storedCountry) {
        const mapped = mapCountryToLanguage(storedCountry);
        if (mapped) return resolveLanguage(mapped);
      }
    } catch {
      // ignore storage errors
    }

    const detectedCountry = await detectCountryCode();
    const mapped = mapCountryToLanguage(detectedCountry);
    if (mapped) return resolveLanguage(mapped);

    return preferredLang || "en";
  }

  function getLocale() {
    return LOCALE_MAP[currentLanguage] || "en-US";
  }

  function setLanguage(lang, options = {}) {
    const normalized = lang === "auto" ? null : resolveLanguage(lang || "");
    if (!normalized) {
      storeLanguage(null, false);
      return detectLanguage().then((detected) => {
        applyTranslations(detected || "en");
        return detected;
      });
    }

    const override = options.override !== false;
    storeLanguage(normalized, override);
    applyTranslations(normalized);
    return Promise.resolve(normalized);
  }

  function getLanguage() {
    return currentLanguage;
  }

  async function getGpsCountryCode() {
    if (!navigator.geolocation) {
      throw new Error("gps_unsupported");
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 60000,
      });
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        latitude
      )}&lon=${encodeURIComponent(longitude)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("gps_failed");
    }

    const data = await response.json();
    const countryCode = data?.address?.country_code;
    if (!countryCode) {
      throw new Error("gps_failed");
    }

    return String(countryCode).toUpperCase();
  }

  async function requestGpsLanguage() {
    try {
      notify(t("lang.detecting"));
      const countryCode = await getGpsCountryCode();
      writeGeoOverride(countryCode);
      const mapped = mapCountryToLanguage(countryCode) || getPreferredLanguage();
      applyTranslations(mapped);
      notify(t("lang.gps_set"));
      return mapped;
    } catch (error) {
      if (error && error.code === 1) {
        notify(t("lang.gps_denied"));
      } else if (String(error?.message || "") === "gps_failed") {
        notify(t("lang.gps_failed"));
      } else {
        notify(t("lang.gps_failed"));
      }
      return null;
    }
  }

  async function maybeAutoGps() {
    if (!navigator.permissions || !navigator.geolocation) return;
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "granted") {
        const countryCode = await getGpsCountryCode();
        if (countryCode) {
          writeGeoOverride(countryCode);
          const mapped = mapCountryToLanguage(countryCode) || getPreferredLanguage();
          applyTranslations(mapped);
        }
      }
    } catch {
      // ignore permission errors
    }
  }

  function bindLanguageSelector() {
    const select = document.getElementById("languageSelect");
    if (!select) return;

    try {
      const override = localStorage.getItem(LANGUAGE_OVERRIDE_KEY);
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (override === "1" && storedLang) {
        select.value = resolveLanguage(storedLang);
      } else {
        select.value = "auto";
      }
    } catch {
      select.value = "auto";
    }

    select.addEventListener("change", async (event) => {
      const value = event.target.value;
      if (value === "auto") {
        await setLanguage("auto");
      } else {
        await setLanguage(value, { override: true });
      }
    });

    const gpsButton = document.getElementById("useLocation");
    if (gpsButton) {
      gpsButton.addEventListener("click", async () => {
        const lang = await requestGpsLanguage();
        if (lang) {
          try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            localStorage.setItem(LANGUAGE_OVERRIDE_KEY, "1");
          } catch {
            // ignore storage errors
          }
          if (select) select.value = lang;
        }
      });
    }
  }

  async function initI18n() {
    const base = getPreferredLanguage();
    applyTranslations(base);
    const detected = await detectLanguage();
    applyTranslations(detected || base);
    bindLanguageSelector();
    maybeAutoGps();
  }

  window.TECHSTUF_I18N = {
    t,
    setLanguage,
    getLanguage,
    getLocale,
    detectCountryCode,
    requestGpsLanguage,
    initI18n,
    notify,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initI18n);
  } else {
    initI18n();
  }
})();
