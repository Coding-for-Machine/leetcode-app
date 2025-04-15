// router.js
import { ProblemsPage } from "./page/problem.js";
import { ContestPage } from "./page/contest.js";
import { TestPage } from "./page/test.js";
import { HomePage } from "./page/home.js";

class Router {
  constructor(routes) {
    this.routes = routes;
    this.loadInitialRoute();
    this.handleLinkClicks();
    window.addEventListener('popstate', () => this.handleLocation());
  }

  handleLinkClicks() {
    document.body.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const path = new URL(e.target.href).pathname;
        history.pushState({}, '', path);
        this.handleLocation();
      }
    });
  }

  async handleLocation() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const route = this.routes.find(r => r.path === path);

    const view = document.getElementById('router-view');
    if (route && route.component) {
      const content = await route.component();
      view.innerHTML = content;
    } else {
      view.innerHTML = `<h1 class="text-2xl font-bold text-red-500">404 - Sahifa topilmadi</h1>`;
    }
  }

  loadInitialRoute() {
    this.handleLocation();
  }
}

// Routerni ishga tushiramiz
const routes = [
  { path: '/', component: HomePage },
  { path: '/problems', component: ProblemsPage },
  { path: '/contest', component: ContestPage },
  { path: '/test', component: TestPage },
];

new Router(routes);
