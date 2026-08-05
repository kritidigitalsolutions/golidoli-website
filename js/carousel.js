function initContentSwipers(scope = document) {
  if (typeof Swiper === "undefined") {
    return;
  }

  scope.querySelectorAll(".swiper").forEach((swiperEl) => {
    const slideCount = swiperEl.querySelectorAll(".swiper-slide").length;
    const shouldLoop = swiperEl.classList.contains("hero-banner-swiper")
      ? slideCount > 3
      : slideCount >= 4;

    if (swiperEl.swiper && !swiperEl.classList.contains("hero-banner-swiper")) {
      swiperEl.swiper.update();
      return;
    }

    if (swiperEl.swiper && swiperEl.classList.contains("hero-banner-swiper")) {
      swiperEl.swiper.destroy(true, true);
    }

    if (swiperEl.classList.contains("hero-banner-swiper")) {
      new Swiper(swiperEl, {
        loop: false,
        slidesPerView: 1,
        spaceBetween: 0,
        speed: 900,
        effect: "slide",
        autoplay: {
          delay: 3800,
          disableOnInteraction: false,
        },
        observer: true,
        observeParents: true,
        pagination: {
          el: swiperEl.querySelector(".swiper-pagination"),
          clickable: true,
        },
      });
      return;
    }

    new Swiper(swiperEl, {
      loop: shouldLoop,
      speed: 700,
      spaceBetween: 18,
      autoplay: {
        delay: 3200,
        disableOnInteraction: false,
      },
      pagination: {
        el: swiperEl.querySelector(".swiper-pagination"),
        clickable: true,
      },
      breakpoints: {
        0: { slidesPerView: 1.08 },
        576: { slidesPerView: 2.1 },
        992: { slidesPerView: 4 },
      },
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initContentSwipers();
});

document.addEventListener("golidoli:content-rendered", () => {
  initContentSwipers();
});
