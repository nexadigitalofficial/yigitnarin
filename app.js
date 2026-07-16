document.addEventListener('DOMContentLoaded', () => {
    
    // --- GSAP ANIMATIONS ---
    gsap.registerPlugin(ScrollTrigger);

    // Hero Animations
    gsap.fromTo(".gsap-fade-up", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", stagger: 0.2 }
    );
    
    // Parallax Hero Image
    gsap.to("#heroImage", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
            trigger: "#home",
            start: "top top", 
            end: "bottom top",
            scrub: true
        }
    });

    // Fade in sections on scroll
    gsap.utils.toArray('.gsap-scroll-fade').forEach(section => {
        gsap.fromTo(section, 
            { y: 40, opacity: 0 },
            { 
                y: 0, opacity: 1, duration: 1, ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 85%",
                }
            }
        );
    });

    // --- NAVBAR EFFECT ---
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- FETCH LISTINGS ---
    // Now pointing to its OWN backend first
    const LOCAL_API_URL = '/api/listings'; 
    const FALLBACK_API_URL = 'https://gayrimenkulmuhendisin.onrender.com/api/listings';
    const gallery = document.getElementById('listingsGallery');

    async function loadListings() {
        try {
            // First try the standalone app.py API
            const response = await fetch(LOCAL_API_URL);
            const json = await response.json();
            
            if (json.success && json.data) {
                renderListings(json.data);
            } else {
                tryFallback();
            }
        } catch (error) {
            console.warn("Standalone API not responding, trying fallback...", error);
            tryFallback();
        }
    }

    async function tryFallback() {
        try {
            const response = await fetch(FALLBACK_API_URL);
            const json = await response.json();
            if (json.success && json.data) {
                renderListings(json.data);
            } else {
                showError("İlanlar bulunamadı.");
            }
        } catch(e) {
            showError("Sunucu bağlantı hatası. Lütfen daha sonra tekrar deneyin.");
        }
    }

    function renderListings(listings) {
        if (!listings || listings.length === 0) {
            showError("Henüz aktif ilan bulunmuyor.");
            return;
        }

        gallery.innerHTML = ''; 

        listings.forEach((listing, index) => {
            const price = listing.price || "Fiyat Sorunuz";
            const type = listing.type || "Gayrimenkul";
            const title = listing.title || "Özel Portföy";
            const loc = listing.loc || "Bilinmiyor";
            const img = listing.img || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600&auto=format&fit=crop";
            const targetUrl = listing.url || listing.link || "#";

            const card = document.createElement('div');
            card.className = 'list-card';
            // Add staggered fade-in class for newly created elements
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            card.innerHTML = `
                <div class="list-card-img" style="background-image: url('${img}')"></div>
                <div class="list-card-overlay"></div>
                <div class="list-card-content">
                    <span class="list-card-badge">${type}</span>
                    <h3 class="list-card-title">${title}</h3>
                    <div class="list-card-price">${price}</div>
                    
                    <div class="list-card-loc">
                        <i class="fas fa-map-marker-alt"></i> ${loc}
                    </div>
                    
                    <div class="list-card-hidden">
                        ${listing.rooms ? `<div class="spec-item"><i class="fas fa-door-open"></i> ${listing.rooms}</div>` : ''}
                        ${listing.area ? `<div class="spec-item"><i class="fas fa-vector-square"></i> ${listing.area}</div>` : ''}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                window.open(targetUrl, '_blank');
            });

            gallery.appendChild(card);

            // Animate card entrance
            gsap.to(card, {
                y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: index * 0.1
            });
        });

        // Initialize 3D Tilt Effect on all rendered cards
        VanillaTilt.init(document.querySelectorAll(".list-card"), {
            max: 8,              // Max tilt rotation (degrees)
            speed: 400,          // Speed of the enter/exit transition
            glare: true,         // Add glare effect
            "max-glare": 0.2,    // Max glare opacity
            scale: 1.02          // Slight scale up on hover
        });
    }

    function showError(msg) {
        gallery.innerHTML = `
            <div class="loading-state" style="border: none;">
                <i class="fas fa-exclamation-circle" style="font-size:30px; margin-bottom:15px; color:#8E9BB0;"></i>
                <p>${msg}</p>
            </div>
        `;
    }

    // Initialize fetching
    loadListings();
});
