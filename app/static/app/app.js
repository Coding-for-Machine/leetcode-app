// Router - Marshrutizator
class Router {
    constructor(routes) {
      this.routes = routes;
      this.init();
    }
    
    init() {
      // Popstate hodisasi (brauzer orqali navigatsiya)
      window.addEventListener('popstate', () => this.route());
      
      // DOM yuklanganidan so'ng birinchi marta route qilish
      document.addEventListener('DOMContentLoaded', () => {
        this.route();
        this.setupLinkInterception();
      });
    }
    
    // Barcha [data-link] elementlarini ishga tushirish
    setupLinkInterception() {
      document.addEventListener('click', (e) => {
        if (e.target.matches('[data-link]')) {
          e.preventDefault();
          const href = e.target.getAttribute('href');
          this.navigateTo(href);
        }
      });
    }
    
    // Navigatsiya funktsiyasi
    navigateTo(path) {
      history.pushState(null, null, path);
      this.route();
    }
    
    // Joriy manzilga mos sahifani yuklash
    async route() {
      // Joriy pathni olish
      const path = window.location.pathname;
      
      // Route'ni topish
      let matchedRoute = this.routes.find(route => route.path === path);
      
      // Agar topilmasa, 404 sahifasini ko'rsatish
      if (!matchedRoute) {
        matchedRoute = this.routes.find(route => route.path === '/404');
      }
      
      // Sahifa kontentini yuklash
      const view = await matchedRoute.component();
      
      // DOMga chiqarish
      document.getElementById('router-view').innerHTML = view;
      
      // Faol linkni belgilash
      this.setActiveLink();
      
      // Komponentga xos JSni ishga tushirish
      if (matchedRoute.init) {
        matchedRoute.init();
      }
    }
    
    // Faol linkni belgilash
    setActiveLink() {
      const links = document.querySelectorAll('[data-link]');
      const currentPath = window.location.pathname;
      
      links.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }
  

  // Mock API funktsiyalari
  const mockApiGetProducts = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Smartfon', price: 599 },
          { id: 2, name: 'Noutbuk', price: 1299 },
          { id: 3, name: 'Televizor', price: 899 }
        ]);
      }, 500);
    });
  };
  
  // Komponentga xos funktsiyalar
  const initHomePage = () => {
    let count = 0;
    const btn = document.getElementById('counter-btn');
    
    if (btn) {
      btn.addEventListener('click', () => {
        count++;
        btn.textContent = `Kliklar soni: ${count}`;
      });
    }
  };
  
  const initContactPage = () => {
    const form = document.getElementById('contact-form');
    const messageDiv = document.getElementById('form-message');
    
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // Simulyatsiya - odatda bu yerda APIga so'rov yuboriladi
        setTimeout(() => {
          messageDiv.textContent = `Rahmat, ${name}! Xabaringiz qabul qilindi.`;
          form.reset();
        }, 1000);
      });
    }
  };
  
  const initProductsPage = () => {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-product-id]')) {
        const productId = e.target.getAttribute('data-product-id');
        alert(`Mahsulot ID: ${productId} savatga qo'shildi!`);
      }
    });
  };
  
  // Router uchun konfiguratsiya
  const routes = [
    {
      path: '/',
      component: HomePage,
      init: initHomePage
    },
    {
      path: '/about',
      component: AboutPage
    },
    {
      path: '/contact',
      component: ContactPage,
      init: initContactPage
    },
    {
      path: '/products',
      component: ProductsPage,
      init: initProductsPage
    },
    {
      path: '/404',
      component: NotFoundPage
    }
  ];
  
  // Routerni ishga tushirish
  const router = new Router(routes);