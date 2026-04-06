// ==========================================
// カスタムJavaScript - 青木内科クリニック
// 
// 目次:
// 1. ヘッダー・フッター読み込み
// 2. ナビゲーション処理
// 3. スクロール関連
// 4. アニメーション
// 5. アクセシビリティ対応
// 6. ユーティリティ関数
// ==========================================

// ==========================================
// 1. ヘッダー・フッター読み込み
// ==========================================

// ヘッダーとフッターをインクルード
async function loadHTML(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
    }
}

// ページ読み込み時にヘッダーとフッターをロード
async function initializePage() {
    await loadHTML('header', 'parts/header.html');
    await loadHTML('footer', 'parts/footer.html');
    
    // ヘッダー・フッター読み込み後に初期化処理を実行
    initializeAfterLoad();
}

// ==========================================
// 2. ナビゲーション処理
// ==========================================

// ヘッダー・フッター読み込み後の初期化処理
function initializeAfterLoad() {
    // スクロールトップボタンの初期化
    initScrollToTop();
    
    // ナビゲーションメニューのアクティブ状態を設定
    setActiveNavLink();
    
    // モバイルメニューのイベント設定
    setupMobileMenu();
}

// ナビゲーションメニューのアクティブ状態を設定
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

// モバイルメニューのセットアップ
function setupMobileMenu() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    if (navbarToggler && navbarCollapse) {
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 992) {
                    navbarCollapse.classList.remove('show');
                }
            });
        });
    }
}

// ==========================================
// 3. スクロール関連
// ==========================================

// スクロールトップボタンの初期化
function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.style.display = 'block';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        });
        
        // スクロールトップボタンのクリックイベント
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // ==========================================
    // 4. アニメーション
    // ==========================================
    
    // フェードインアニメーション（prefers-reduced-motion対応）
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.medical-card, .access-card, .partnership-card').forEach(card => {
            observer.observe(card);
        });

        // スクロールアニメーション（セクションタイトル、カード等）
        const scrollObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    scrollObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

        document.querySelectorAll('.section-title, .facility-card, .quick-access-section .card, .vaccination-card-section .card, .local-seo-section .card').forEach(el => {
            el.classList.add('scroll-animate');
            scrollObserver.observe(el);
        });
    }
    
    // ==========================================
    // 5. アクセシビリティ対応
    // ==========================================
    
    // カルーセルの自動再生設定
    const carousel = document.querySelector('#heroCarousel');
    if (carousel) {
        const bsCarousel = new bootstrap.Carousel(carousel, {
            interval: 5000,
            ride: 'carousel'
        });
    }
    
    // 外部リンクに target="_blank" を自動追加
    const externalLinks = document.querySelectorAll('a[href^="http"]');
    externalLinks.forEach(link => {
        const currentDomain = window.location.hostname;
        const linkDomain = new URL(link.href).hostname;
        
        if (currentDomain !== linkDomain) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            
            // スクリーンリーダー用のテキスト追加
            if (!link.querySelector('.visually-hidden')) {
                const srText = document.createElement('span');
                srText.className = 'visually-hidden';
                srText.textContent = '（新しいタブで開きます）';
                link.appendChild(srText);
            }
        }
    });
    
    // ローディング完了時の処理
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
    
    // フォームバリデーション
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
    
    // 画像の遅延読み込み（Lazy Loading）
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    } else {
        // フォールバック: Intersection Observerを使用
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // ナビゲーションバーの背景変更（スクロール時）
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // ライトボックス機能の初期化
    initLightbox();
    
    console.log('青木内科クリニック - ウェブサイト読み込み完了');
}

// ==========================================
// 6. ユーティリティ関数
// ==========================================

// スムーススクロール関数
function smoothScrollTo(targetId) {
    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// モーダル表示関数
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// トースト通知表示関数
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="閉じる"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // トースト非表示後に要素を削除
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// ライトボックス機能
function initLightbox() {
    const galleryImages = document.querySelectorAll('.facility-gallery img, .gallery-item img');
    
    if (galleryImages.length === 0) return;
    
    // ライトボックスのHTML要素を作成
    if (!document.getElementById('lightbox-overlay')) {
        const lightboxHTML = `
            <div id="lightbox-overlay" class="lightbox-overlay" role="dialog" aria-modal="true" aria-label="画像拡大表示">
                <div class="lightbox-content">
                    <button class="lightbox-close" aria-label="閉じる">&times;</button>
                    <img src="" alt="">
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    }
    
    const overlay = document.getElementById('lightbox-overlay');
    const lightboxImg = overlay.querySelector('img');
    const closeBtn = overlay.querySelector('.lightbox-close');
    
    // 画像クリックでライトボックス表示
    galleryImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', img.alt + 'を拡大表示');
        
        const openLightbox = () => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            closeBtn.focus();
        };
        
        img.addEventListener('click', openLightbox);
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox();
            }
        });
    });
    
    // 閉じるボタンのクリックイベント
    const closeLightbox = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeLightbox();
        }
    });
    
    // Escキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeLightbox();
        }
    });
}

// ==========================================
// ページ読み込み時の初期化
// ==========================================

// OS/ブラウザのカラースキーム変更を検知してdata-bs-themeを自動切替
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    document.documentElement.setAttribute('data-bs-theme', e.matches ? 'dark' : 'light');
});

document.addEventListener('DOMContentLoaded', function() {
    // ヘッダーとフッターを読み込み
    initializePage();
});
