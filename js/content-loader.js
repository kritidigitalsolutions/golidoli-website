function renderSkeleton(sectionId) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  if (section.dataset.skeleton === "hero") {
    section.innerHTML = `
      <div class="hero-banner-swiper shimmer" aria-live="polite">
        <div class="hero-banner-slide">
          <div class="hero-banner-media" aria-hidden="true"></div>
          <div class="hero-banner-content">
            <span class="section-kicker">Loading</span>
            <h2 class="hero-title">Goli Doli Is Getting Ready</h2>
            <p class="hero-subtitle">Fresh entertainment is loading for you.</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  section.innerHTML = `
    <div class="skeleton-grid" aria-live="polite">
      ${Array.from({ length: Number(section.dataset.skeletonCount || 4) })
        .map(() => '<div class="skeleton-card"></div>')
        .join("")}
    </div>
  `;
}

async function loadDynamicContent(endpoint, sectionId, renderCallback) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return null;
  }

  renderSkeleton(sectionId);

  try {
    const response = await fetch(buildApiUrl(endpoint), {
      headers: {
        Accept: "application/json",
        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`Goli Doli API response for ${endpoint}`, data);
    renderCallback(data, section);
    document.dispatchEvent(new CustomEvent("golidoli:content-rendered", { detail: { sectionId } }));
    return data;
  } catch (error) {
    console.error(`Goli Doli API fallback for ${endpoint}`, error);
    const fallbackData = getFallbackData(endpoint);
    renderCallback(fallbackData, section, true);
    document.dispatchEvent(new CustomEvent("golidoli:content-rendered", { detail: { sectionId, fallback: true } }));
    return fallbackData;
  }
}

function getFallbackData(endpoint) {
  if (endpoint.includes("landing")) {
    return {
      banners: getFallbackData("/api/banners/featured"),
      categories: getFallbackData("/api/categories/banners"),
      top_movies: getFallbackRail("movies", 10),
      latest_webseries: getFallbackRail("web-series", 12),
      trending_tv_shows: getFallbackRail("tv-shows", 12),
      latest_micro_drama: getFallbackRail("micro-drama", 12),
      ai_reels: getFallbackRail("ai-reels", 12),
    };
  }

  if (endpoint.includes("featured")) {
    return [
      {
        id: "featured-1",
        title: "Indian Entertainment, On Your Terms",
        description: "Stream web series, movies, TV shows, micro dramas, and AI reels made for the way India watches.",
        thumbnail_url: "",
        genre: "Featured",
        rating: "U/A 16+",
      },
      {
        id: "featured-2",
        title: "Fresh Stories Every Week",
        description: "Discover premium drama, comedy, romance, thrillers, and fast-moving short-form entertainment.",
        thumbnail_url: "",
        genre: "New Releases",
        rating: "U/A 13+",
      },
      {
        id: "featured-3",
        title: "Movies, Shows, Reels",
        description: "One destination for cinematic Indian entertainment across every screen.",
        thumbnail_url: "",
        genre: "OTT",
        rating: "U/A",
      },
    ];
  }

  if (endpoint.includes("categories")) {
    return [
      { name: "Web Series", icon: "ri-movie-2-line", type: "web-series" },
      { name: "Movies", icon: "ri-film-line", type: "movies" },
      { name: "TV Shows", icon: "ri-tv-2-line", type: "tv-shows" },
      { name: "Micro Drama", icon: "ri-drama-line", type: "micro-drama" },
      { name: "AI Reels", icon: "uil uil-robot", type: "ai-reels" },
    ];
  }

  const typeMatch = endpoint.match(/type=([^&]+)/);
  let preferredType = typeMatch ? decodeURIComponent(typeMatch[1]) : "";

  if (!preferredType && endpoint.includes("top-movies")) preferredType = "movies";
  if (!preferredType && endpoint.includes("web-series")) preferredType = "web-series";
  if (!preferredType && endpoint.includes("tv-shows")) preferredType = "tv-shows";
  if (!preferredType && endpoint.includes("micro-drama")) preferredType = "micro-drama";
  if (!preferredType && endpoint.includes("ai-reels")) preferredType = "ai-reels";

  const labels = preferredType
    ? [preferredType]
    : ["Web Series", "Movie", "TV Show", "Micro Drama", "AI Reel"];

  return getFallbackRail(labels[0] || "Movie", endpoint.includes("trending") ? 12 : 10, labels);
}

function extractLandingContentItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data?.content)) {
    return data.data.content;
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items;
  }

  return [];
}

function normalizeLandingContentItem(item, fallbackType = "") {
  const normalizedType = String(
    item?.type || item?.content_type || item?.contentType || item?.category || fallbackType || ""
  ).trim();

  return {
    ...item,
    title: item?.title || item?.name || item?.headline || item?.label || "Untitled",
    description: item?.description || item?.summary || item?.overview || "",
    type: normalizedType,
    thumbnail_url:
      item?.thumbnail_url ||
      item?.thumbnailUrl ||
      item?.banner_url ||
      item?.bannerUrl ||
      item?.image_url ||
      item?.imageUrl ||
      item?.poster_url ||
      item?.posterUrl ||
      item?.banner ||
      item?.image ||
      item?.poster ||
      "",
    year: item?.year || item?.release_year || item?.releaseYear || item?.published_year || "",
    rating: item?.rating || item?.age_rating || item?.ageRating || "",
  };
}

function getStaticCategories() {
  return [
    { name: "Web Series", icon: "ri-movie-2-line", type: "web-series" },
    { name: "Movies", icon: "ri-film-line", type: "movies" },
    { name: "TV Shows", icon: "ri-tv-2-line", type: "tv-shows" },
    { name: "Micro Drama", icon: "ri-drama-line", type: "micro-drama" },
    { name: "AI Reels", icon: "uil uil-robot", type: "ai-reels" },
  ];
}

function matchesLandingContentType(item, keywords) {
  const normalized = String(
    item?.type || item?.content_type || item?.contentType || item?.category || item?.genre || ""
  ).toLowerCase();

  return keywords.some((keyword) => normalized.includes(keyword));
}

function buildLandingCategories(contentItems) {
  const categories = [];
  const seen = new Set();

  contentItems.forEach((item) => {
    const type = String(item?.type || item?.content_type || item?.contentType || item?.category || "").trim();
    const fallbackLabel = item?.title || item?.name || type || "Category";
    const slug = slugify(type || fallbackLabel);

    if (!slug || seen.has(slug)) {
      return;
    }

    seen.add(slug);
    categories.push({
      name: fallbackLabel,
      icon: getTypeIcon(type || fallbackLabel),
      type: type || slug,
    });
  });

  return categories.length ? categories.slice(0, 5) : getFallbackData("/api/categories/banners");
}

function buildLandingCategories() {
  return getStaticCategories();
}

function selectLandingItems(contentItems, keywords, fallbackType, count) {
  const filtered = contentItems.filter((item) => matchesLandingContentType(item, keywords));
  const sourceItems = filtered.length ? filtered : contentItems;
  const fallbackItems = getFallbackRail(fallbackType, count);

  if (!sourceItems.length) {
    return fallbackItems;
  }

  const combined = sourceItems.slice(0, count).map((item) => ({ ...item }));

  for (let index = combined.length; index < count; index += 1) {
    const fallbackItem = fallbackItems[index];
    if (fallbackItem) {
      combined.push(fallbackItem);
    }
  }

  return combined;
}

function selectHeroItems(contentItems, count = 3) {
  const heroItems = contentItems.filter((item) => Boolean(
    item?.banner ||
    item?.banner_url ||
    item?.bannerUrl ||
    item?.poster ||
    item?.poster_url ||
    item?.posterUrl
  ));

  const sourceItems = heroItems.length ? heroItems : contentItems;
  return sourceItems.slice(0, count);
}

function deriveLandingSectionPayload(sectionId, data) {
  const contentItems = extractLandingContentItems(data).map((item) => normalizeLandingContentItem(item));

  if (!contentItems.length) {
    return [];
  }

  switch (sectionId) {
    case "hero-banner-slider":
      return selectHeroItems(contentItems, 3);
    case "categories-grid":
      return getStaticCategories();
    case "top-movies-carousel": {
      return selectLandingItems(contentItems, ["movie"], "movies", 10);
    }
    case "latest-webseries-carousel": {
      return selectLandingItems(contentItems, ["web-series", "webseries", "series"], "web-series", 12);
    }
    case "trending-tv-carousel": {
      return selectLandingItems(contentItems, ["tv"], "tv-shows", 12);
    }
    case "latest-micro-drama-carousel": {
      return selectLandingItems(contentItems, ["micro"], "micro-drama", 12);
    }
    case "ai-reels-carousel": {
      return selectLandingItems(contentItems, ["ai", "reel"], "ai-reels", 12);
    }
    default:
      return contentItems;
  }
}

function getFallbackRail(type, count = 10, labelsOverride = null) {
  const labels = labelsOverride || [type];

  return Array.from({ length: count }).map((_, index) => {
    const label = labels[index % labels.length];
    return {
      id: `fallback-${label}-${index + 1}`,
      title: getFallbackTitle(label, index),
      thumbnail_url: "",
      type: label,
      rating: index % 3 === 0 ? "A" : "U/A 16+",
      year: 2026 - (index % 4),
    };
  });
}

function getFallbackTitle(type, index) {
  const titles = {
    "Web Series": ["Mumbai Nights", "Indian Crime Files", "After College", "Royal Mansion"],
    Movie: ["Monsoon Love", "The Last Local", "Festival Junction", "Capital Operation"],
    "TV Show": ["Family Hour", "Comedy Chowk", "Kitchen Stories", "Weekend Rangmanch"],
    "Micro Drama": ["Two Minute Twist", "Secret Message", "Metro Moment", "Office Crush"],
    "AI Reel": ["Future Beat", "Virtual Star", "Synthetic Dreams", "Neon Folk"],
    movies: ["Monsoon Love", "The Last Local", "Festival Junction", "Capital Operation"],
    "web-series": ["Mumbai Nights", "Indian Crime Files", "After College", "Royal Mansion"],
    "tv-shows": ["Family Hour", "Comedy Chowk", "Kitchen Stories", "Weekend Rangmanch"],
    "micro-drama": ["Two Minute Twist", "Secret Message", "Metro Moment", "Office Crush"],
    "ai-reels": ["Future Beat", "Virtual Star", "Synthetic Dreams", "Neon Folk"],
  };
  const group = titles[type] || titles.Movie;
  return group[index % group.length];
}

function renderHeroBannerSlider(data, section, isFallback) {
  const items = Array.isArray(data) ? data : data.items || [data];

  section.innerHTML = `
    <div class="swiper hero-banner-swiper">
      <div class="swiper-wrapper">
        ${items.map((item) => {
          const imageUrl = getMediaUrl(item, ["banner", "image", "poster", "thumbnail"]);
          const hasImage = imageUrl && !isFallback;
          return `
            <article class="swiper-slide hero-banner-slide">
              ${
                hasImage
                  ? `<img src="${escapeHtml(resolveAssetUrl(imageUrl))}" alt="${escapeHtml(item.title)}" loading="lazy">`
                  : `<div class="hero-banner-media shimmer" aria-hidden="true"></div>`
              }
              <div class="hero-banner-content">
                <span class="section-kicker"><i class="ri-fire-fill" aria-hidden="true"></i>${escapeHtml(item.genre || "Featured")}</span>
                <h2 class="hero-title">${escapeHtml(item.title)}</h2>
                <p class="hero-subtitle">${escapeHtml(item.description || "Stream the latest Goli Doli spotlight now.")}</p>
                <div class="hero-cta">
                  <a class="btn-brand" href="#top-movies">Start Watching</a>
                  <a class="btn-outline-blue" href="#download">Download App</a>
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
      <div class="swiper-pagination"></div>
    </div>
  `;
}

function renderFeaturedBanner(data, section, isFallback) {
  const imageUrl = getMediaUrl(data);
  const hasImage = imageUrl && !isFallback;

  section.innerHTML = `
    <article class="featured-panel card-glow">
      ${
        hasImage
          ? `<img src="${escapeHtml(resolveAssetUrl(imageUrl))}" alt="${escapeHtml(data.title)}" loading="lazy">`
          : `<div class="featured-fallback shimmer">
              <div class="fallback-content">
                <i class="ri-play-circle-line" aria-hidden="true"></i>
                <h2>${escapeHtml(data.title)}</h2>
                <p>Featured banner placeholder</p>
              </div>
            </div>`
      }
      <div class="featured-overlay">
        <span class="content-eyebrow">${escapeHtml(data.genre || "Featured")} • ${escapeHtml(data.rating || "U/A")}</span>
        <h2>${escapeHtml(data.title)}</h2>
        <p>${escapeHtml(data.description || "Stream the latest Goli Doli spotlight now.")}</p>
        <div class="meta-row">
          <span><i class="ri-star-fill" aria-hidden="true"></i> ${escapeHtml(data.rating || "U/A")}</span>
          <span><i class="ri-fire-fill" aria-hidden="true"></i> Featured Now</span>
        </div>
      </div>
    </article>
  `;
}

function renderContentCarousel(data, section, isFallback) {
  const items = Array.isArray(data) ? data : data.items || [];
  const swiperClass = section.dataset.swiperClass || "content-swiper";
  const variant = section.dataset.cardVariant || "";

  section.innerHTML = `
    <div class="swiper ${swiperClass}">
      <div class="swiper-wrapper">
        ${items.map((item, index) => renderContentSlide(item, index, isFallback, variant)).join("")}
      </div>
      <div class="swiper-pagination"></div>
    </div>
  `;
}

function renderContentSlide(item, index, isFallback, variant = "") {
  const label = normalizeTypeLabel(item.type || "Movie");
  const imageUrl = getMediaUrl(item, ["poster", "thumbnail", "image", "banner"]);
  const image = imageUrl && !isFallback
    ? `<img src="${escapeHtml(resolveAssetUrl(imageUrl))}" alt="${escapeHtml(item.title)}" loading="lazy">`
    : `<div class="featured-fallback shimmer">
        <div class="fallback-content">
          <i class="${getTypeIcon(label)}" aria-hidden="true"></i>
        </div>
      </div>`;

  return `
    <div class="swiper-slide">
      <article class="content-card ${variant === "top10" ? "top10-card" : ""} card-glow" tabindex="0" aria-label="Play ${escapeHtml(item.title)}">
        ${variant === "top10" ? `<span class="rank-number" aria-hidden="true">${index + 1}</span>` : ""}
        ${image}
        <div class="card-overlay">
          <span class="badge-type">${escapeHtml(label)}</span>
          <div>
            <h3 class="card-title">${escapeHtml(item.title || `Goli Doli ${index + 1}`)}</h3>
            <div class="meta-row">
              <span>${escapeHtml(item.year || "2026")}</span>
              <span>${escapeHtml(item.rating || "U/A")}</span>
            </div>
          </div>
        </div>
        <button class="play-fab" type="button" aria-label="Play ${escapeHtml(item.title)}">
          <i class="ri-play-fill" aria-hidden="true"></i>
        </button>
      </article>
    </div>
  `;
}

function getMediaUrl(item, preferredTypes = ["poster", "thumbnail", "image", "banner"]) {
  const sourceMap = {
    poster: ["poster_url", "posterUrl", "poster"],
    thumbnail: ["thumbnail_url", "thumbnailUrl"],
    image: ["image_url", "imageUrl", "image"],
    banner: ["banner_url", "bannerUrl", "banner"],
  };

  const keys = Array.isArray(preferredTypes) && preferredTypes.length
    ? preferredTypes.flatMap((type) => sourceMap[type] || [])
    : ["poster_url", "posterUrl", "poster", "thumbnail_url", "thumbnailUrl", "image_url", "imageUrl", "banner_url", "bannerUrl", "banner", "image"];

  return keys.map((key) => item?.[key]).find(Boolean) || "";
}

function renderCategories(data, section, isFallback) {
  const items = Array.isArray(data) ? data : data.categories || [];
  const normalized = getStaticCategories();

  section.innerHTML = `
    <div class="category-grid">
      ${normalized
        .map((category, index) => {
          const type = category.type || slugify(category.name || category.title);
          const hasImage = (category.thumbnail_url || category.banner_url || category.image_url) && !isFallback;
          const imageUrl = category.thumbnail_url || category.banner_url || category.image_url || "";
          return `
            <a class="category-card category-${index + 1}" href="${getCategoryHref(type)}" data-target-tab="${escapeHtml(type)}" aria-label="Browse ${escapeHtml(category.name || category.title)}">
              ${hasImage ? `<img class="category-bg-img" src="${escapeHtml(resolveAssetUrl(imageUrl))}" alt="" loading="lazy" aria-hidden="true">` : ""}
              <div class="category-content">
                <span class="category-icon"><i class="${escapeHtml(category.icon || getTypeIcon(category.name || category.title))}" aria-hidden="true"></i></span>
                <h3>${escapeHtml(category.name || category.title)}</h3>
              </div>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}

function getCategoryHref(type) {
  const normalized = String(type).toLowerCase();
  if (normalized.includes("web")) return "#latest-webseries";
  if (normalized.includes("movie")) return "#top-movies";
  if (normalized.includes("tv")) return "#trending-tv";
  if (normalized.includes("micro")) return "#latest-micro-drama";
  if (normalized.includes("ai")) return "#ai-reels";
  return "#top-movies";
}

function normalizeTypeLabel(type) {
  return String(type)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace("Ai", "AI")
    .toUpperCase();
}

function getTypeIcon(type) {
  const normalized = String(type).toLowerCase();
  if (normalized.includes("web")) return "ri-movie-2-line";
  if (normalized.includes("tv")) return "ri-tv-2-line";
  if (normalized.includes("micro")) return "ri-drama-line";
  if (normalized.includes("ai")) return "uil uil-robot";
  return "ri-film-line";
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("hero-banner-slider")) {
    loadLandingPageContent();
  }
});

async function loadLandingPageContent() {
  const sectionIds = [
    "hero-banner-slider",
    "categories-grid",
    "top-movies-carousel",
    "latest-webseries-carousel",
    "trending-tv-carousel",
    "latest-micro-drama-carousel",
    "ai-reels-carousel",
  ];

  sectionIds.forEach((sectionId) => {
    if (document.getElementById(sectionId)) {
      renderSkeleton(sectionId);
    }
  });

  try {
    const response = await fetch(buildApiUrl("/api/content/landing"), {
      headers: {
        Accept: "application/json",
        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Goli Doli API response for /api/content/landing", data);
    renderLandingPage(data);
  } catch (error) {
    console.error("Goli Doli API fallback for /api/content/landing", error);
    renderLandingPage(getFallbackData("/api/content/landing"), true);
  }
}

function renderLandingPage(data, isFallback = false) {
  renderLandingSection("hero-banner-slider", data, ["banners", "banner", "hero_banners", "heroBanners", "featured_banners", "featuredBanners", "featured", "hero", "sliders", "slider"], renderHeroBannerSlider, isFallback);
  renderLandingSection("categories-grid", data, ["categories", "category", "category_banners", "categoryBanners"], renderCategories, isFallback);
  renderLandingSection("top-movies-carousel", data, ["top_movies", "topMovies", "top10_movies", "top10Movies", "movies_top_10", "moviesTop10", "top10"], renderContentCarousel, isFallback);
  renderLandingSection("latest-webseries-carousel", data, ["latest_webseries", "latestWebseries", "latest_web_series", "latestWebSeries", "web_series", "webSeries", "webseries"], renderContentCarousel, isFallback);
  renderLandingSection("trending-tv-carousel", data, ["trending_tv_shows", "trendingTvShows", "trending_tv", "trendingTv", "tv_shows", "tvShows"], renderContentCarousel, isFallback);
  renderLandingSection("latest-micro-drama-carousel", data, ["latest_micro_drama", "latestMicroDrama", "micro_drama", "microDrama", "micro_dramas", "microDramas"], renderContentCarousel, isFallback);
  renderLandingSection("ai-reels-carousel", data, ["ai_reels", "aiReels", "ai_reel", "aiReel", "reels"], renderContentCarousel, isFallback);
  document.dispatchEvent(new CustomEvent("golidoli:content-rendered", { detail: { sectionId: "landing", fallback: isFallback } }));
}

function renderLandingSection(sectionId, data, keys, renderer, isFallback) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  const fallbackLanding = getFallbackData("/api/content/landing");
  const payload = pickLandingPayload(data, keys);
  const derivedPayload = hasPayload(payload) ? [] : deriveLandingSectionPayload(sectionId, data);
  const fallbackPayload = pickLandingPayload(fallbackLanding, keys);
  const finalPayload = hasPayload(payload) ? payload : (hasPayload(derivedPayload) ? derivedPayload : fallbackPayload);
  renderer(finalPayload, section, isFallback || (!hasPayload(payload) && !hasPayload(derivedPayload)));
}

function pickLandingPayload(data, keys) {
  for (const key of keys) {
    if (data && data[key]) {
      return data[key];
    }
  }

  if (data && data.data) {
    return pickLandingPayload(data.data, keys);
  }

  return [];
}

function hasPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.length > 0;
  }

  return Boolean(payload && Object.keys(payload).length);
}
