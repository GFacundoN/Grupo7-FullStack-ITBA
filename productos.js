const productos = [
  {
    id: 1,
    nombre: "Aparador Uspallata",
    categoria: "Living",
    precio: 850000,
    imagen: "img/productos/aparador-uspallata.png",

    descripcionCorta:
      "Aparador de seis puertas en nogal sostenible con tiradores metálicos en acabado latón.",

    descripcion:
      `Aparador de seis puertas fabricado en nogal sostenible con tiradores metálicos en acabado latón.
      Su silueta minimalista realza el veteado natural de la madera, creando una pieza que combina funcionalidad y elegancia atemporal para espacios contemporáneos.`,

    detalles: {
      medidas: "180 x 45 x 75 cm",
      materiales: "Nogal macizo FSC®, herrajes de latón",
      acabado: "Aceite natural ecológico",
      peso: "68 kg",
      capacidad: "6 compartimentos interiores"
    },

    destacado: false
  },
  {
    id: 2,
    nombre: "Biblioteca Recoleta",
    categoria: "Living",
    precio: 620000,
    imagen: "img/productos/biblioteca-recoleta.png",

    descripcionCorta:
      "Sistema modular de estantes abiertos en acero Sage Green y roble claro.",

    descripcion:
      `Sistema modular de estantes abierto que combina estructura de acero Sage Green y repisas en roble claro.
      Perfecta para colecciones y objetos de diseño, su diseño versátil se adapta a cualquier espacio contemporáneo con elegancia funcional.`,

    detalles: {
      medidas: "100 x 35 x 200 cm",
      materiales: "Estructura de acero, estantes de roble",
      acabado: "Laca mate ecológica",
      capacidad: "45 kg por estante",
      modulares: "5 estantes ajustables"
    },

    destacado: false
  },
  {
    id: 3,
    nombre: "Butaca Mendoza",
    categoria: "Living",
    precio: 480000,
    imagen: "img/productos/butaca-mendoza.png",

    descripcionCorta:
      "Butaca tapizada en bouclé Dusty Rose con base de madera de guatambú.",

    descripcion:
      `Butaca tapizada en bouclé Dusty Rose con base de madera de guatambú.
      El respaldo curvo abraza el cuerpo y ofrece máximo confort, mientras que su diseño orgánico aporta calidez y sofisticación a cualquier ambiente contemporáneo.`,

    detalles: {
      medidas: "80 x 75 x 85 cm",
      materiales: "Guatambú macizo, tela bouclé",
      acabado: "Cera vegetal, tapizado premium",
      tapizado: "Repelente al agua y manchas",
      confort: "Espuma alta densidad"
    },

    destacado: true
  },
  {
    id: 4,
    nombre: "Sillón Copacabana",
    categoria: "Living",
    precio: 690000,
    imagen: "img/productos/sillon-copacabana.png",

    descripcionCorta:
      "Sillón lounge en cuero cognac con base giratoria, estética brasilera de los 60.",

    descripcion:
      `Sillón lounge en cuero cognac con base giratoria en acero Burnt Sienna.
      Inspirado en la estética brasilera moderna de los 60, combina comodidad excepcional con un diseño icónico que trasciende tendencias y épocas.`,

    detalles: {
      medidas: "90 x 85 x 95 cm",
      materiales: "Cuero curtido vegetal, acero pintado",
      acabado: "Cuero anilina premium",
      rotacion: "360° silenciosa y suave",
      garantia: "10 años en estructura"
    },

    destacado: true
  },
  {
    id: 5,
    nombre: "Mesa de Centro Araucaria",
    categoria: "Living",
    precio: 410000,
    imagen: "img/productos/mesa-centro-araucaria.png",

    descripcionCorta:
      "Mesa de centro con sobre de mármol Patagonia y base de tres patas en nogal.",

    descripcion:
      `Mesa de centro con sobre circular de mármol Patagonia y base de tres patas en madera de nogal.
      Su diseño minimalista se convierte en el punto focal perfecto para cualquier sala de estar contemporánea, combinando la frialdad del mármol con la calidez de la madera.`,

    detalles: {
      medidas: "90 x 90 x 45 cm",
      materiales: "Sobre de mármol Patagonia, patas de nogal",
      acabado: "Mármol pulido, aceite natural en madera",
      peso: "42 kg",
      cargaMaxima: "25 kg distribuidos"
    },

    destacado: true
  },
  {
    id: 6,
    nombre: "Mesa de Noche Aconcagua",
    categoria: "Dormitorio",
    precio: 195000,
    imagen: "img/productos/mesa-noche-aconcagua.png",

    descripcionCorta:
      "Mesa de noche con cajón oculto y repisa inferior en roble certificado FSC®.",

    descripcion:
      `Mesa de noche con cajón oculto y repisa inferior en roble certificado FSC®.
      Su diseño limpio y funcional permite convivir con diferentes estilos de dormitorio, ofreciendo almacenamiento discreto y elegante para objetos personales.`,

    detalles: {
      medidas: "45 x 35 x 60 cm",
      materiales: "Roble macizo FSC®, herrajes soft-close",
      acabado: "Barniz mate de poliuretano",
      almacenamiento: "1 cajón + repisa inferior",
      caracteristicas: "Cajón con cierre suave"
    },

    destacado: false
  },
  {
    id: 7,
    nombre: "Sofá Patagonia",
    categoria: "Living",
    precio: 980000,
    imagen: "img/productos/sofa-patagonia.png",

    descripcionCorta:
      "Sofá de tres cuerpos en lino Warm Alabaster con patas cónicas de madera.",

    descripcion:
      `Sofá de tres cuerpos tapizado en lino Warm Alabaster con patas cónicas de madera.
      Los cojines combinan espuma de alta resiliencia con plumón reciclado, ofreciendo comodidad duradera y sostenible para el hogar moderno.`,

    detalles: {
      medidas: "220 x 90 x 80 cm",
      estructura: "Madera de eucalipto certificada FSC®",
      tapizado: "Lino 100% natural premium",
      relleno: "Espuma HR + plumón reciclado",
      sostenibilidad: "Materiales 100% reciclables"
    },

    destacado: true
  },
  {
    id: 8,
    nombre: "Mesa Comedor Pampa",
    categoria: "Comedor",
    precio: 875000,
    imagen: "img/productos/mesa-comedor-pampa.png",

    descripcionCorta:
      "Mesa extensible de roble macizo, se adapta de 6 a 10 comensales.",

    descripcion:
      `Mesa extensible de roble macizo con tablero biselado y sistema de apertura suave.
      Su diseño robusto y elegante se adapta perfectamente a reuniones íntimas o grandes celebraciones familiares, extendiéndose de 6 a 10 comensales.`,

    detalles: {
      medidas: "160-240 x 90 x 75 cm",
      materiales: "Roble macizo FSC®, mecanismo alemán",
      acabado: "Aceite-cera natural",
      capacidad: "6-10 comensales",
      extension: "Sistema de mariposa central"
    },

    destacado: false
  },
  {
    id: 9,
    nombre: "Sillas Córdoba",
    categoria: "Comedor",
    precio: 520000,
    imagen: "img/productos/sillas-cordoba.png",

    descripcionCorta:
      "Set de 4 sillas apilables en contrachapado de nogal y estructura tubular.",

    descripcion:
      `Set de cuatro sillas apilables en contrachapado moldeado de nogal y estructura tubular pintada en Sage Green.
      Su diseño ergonómico y materiales de calidad garantizan comodidad y durabilidad en el uso diario, perfectas para comedores contemporáneos.`,

    detalles: {
      medidas: "45 x 52 x 80 cm (cada una)",
      materiales: "Contrachapado nogal, tubo de acero",
      acabado: "Laca mate, pintura epoxi",
      apilables: "Hasta 6 sillas",
      incluye: "Set de 4 sillas"
    },

    destacado: false
  },
  {
    id: 10,
    nombre: "Escritorio Costa",
    categoria: "Estudio",
    precio: 310000,
    imagen: "img/productos/escritorio-costa.png",

    descripcionCorta:
      "Escritorio compacto en bambú laminado con cajón organizado y pasacables.",

    descripcion:
      `Escritorio compacto con cajón organizado y tapa pasacables integrada en bambú laminado.
      Ideal para espacios de trabajo en casa, combina funcionalidad moderna con estética minimalista y sostenible, perfecto para el trabajo remoto.`,

    detalles: {
      medidas: "120 x 60 x 75 cm",
      materiales: "Bambú laminado, herrajes ocultos",
      acabado: "Laca mate resistente",
      almacenamiento: "1 cajón con organizador",
      cables: "Pasacables integrado"
    },

    destacado: false
  },
  {
    id: 11,
    nombre: "Silla de Trabajo Belgrano",
    categoria: "Estudio",
    precio: 265000,
    imagen: "img/productos/silla-trabajo-belgrano.png",

    descripcionCorta:
      "Silla ergonómica regulable con respaldo de malla transpirable.",

    descripcion:
      `Silla ergonómica regulable en altura con respaldo de malla transpirable y asiento tapizado en tejido reciclado.
      Diseñada para largas jornadas de trabajo con máximo confort y apoyo lumbar, ideal para oficinas en casa y espacios de coworking.`,

    detalles: {
      medidas: "60 x 60 x 90-100 cm",
      materiales: "Malla técnica, tejido reciclado",
      acabado: "Base cromada, tapizado premium",
      regulacion: "Altura + inclinación respaldo",
      certificacion: "Ergonomía europea EN 1335"
    },

    destacado: false
  }
];