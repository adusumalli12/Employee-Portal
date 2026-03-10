export type RouteHandler = () => HTMLElement;

export class Router {
    private routes: Map<string, RouteHandler> = new Map();
    private root: HTMLElement;

    constructor(rootId: string) {
        this.root = document.getElementById(rootId) || document.body;
        window.addEventListener('hashchange', () => this.handleRouting());
    }

    public addRoute(path: string, handler: RouteHandler): void {
        this.routes.set(path, handler);
    }

    public start(): void {
        if (!window.location.hash) {
            window.location.hash = '#/login';
        }
        this.handleRouting();
    }

    private handleRouting(): void {
        const fullHash = window.location.hash || '#/login';
        const path = fullHash.split('?')[0]; // Extract path without query params

        const handler = this.routes.get(path);

        if (handler) {
            this.root.innerHTML = '';
            this.root.appendChild(handler());
        } else {
            console.error(`Route ${path} not found`);
            window.location.hash = '#/login';
        }
    }

    public static navigate(path: string): void {
        window.location.hash = path;
    }
}
