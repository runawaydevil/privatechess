// SEO Multilingual Management
const seoData = {
  pt: {
    title: "Private CHESS - Jogo de Xadrez Online Seguro e Privado",
    description: "Jogue xadrez online de forma segura e privada. Sem cadastro, sem dados salvos. Jogo de xadrez anônimo com chat privado e salas personalizadas. Disponível em português, inglês e russo.",
    keywords: "xadrez online, jogo de xadrez, xadrez privado, xadrez seguro, xadrez anônimo, chess online, private chess, jogo de tabuleiro online",
    ogTitle: "Private CHESS - Jogo de Xadrez Online Seguro e Privado",
    ogDescription: "Jogue xadrez online de forma segura e privada. Sem cadastro, sem dados salvos. Jogo de xadrez anônimo com chat privado e salas personalizadas.",
    twitterTitle: "Private CHESS - Jogo de Xadrez Online Seguro e Privado",
    twitterDescription: "Jogue xadrez online de forma segura e privada. Sem cadastro, sem dados salvos. Jogo de xadrez anônimo com chat privado e salas personalizadas.",
    ogLocale: "pt_BR",
    structuredData: {
      description: "Jogo de xadrez online seguro e privado, sem necessidade de cadastro ou coleta de dados pessoais.",
      featureList: [
        "Jogo de xadrez online",
        "Privacidade total",
        "Sem cadastro",
        "Chat anônimo",
        "Salas privadas",
        "Múltiplos idiomas"
      ]
    }
  },
  en: {
    title: "Private CHESS - Secure and Private Online Chess Game",
    description: "Play chess online safely and privately. No registration, no data saved. Anonymous chess game with private chat and custom rooms. Available in Portuguese, English and Russian.",
    keywords: "online chess, chess game, private chess, secure chess, anonymous chess, chess online, private chess, online board game",
    ogTitle: "Private CHESS - Secure and Private Online Chess Game",
    ogDescription: "Play chess online safely and privately. No registration, no data saved. Anonymous chess game with private chat and custom rooms.",
    twitterTitle: "Private CHESS - Secure and Private Online Chess Game",
    twitterDescription: "Play chess online safely and privately. No registration, no data saved. Anonymous chess game with private chat and custom rooms.",
    ogLocale: "en_US",
    structuredData: {
      description: "Secure and private online chess game, no registration or personal data collection required.",
      featureList: [
        "Online chess game",
        "Total privacy",
        "No registration",
        "Anonymous chat",
        "Private rooms",
        "Multiple languages"
      ]
    }
  },
  ru: {
    title: "Private CHESS - Безопасная и приватная онлайн-игра в шахматы",
    description: "Играйте в шахматы онлайн безопасно и приватно. Без регистрации, без сохранения данных. Анонимная игра в шахматы с приватным чатом и персональными комнатами. Доступно на португальском, английском и русском языках.",
    keywords: "шахматы онлайн, игра в шахматы, приватные шахматы, безопасные шахматы, анонимные шахматы, chess online, private chess, онлайн настольная игра",
    ogTitle: "Private CHESS - Безопасная и приватная онлайн-игра в шахматы",
    ogDescription: "Играйте в шахматы онлайн безопасно и приватно. Без регистрации, без сохранения данных. Анонимная игра в шахматы с приватным чатом и персональными комнатами.",
    twitterTitle: "Private CHESS - Безопасная и приватная онлайн-игра в шахматы",
    twitterDescription: "Играйте в шахматы онлайн безопасно и приватно. Без регистрации, без сохранения данных. Анонимная игра в шахматы с приватным чатом и персональными комнатами.",
    ogLocale: "ru_RU",
    structuredData: {
      description: "Безопасная и приватная онлайн-игра в шахматы, не требует регистрации или сбора персональных данных.",
      featureList: [
        "Онлайн-игра в шахматы",
        "Полная приватность",
        "Без регистрации",
        "Анонимный чат",
        "Приватные комнаты",
        "Множественные языки"
      ]
    }
  }
};

function updateSEO(lang) {
  const data = seoData[lang];
  if (!data) return;

  // Update title
  document.getElementById('seo-title').textContent = data.title;
  document.title = data.title;

  // Update meta description
  document.getElementById('seo-description').setAttribute('content', data.description);

  // Update meta keywords
  document.getElementById('seo-keywords').setAttribute('content', data.keywords);

  // Update Open Graph
  document.getElementById('og-title').setAttribute('content', data.ogTitle);
  document.getElementById('og-description').setAttribute('content', data.ogDescription);
  document.getElementById('og-locale').setAttribute('content', data.ogLocale);

  // Update Twitter
  document.getElementById('twitter-title').setAttribute('content', data.twitterTitle);
  document.getElementById('twitter-description').setAttribute('content', data.twitterDescription);

  // Update structured data
  const structuredDataElement = document.getElementById('structured-data');
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Private CHESS",
    "description": data.structuredData.description,
    "url": "https://privatechess.org",
    "applicationCategory": "Game",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "Pablo Murad"
    },
    "creator": {
      "@type": "Person",
      "name": "Pablo Murad"
    },
    "inLanguage": ["pt-BR", "en-US", "ru-RU"],
    "featureList": data.structuredData.featureList
  };
  
  structuredDataElement.textContent = JSON.stringify(structuredData, null, 2);

  // Update hreflang
  updateHreflang(lang);
}

function updateHreflang(lang) {
  const hreflangMap = {
    pt: 'pt-BR',
    en: 'en-US',
    ru: 'ru-RU'
  };

  // Remove existing hreflang links
  const existingHreflang = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingHreflang.forEach(link => link.remove());

  // Add new hreflang links
  const head = document.head;
  
  Object.entries(hreflangMap).forEach(([langCode, hreflang]) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = `https://privatechess.org?lang=${langCode}`;
    head.appendChild(link);
  });

  // Add x-default
  const xDefaultLink = document.createElement('link');
  xDefaultLink.rel = 'alternate';
  xDefaultLink.hreflang = 'x-default';
  xDefaultLink.href = 'https://privatechess.org';
  head.appendChild(xDefaultLink);
}

// Export for use in main.js
window.updateSEO = updateSEO; 