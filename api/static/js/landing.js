document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);


    const turbulence = document.querySelector('#handdrawnFilter feTurbulence');
    if (turbulence) {
        let frameCount = 0;
        gsap.ticker.add(() => {
            frameCount++;
            if (frameCount % 50 === 0) {
                turbulence.setAttribute('seed', Math.round(Math.random() * 100));
            }
        });
    }
    const cards = document.querySelectorAll('.spotlight-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
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
                scrub: true
            }
        });
    }
    const playWhatIsIn = () => {
        const moudEl = document.querySelector('.what-title .moud');
        const trembleElements = document.querySelectorAll('.what-title .what-is, .what-title .question');

        anime.set(moudEl, { opacity: 0, scale: 2.5 });
        anime.set(trembleElements, { opacity: 0, translateY: 10 });

        const tl = anime.timeline({ easing: 'easeOutExpo' });

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
                { value: () => anime.random(-6, 6), duration: 60 },
                { value: () => anime.random(-6, 6), duration: 60 },
                { value: 0, duration: 400 }
            ],
            rotate: [
                { value: () => anime.random(-4, 4), duration: 60 },
                { value: () => anime.random(-4, 4), duration: 60 },
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

    const enableFeatureScroll = () => {
        const scrollAmount = track.scrollWidth - window.innerWidth;

        featureScroll = gsap.to(track, {
            x: -scrollAmount,
            ease: 'none',
            scrollTrigger: {
                trigger: '#features',
                start: 'top top',
                end: () => `+=${scrollAmount + window.innerHeight}`,
                scrub: true,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });
    };

    if (window.innerWidth >= 1024 && track) {
        enableFeatureScroll();
    }

    window.addEventListener('resize', () => {
        ScrollTrigger.refresh();
    });
    const parallaxSections = gsap.utils.toArray('.parallax-section');
    parallaxSections.forEach((section) => {
        gsap.to(section, {
            yPercent: -3,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true 
            }
        });
    });

    const parallaxElements = gsap.utils.toArray('[data-parallax-depth]');
    parallaxElements.forEach((el) => {
        const depth = parseFloat(el.dataset.parallaxDepth) || 8;
        const adjustedDepth = depth * 0.5; 
        
        gsap.fromTo(
            el,
            { y: adjustedDepth * 4, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    end: 'top 20%',
                    scrub: true
                }
            }
        );
    });
    document.querySelectorAll('.feature-slide').forEach((slide) => {
        const featureNumber = slide.querySelector('.feature-number');
        const featureContent = slide.querySelector('.feature-content');

        if (featureNumber) {
            gsap.fromTo(featureNumber,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 0.1, ease: 'power2.out', scrollTrigger: { trigger: slide, start: 'left center', containerAnimation: featureScroll, scrub: true }}
            );
        }
    });
    const revealSection = (selector) => {
        ScrollTrigger.create({
            trigger: selector,
            start: 'top 70%',
            onEnter: () => {
                anime({
                    targets: `${selector} > div, ${selector} .stack-layer, ${selector} .quickstart-step, ${selector} .credit-card`,
                    opacity: [0, 1],
                    translateY: [40, 0],
                    delay: anime.stagger(100),
                    duration: 800,
                    easing: 'easeOutQuad'
                });
            },
            once: true
        });
    };

    revealSection('.stack-container');
    revealSection('.quickstart-steps');
    revealSection('.credits-grid');
    const footer = document.querySelector('.site-footer');
    if (footer) {
        gsap.fromTo(footer,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, scrollTrigger: { trigger: footer, start: 'top 95%' }}
        );
    }
    const starsEl = document.getElementById('github-stars');
    const epi = document.querySelector('.epi');
    const supportedInner = document.querySelector('.supported-inner');

    if (supportedInner) {
         ScrollTrigger.create({
            trigger: '#supported',
            start: 'top 80%',
            onEnter: () => {
                supportedInner.classList.add('visible');
                if (epi) epi.classList.add('animate-i-dot');
            },
            once: true
        });
    }

    if (starsEl) {
        fetch('https://api.github.com/repos/EPI-Studios/Moud')
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
                if (data?.stargazers_count) {
                    const fmt = new Intl.NumberFormat('en', { notation: 'compact' });
                    starsEl.textContent = `${fmt.format(data.stargazers_count)}★`;
                }
            })
            .catch(() => starsEl.style.display = 'none');
    }

    window.addEventListener('load', () => ScrollTrigger.refresh());

    const initTerminal = () => {
        const termBody = document.querySelector('#terminal-content');
        const typeWriterSpan = document.querySelector('#typewriter');
        if (!termBody || !typeWriterSpan) return;

        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        
        const addLine = (html, className = '') => {
            const cursorLine = termBody.querySelector('.cursor-line');
            if(cursorLine) cursorLine.remove();
            const div = document.createElement('div');
            div.className = `term-line ${className}`;
            div.innerHTML = html;
            termBody.appendChild(div);
            const newCursor = document.createElement('div');
            newCursor.className = 'cursor-line';
            newCursor.innerHTML = `<span class="prompt">user@moud:~$</span><span id="typewriter"></span><span class="cursor">█</span>`;
            termBody.appendChild(newCursor);
            termBody.scrollTop = termBody.scrollHeight;
        };

        const typeCommand = async (cmd) => {
            const target = document.querySelector('#typewriter');
            if(!target) return;
            
            target.textContent = '';
            for (let i = 0; i < cmd.length; i++) {
                target.textContent += cmd[i];
                await wait(Math.random() * 50 + 30);
            }
            await wait(300);
            addLine(`<span class="prompt">user@moud:~$</span> ${cmd}`, 'cmd-echo');
        };

        const runSequence = async () => {
            termBody.innerHTML = `<div class="cursor-line"><span class="prompt">user@moud:~$</span><span id="typewriter"></span><span class="cursor">█</span></div>`;
            await wait(1000);
            await typeCommand('npm install -g @epi-studio/moud-cli@latest');
            addLine('added 136 packages in 12s', 'success');
            addLine('41 packages are looking for funding');
            addLine('  run `npm fund` for details ');
            await wait(800);
            await typeCommand('moud create');
            addLine('What is the name of your game?', 'dim');
            await wait(400);
            await typeCommand('minecraft');
            addLine('Choose a project template:');
            addLine('TypeScript (Default)');
            await typeCommand('Typescript');
            addLine('Creating project directory...', 'success');
            addLine('Creating package.json...', 'info');
            addLine('Creating main server file..');
            addLine('Creating client script...');
            addLine('Project minecraft created successfully!')
            await wait(800);
            await typeCommand('cd minecraft && moud dev');
            addLine('Starting Moud Engine...', 'dim');
            await wait(500);
            addLine('22:20:25.145 [main] INFO  MOUD ENGINE -- Server started on port 25565', 'dim');

            await wait(5000);
            runSequence();
        };

        ScrollTrigger.create({
            trigger: '#quickstart',
            start: 'top 60%',
            onEnter: () => runSequence(),
            once: true
        });
    };

    initTerminal();
});