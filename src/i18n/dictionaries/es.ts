//#region Dictionary shape
export type Dictionary = {
  common: {
    dashboard: string;
    login: string;
    logout: string;
    startFree: string;
    contact: string;
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    creating: string;
    copy: string;
    back: string;
    published: string;
    draft: string;
    actions: string;
    empty: string;
    optional: string;
    active: string;
    activating: string;
    error: string;
    success: string;
    confirmDelete: string;
  };
  landing: {
    badge: string;
    heroTitlePrefix: string;
    heroTitleAccent: string;
    heroTitleSuffix: string;
    heroDesc: string;
    ctaPrimary: string;
    ctaSecondary: string;
    ctaSub: string;
    navHow: string;
    navFeatures: string;
    navPricing: string;
    howTitle: string;
    howSubtitle: string;
    steps: Array<{ title: string; desc: string }>;
    featuresTitle: string;
    features: Array<{ title: string; desc: string }>;
    pricingTitle: string;
    pricingSubtitle: string;
    pricingPerMonth: string;
    pricingCta: string;
    pricingContact: string;
    pricingMostPopular: string;
    plans: Array<{
      name: string;
      priceLabel: string;
      pitch: string;
      features: string[];
      popular?: boolean;
      enterprise?: boolean;
    }>;
  };
  onboarding: {
    createTitle: string;
    createDesc: string;
    activateTitle: string;
    activateDescSingular: string;
    activateDescPlural: string;
    companyName: string;
    companyNamePlaceholder: string;
    slug: string;
    slugPlaceholder: string;
    slugPrefix: string;
    country: string;
    currency: string;
    language: string;
    createButton: string;
    enter: string;
    createAnother: string;
    cannotCreate: string;
    createError: string;
    createSuccess: string;
    activateError: string;
  };
  home: {
    welcome: string;
    plan: string;
    metrics: {
      products: string;
      assistants: string;
      conversationsMonth: string;
      ordersMonth: string;
    };
    onboardingProgress: string;
    steps: Array<{ title: string }>;
  };
  sidebar: {
    home: string;
    catalogs: string;
    assistants: string;
    orders: string;
    analytics: string;
    team: string;
    billing: string;
    settings: string;
  };
  catalogs: {
    title: string;
    desc: string;
    newBtn: string;
    firstCta: string;
    empty: string;
    productsCount: string;
    newTitle: string;
    newDesc: string;
    form: {
      name: string;
      namePlaceholder: string;
      slug: string;
      slugPlaceholder: string;
      description: string;
      submit: string;
    };
    detail: {
      newProduct: string;
      importXlsx: string;
      exportXlsx: string;
      publicUrl: string;
      publishedLabel: string;
    };
    editTitle: string;
    edit: string;
    deleteBtn: string;
    deleteConfirm: string;
    deleted: string;
    deleteError: string;
    saved: string;
  };
  products: {
    form: {
      title: string;
      inCatalog: string;
      name: string;
      description: string;
      price: string;
      stock: string;
      stockPlaceholder: string;
      sku: string;
      tags: string;
      tagsPlaceholder: string;
      imageUrl: string;
      active: string;
      activeHelp: string;
      submit: string;
      success: string;
      error: string;
    };
    table: {
      name: string;
      sku: string;
      price: string;
      stock: string;
      active: string;
      empty: string;
      deleteConfirm: string;
      deleted: string;
      deleteError: string;
    };
    import: {
      title: string;
      inCatalog: string;
      columnsHeader: string;
      columnsHelp: string;
      dropzoneIdle: string;
      dropzoneActive: string;
      fileTypes: string;
      importBtn: string;
      importing: string;
      imported: string;
      errorsSummary: string;
      parseError: string;
    };
  };
  assistants: {
    title: string;
    desc: string;
    newBtn: string;
    firstCta: string;
    empty: string;
    catalogsCount: string;
    conversationsCount: string;
    notSynced: string;
    newTitle: string;
    newDesc: string;
    form: {
      name: string;
      language: string;
      voice: string;
      firstMessage: string;
      firstMessagePlaceholder: string;
      systemPrompt: string;
      systemPromptB: string;
      systemPromptBPlaceholder: string;
      enableAB: string;
      submit: string;
      successCreated: string;
      warningNoVapi: string;
      errorCreate: string;
    };
    detail: {
      voiceLabel: string;
      vapiLabel: string;
      vapiNotSynced: string;
      firstMessage: string;
      systemPrompt: string;
      catalogsAssigned: string;
      noCatalogs: string;
    };
  };
  orders: {
    title: string;
    desc: string;
    exportCsv: string;
    empty: string;
    cols: {
      date: string;
      customer: string;
      total: string;
      status: string;
      items: string;
      mpPayment: string;
    };
  };
  analytics: {
    title: string;
    desc: string;
    kpi: {
      conversations: string;
      ended: string;
      ordersApproved: string;
      revenue: string;
    };
    revenueByDay: string;
    noRevenue: string;
    conversionRate: string;
    conversionRateHelp: string;
    abTitle: string;
    abVariantA: string;
    abVariantB: string;
    topProducts: string;
    topProductsEmpty: string;
    tableProduct: string;
    tableUnits: string;
    tablePrice: string;
  };
  settings: {
    title: string;
    sections: {
      billing: { title: string; desc: string };
      team: { title: string; desc: string };
      company: { title: string; desc: string };
    };
    billing: {
      title: string;
      currentPlan: string;
      noPlan: string;
      expires: string;
      upgrading: string;
      upgradeError: string;
      upgraded: string;
      currentBtn: string;
      upgradeBtn: string;
      planFree: string;
      perMonth: string;
    };
    team: {
      title: string;
      desc: string;
    };
    company: {
      title: string;
      desc: string;
      slugLabel: string;
      slugReadonly: string;
      name: string;
      logoUrl: string;
      language: string;
      platformFee: string;
      platformFeeHelp: string;
      customDomain: string;
      customDomainPlaceholder: string;
      customDomainHelp: string;
      saved: string;
      saveError: string;
    };
  };
  preferences: {
    theme: string;
    language: string;
  };
};
//#endregion

