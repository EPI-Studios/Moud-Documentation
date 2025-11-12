document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    const turbulence = document.querySelector('#handdrawnFilter feTurbulence');
    let seed = 1;
    setInterval(() => {
        seed += 1;
        if (turbulence) {
            turbulence.setAttribute('seed', seed);
        }
    }, 100);

    anime({
        targets: '#hero-content > *',
        opacity: [0, 1],
        translateY: [30, 0],
        delay: anime.stagger(200, { start: 500 }),
        duration: 1000,
        easing: 'easeOutExpo'
    });

    const heroLogo = document.querySelector('.hero-logo');
    if (heroLogo) {
        gsap.to(heroLogo, {
            y: -60,
            ease: 'none',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 2
            }
        });
    }

    const heroTagline = document.querySelector('#hero .tagline');
    if (heroTagline) {
        gsap.to(heroTagline, {
            y: -40,
            opacity: 0.5,
            ease: 'none',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 2
            }
        });
    }

    const heroButtons = document.querySelector('#hero .buttons');
    if (heroButtons) {
        gsap.to(heroButtons, {
            y: -30,
            opacity: 0.3,
            ease: 'none',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 2
            }
        });
    }

    const playWhatIsIn = () => {
        const moudEl = document.querySelector('.what-title .moud');
        const trembleElements = document.querySelectorAll('.what-title .what-is, .what-title .question');

        anime.set(moudEl, { opacity: 0, scale: 2.5 });
        anime.set(trembleElements, { opacity: 0, translateY: 10 });

        const tl = anime.timeline({
            easing: 'easeOutExpo'
        });

        tl.add({
            targets: trembleElements,
            opacity: 1,
            translateY: 0,
            duration: 400,
            delay: anime.stagger(100)
        });

        tl.add({
            targets: moudEl,
            opacity: 1,
            scale: 1,
            duration: 1200,
            easing: 'easeOutElastic(1, 0.6)'
        }, '-=200');

        tl.add({
            targets: trembleElements,
            duration: 800,
            translateX: [
                { value: () => anime.random(-8, 8), duration: 60 },
                { value: () => anime.random(-8, 8), duration: 60 },
                { value: () => anime.random(-8, 8), duration: 60 },
                { value: () => anime.random(-8, 8), duration: 60 },
                { value: 0, duration: 400 }
            ],
            rotate: [
                { value: () => anime.random(-5, 5), duration: 60 },
                { value: () => anime.random(-5, 5), duration: 60 },
                { value: () => anime.random(-5, 5), duration: 60 },
                { value: () => anime.random(-5, 5), duration: 60 },
                { value: 0, duration: 400 }
            ],
            easing: 'easeInOutSine',
            delay: anime.stagger(80)
        }, '-=1100');

        anime({
            targets: '.what-description p',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(220, { start: 600 }),
            duration: 700,
            easing: 'easeOutQuad'
        });
    };

    const resetWhatIs = () => {
        anime.set('.what-title > *', { opacity: 0, scale: 1, translateX: 0, rotate: 0 });
        anime.set('.what-description p', { opacity: 0, translateY: 24 });
    };

    ScrollTrigger.create({
        trigger: '#what-is-moud',
        start: 'top 60%',
        onEnter: playWhatIsIn,
        onEnterBack: playWhatIsIn,
        onLeaveBack: resetWhatIs
    });

    const track = document.querySelector('.features-track');
    let featureScroll = null;
    let featureResizeTimer;

    const enableFeatureScroll = () => {
        featureScroll = gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth),
            ease: 'none',
            scrollTrigger: {
                trigger: '#features',
                start: 'top top',
                end: () => `+=${track.scrollWidth - window.innerWidth}`,
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });
    };

    const disableFeatureScroll = () => {
        if (featureScroll) {
            featureScroll.scrollTrigger.kill();
            featureScroll.kill();
            featureScroll = null;
        }
        if (track) {
            gsap.set(track, { clearProps: 'transform' });
        }
    };

    const updateFeatureScroll = () => {
        if (!track) return;
        if (window.innerWidth >= 1024) {
            if (!featureScroll) {
                enableFeatureScroll();
            }
        } else {
            disableFeatureScroll();
        }
    };

    updateFeatureScroll();
    window.addEventListener('resize', () => {
        clearTimeout(featureResizeTimer);
        featureResizeTimer = setTimeout(updateFeatureScroll, 150);
    });

    const parallaxSections = gsap.utils.toArray('.parallax-section');
    parallaxSections.forEach((section) => {
        gsap.to(section, {
            yPercent: -10,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 2
            }
        });
    });

    const parallaxElements = gsap.utils.toArray('[data-parallax-depth]');
    parallaxElements.forEach((el) => {
        const depth = parseFloat(el.dataset.parallaxDepth) || 8;
        gsap.fromTo(
            el,
            { y: depth * 4, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 95%',
                    end: 'top 20%',
                    scrub: 2
                }
            }
        );
    });

    document.querySelectorAll('.feature-slide').forEach((slide, index) => {
        const featureNumber = slide.querySelector('.feature-number');
        const featureContent = slide.querySelector('.feature-content');

        if (featureNumber) {
            gsap.fromTo(
                featureNumber,
                { scale: 0.5, opacity: 0.3 },
                {
                    scale: 1,
                    opacity: 0.08,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: slide,
                        start: 'top 90%',
                        end: 'top 20%',
                        scrub: 2
                    }
                }
            );
        }

        if (featureContent) {
            const h3 = featureContent.querySelector('h3');
            const p = featureContent.querySelector('p');

            if (h3) {
                gsap.fromTo(
                    h3,
                    { y: 80, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: slide,
                            start: 'top 85%',
                            end: 'top 25%',
                            scrub: 2
                        }
                    }
                );
            }

            if (p) {
                gsap.fromTo(
                    p,
                    { y: 100, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: slide,
                            start: 'top 80%',
                            end: 'top 30%',
                            scrub: 2
                        }
                    }
                );
            }
        }
    });

    ScrollTrigger.create({
        trigger: '.stack-container',
        start: 'top 60%',
        onEnter: () => {
            anime({
                targets: '.stack-layer',
                opacity: [0, 1],
                translateY: [60, 0],
                delay: anime.stagger(300),
                duration: 1000,
                easing: 'easeOutQuad'
            });
        },
        once: true
    });

    ScrollTrigger.create({
        trigger: '#quickstart',
        start: 'top 60%',
        onEnter: () => {
            anime({
                targets: '.quickstart-step',
                opacity: [0, 1],
                translateY: [80, 0],
                delay: anime.stagger(300),
                duration: 800,
                easing: 'easeOutQuad'
            });
        },
        once: true
    });

    ScrollTrigger.create({
        trigger: '#credits',
        start: 'top 55%',
        onEnter: () => {
            anime({
                targets: '.credit-card',
                opacity: [0, 1],
                scale: [0.9, 1],
                translateY: [60, 0],
                delay: anime.stagger(200, { start: 150 }),
                duration: 900,
                easing: 'easeOutQuad'
            });
        },
        once: true
    });

    const footer = document.querySelector('.site-footer');
    if (footer) {
        gsap.fromTo(
            footer,
            { y: 100, opacity: 0.5 },
            {
                y: 0,
                opacity: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: footer,
                    start: 'top 95%',
                    end: 'top 40%',
                    scrub: 2
                }
            }
        );
    }

    const supportedReveal = (() => {
        let played = false;
        return () => {
            if (played) return;
            played = true;
            const supportedInner = document.querySelector('.supported-inner');
            if (supportedInner) {
                supportedInner.classList.add('visible');
            }
            const epi = document.querySelector('.epi');
            if (epi) {
                epi.classList.add('animate-i-dot');
            }
        };
    })();

    const starsEl = document.getElementById('github-stars');
    if (starsEl) {
        fetch('https://api.github.com/repos/EPI-Studios/Moud')
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
                if (data && typeof data.stargazers_count === 'number') {
                    const fmt = new Intl.NumberFormat('en', { notation: 'compact' });
                    starsEl.textContent = `${fmt.format(data.stargazers_count)}★`;
                    supportedReveal();
                }
            })
            .catch(() => {
                starsEl.style.display = 'none';
                supportedReveal();
            });
    } else {
        supportedReveal();
    }

    const refresh = () => {
        try {
            ScrollTrigger.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    window.addEventListener('load', refresh);
    window.addEventListener('pageshow', refresh);
});