//#region Spanish dictionary
export const es: Dictionary = {
  common: {
    dashboard: "Dashboard",
    login: "Ingresar",
    logout: "Cerrar sesión",
    startFree: "Empezar gratis",
    contact: "Contacto",
    loading: "Cargando...",
    save: "Guardar",
    saving: "Guardando...",
    cancel: "Cancelar",
    delete: "Borrar",
    edit: "Editar",
    create: "Crear",
    creating: "Creando...",
    copy: "Copiar",
    back: "Volver",
    published: "Publicado",
    draft: "Borrador",
    actions: "Acciones",
    empty: "Vacío",
    optional: "opcional",
    active: "Activo",
    activating: "Activando...",
    error: "Error",
    success: "Listo",
    confirmDelete: "¿Borrar este elemento?",
  },
  landing: {
    badge: "Asistente de voz AI + MercadoPago · para PyMEs LATAM",
    heroTitlePrefix: "Tu catálogo, vendido por un",
    heroTitleAccent: "asistente de voz",
    heroTitleSuffix: "24/7.",
    heroDesc:
      "Subí tus productos (manual o xlsx/csv), configurá un asistente en español y dejá que cierre ventas por vos con link de pago MercadoPago al instante.",
    ctaPrimary: "Empezar gratis",
    ctaSecondary: "Ver cómo funciona",
    ctaSub: "Plan Free para siempre · sin tarjeta al registrarte",
    navHow: "Cómo funciona",
    navFeatures: "Features",
    navPricing: "Precios",
    howTitle: "Cómo funciona",
    howSubtitle: "De catálogo a venta cerrada en 4 pasos.",
    steps: [
      { title: "Subí tu catálogo", desc: "Carga manual o bulk xlsx/csv (hasta 6.000 productos por upload)." },
      { title: "Configurá el asistente", desc: "Elegí idioma (ES/PT/EN), voz, primer mensaje y system prompt." },
      { title: "Tus clientes hablan con la IA", desc: "Desde un link público o QR. El asistente busca productos y arma el carrito." },
      { title: "Cobrás por MercadoPago", desc: "Al cerrar, genera link de pago. Webhook confirma y descuenta stock." },
    ],
    featuresTitle: "Features",
    features: [
      { title: "Bulk upload xlsx/csv", desc: "Importá miles de productos de una sentada. Parser propio zero-deps." },
      { title: "Voz AI con tool calling", desc: "Busca productos, arma carrito, genera checkout. No alucina precios." },
      { title: "MercadoPago nativo", desc: "Pensado para LATAM. Preference + Preapproval + webhook HMAC." },
      { title: "Multi-tenant con Clerk", desc: "Una empresa = un workspace. Invitá colaboradores con roles." },
    ],
    pricingTitle: "Precios",
    pricingSubtitle: "En pesos argentinos. Facturación mensual por MercadoPago.",
    pricingPerMonth: "/mes",
    pricingCta: "Empezar",
    pricingContact: "Contactar ventas",
    pricingMostPopular: "Más elegido",
    plans: [
      {
        name: "Free",
        priceLabel: "Gratis",
        pitch: "Para probar la idea sin riesgo",
        features: [
          "1 catálogo",
          "Hasta 50 productos",
          "1 asistente de voz",
          "50 conversaciones por mes",
          "Checkout MercadoPago",
          "Link público + QR",
        ],
      },
      {
        name: "Starter",
        priceLabel: "ARS 19.900",
        pitch: "Para negocios chicos con catálogo activo",
        features: [
          "3 catálogos",
          "Hasta 500 productos",
          "2 asistentes de voz",
          "300 conversaciones por mes",
          "Bulk import xlsx/csv",
          "Analytics básico",
          "Export de órdenes a CSV",
          "Soporte por email",
        ],
      },
      {
        name: "Pro",
        priceLabel: "ARS 59.900",
        pitch: "Para escalar con varios catálogos y equipo",
        popular: true,
        features: [
          "10 catálogos",
          "Hasta 5.000 productos",
          "5 asistentes de voz",
          "1.500 conversaciones por mes",
          "Voice clone (voz propia)",
          "Dominio custom (tienda.tuempresa.com)",
          "Analytics avanzado + A/B de prompts",
          "Múltiples usuarios con roles",
          "Soporte prioritario",
        ],
      },
      {
        name: "Enterprise",
        priceLabel: "A medida",
        pitch: "Volumen alto, SLA y onboarding dedicado",
        enterprise: true,
        features: [
          "Catálogos ilimitados",
          "Productos ilimitados",
          "Asistentes ilimitados",
          "Conversaciones ilimitadas",
          "SLA 99,9% + soporte 24/7",
          "Onboarding dedicado",
          "Integraciones custom",
          "MP Marketplace (split de pagos)",
          "Procesamiento de datos bajo contrato (DPA)",
        ],
      },
    ],
  },
  onboarding: {
    createTitle: "Crear tu empresa",
    createDesc:
      "Tu empresa es el workspace donde vas a armar catálogos y configurar asistentes de ventas. Podés invitar colaboradores después.",
    activateTitle: "Activá tu empresa",
    activateDescSingular: "Ya pertenecés a una empresa. Entrá para continuar.",
    activateDescPlural: "Ya pertenecés a varias empresas. Elegí una para entrar.",
    companyName: "Nombre de la empresa",
    companyNamePlaceholder: "Ej: Distribuidora Martínez",
    slug: "URL pública (slug)",
    slugPlaceholder: "distribuidora-martinez",
    slugPrefix: "callcito.app/c/",
    country: "País",
    currency: "Moneda",
    language: "Idioma por defecto del asistente",
    createButton: "Crear empresa",
    enter: "Entrar →",
    createAnother: "Crear otra empresa",
    cannotCreate: "No se pudo activar la empresa",
    createError: "Error al crear la empresa",
    createSuccess: "Empresa creada",
    activateError: "No se pudo activar la empresa",
  },
  home: {
    welcome: "Bienvenido a",
    plan: "Plan",
    metrics: {
      products: "Productos",
      assistants: "Asistentes",
      conversationsMonth: "Conversaciones (mes)",
      ordersMonth: "Órdenes (mes)",
    },
    onboardingProgress: "Progreso de onboarding",
    steps: [
      { title: "Crear tu empresa" },
      { title: "Crear tu primer catálogo" },
      { title: "Configurar asistente de voz" },
      { title: "Publicar catálogo" },
    ],
  },
  sidebar: {
    home: "Inicio",
    catalogs: "Catálogos",
    assistants: "Asistentes",
    orders: "Órdenes",
    analytics: "Analytics",
    team: "Equipo",
    billing: "Facturación",
    settings: "Configuración",
  },
  catalogs: {
    title: "Catálogos",
    desc: "Gestioná los catálogos de productos de tu empresa.",
    newBtn: "Nuevo catálogo",
    firstCta: "Crear primer catálogo",
    empty: "Aún no tenés catálogos",
    productsCount: "productos",
    newTitle: "Nuevo catálogo",
    newDesc: "Un catálogo agrupa productos. Podés publicarlo con URL pública y asignarle un asistente.",
    form: {
      name: "Nombre",
      namePlaceholder: "Ej: Temporada Invierno 2026",
      slug: "URL (slug)",
      slugPlaceholder: "temporada-invierno-2026",
      description: "Descripción (opcional)",
      submit: "Crear catálogo",
    },
    detail: {
      newProduct: "Nuevo producto",
      importXlsx: "Importar xlsx / csv",
      exportXlsx: "Exportar xlsx",
      publicUrl: "URL pública",
      publishedLabel: "Publicado",
    },
    editTitle: "Editar catálogo",
    edit: "Editar",
    deleteBtn: "Borrar catálogo",
    deleteConfirm: "¿Borrar este catálogo? Se borran todos sus productos en cascada. Esta acción no se puede deshacer.",
    deleted: "Catálogo borrado",
    deleteError: "No se pudo borrar",
    saved: "Cambios guardados",
  },
  products: {
    form: {
      title: "Nuevo producto",
      inCatalog: "En catálogo:",
      name: "Nombre",
      description: "Descripción",
      price: "Precio",
      stock: "Stock (opcional)",
      stockPlaceholder: "∞",
      sku: "SKU (opcional)",
      tags: "Tags (coma-separado)",
      tagsPlaceholder: "nuevo, oferta, premium",
      imageUrl: "URL de imagen (opcional)",
      active: "Activo (visible para el asistente)",
      activeHelp: "",
      submit: "Crear producto",
      success: "Producto creado",
      error: "No se pudo crear el producto",
    },
    table: {
      name: "Nombre",
      sku: "SKU",
      price: "Precio",
      stock: "Stock",
      active: "Activo",
      empty: "Aún no tenés productos en este catálogo.",
      deleteConfirm: "¿Borrar este producto?",
      deleted: "Producto borrado",
      deleteError: "Error al borrar",
    },
    import: {
      title: "Importar productos",
      inCatalog: "Catálogo:",
      columnsHeader: "Columnas aceptadas (fila 1 = headers):",
      columnsHelp: "* obligatorio. `tags` = lista separada por comas. Hasta 6.000 filas por upload. Formatos: .xlsx o .csv.",
      dropzoneIdle: "Arrastrá un archivo o hacé click para seleccionar",
      dropzoneActive: "Soltá el archivo acá",
      fileTypes: ".xlsx o .csv",
      importBtn: "Importar",
      importing: "Importando...",
      imported: "productos importados",
      errorsSummary: "filas con errores",
      parseError: "Error al importar",
    },
  },
  assistants: {
    title: "Asistentes",
    desc: "Asistentes de voz AI que venden tus catálogos.",
    newBtn: "Nuevo asistente",
    firstCta: "Crear primer asistente",
    empty: "Aún no creaste asistentes",
    catalogsCount: "catálogos",
    conversationsCount: "conversaciones",
    notSynced: "Sin sync Vapi",
    newTitle: "Nuevo asistente",
    newDesc: "El asistente atiende clientes por voz en el catálogo público.",
    form: {
      name: "Nombre interno",
      language: "Idioma",
      voice: "Voz",
      firstMessage: "Primer mensaje",
      firstMessagePlaceholder: "¡Hola! Soy tu asistente de ventas. ¿Qué estás buscando hoy?",
      systemPrompt: "System prompt",
      systemPromptB: "System prompt (Variant B)",
      systemPromptBPlaceholder: "Variante B del prompt — el sistema elige random A/B en cada conversación.",
      enableAB: "Activar A/B testing de prompts",
      submit: "Crear asistente",
      successCreated: "Asistente creado",
      warningNoVapi: "Asistente creado en DB, pero Vapi no sincronizó. Reintentá desde detalle.",
      errorCreate: "No se pudo crear el asistente",
    },
    detail: {
      voiceLabel: "Voice",
      vapiLabel: "Vapi",
      vapiNotSynced: "Sin sincronizar",
      firstMessage: "Primer mensaje",
      systemPrompt: "System prompt",
      catalogsAssigned: "Catálogos asignados",
      noCatalogs: "Ninguno. Asigná este asistente desde la página del catálogo.",
    },
  },
  orders: {
    title: "Órdenes",
    desc: "Pagos generados por el asistente. El estado se sincroniza vía webhook MP.",
    exportCsv: "Export CSV",
    empty: "Todavía no hay órdenes. Se listan acá apenas el asistente genere un checkout.",
    cols: {
      date: "Fecha",
      customer: "Cliente",
      total: "Total",
      status: "Estado",
      items: "Items",
      mpPayment: "MP Payment",
    },
  },
  analytics: {
    title: "Analytics",
    desc: "Métricas del mes actual.",
    kpi: {
      conversations: "Conversaciones",
      ended: "Finalizadas",
      ordersApproved: "Órdenes aprobadas",
      revenue: "Ingresos",
    },
    revenueByDay: "Ingresos por día",
    noRevenue: "Sin ingresos aún este mes.",
    conversionRate: "Conversion rate",
    conversionRateHelp: "Órdenes aprobadas / conversaciones",
    abTitle: "A/B prompts",
    abVariantA: "Variant A",
    abVariantB: "Variant B",
    topProducts: "Top productos (por unidades vendidas)",
    topProductsEmpty: "Aún no hay ventas aprobadas en el mes.",
    tableProduct: "Producto",
    tableUnits: "Unidades",
    tablePrice: "Precio",
  },
  settings: {
    title: "Configuración",
    sections: {
      billing: { title: "Plan y facturación", desc: "Upgrade, métricas de uso" },
      team: { title: "Equipo", desc: "Invitar miembros, roles" },
      company: { title: "Empresa", desc: "Nombre, moneda, país, idioma" },
    },
    billing: {
      title: "Plan y facturación",
      currentPlan: "Plan actual:",
      noPlan: "Sin plan activo",
      expires: "vence el",
      upgrading: "Iniciando upgrade...",
      upgradeError: "Error al iniciar upgrade",
      upgraded: "Plan actualizado",
      currentBtn: "Plan actual",
      upgradeBtn: "Upgrade",
      planFree: "Gratis",
      perMonth: "/mes",
    },
    team: {
      title: "Equipo",
      desc: "Invitá colaboradores y gestioná sus roles.",
    },
    company: {
      title: "Empresa",
      desc: "Configuración de tu empresa.",
      slugLabel: "Slug (no editable)",
      slugReadonly: "",
      name: "Nombre",
      logoUrl: "Logo URL (opcional)",
      language: "Idioma por defecto del asistente",
      platformFee: "Comisión plataforma (basis points)",
      platformFeeHelp: "100 bps = 1%. Aplica a cada orden via MP Marketplace (requiere cuenta aprobada).",
      customDomain: "Dominio custom",
      customDomainPlaceholder: "tienda.tuempresa.com",
      customDomainHelp: "Configurá un CNAME apuntando a tu deployment. El catálogo público aparecerá en este dominio (plan Pro+).",
      saved: "Empresa actualizada",
      saveError: "No se pudo actualizar",
    },
  },
  preferences: {
    theme: "Tema",
    language: "Idioma",
  },
};
//#endregion
