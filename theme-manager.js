/**
 * 🎨 THEME MANAGER - FLIXLINGO V2.3
 * Gère le changement entre light mode et dark mode
 * Stocke la préférence utilisateur
 */

class ThemeManager {
    constructor() {
        console.log('🎨 [ThemeManager] Constructeur appelé');
        this.STORAGE_KEY = 'flixlingo-theme';
        this.currentTheme = 'dark'; // défaut
        this.init();
    }

    /**
     * Initialise le thème au chargement
     */
    async init() {
        console.log('🎨 [ThemeManager] Initialisation...');

        // Charger le thème sauvegardé
        await this.loadSavedTheme();

        // Appliquer le thème
        this.applyTheme(this.currentTheme);

        // Écouter les changements de thème depuis d'autres fenêtres
        this.listenToThemeChanges();

        console.log('✅ [ThemeManager] Initialisé avec le thème:', this.currentTheme);
    }

    /**
     * Charge le thème sauvegardé depuis le storage
     */
    async loadSavedTheme() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(this.STORAGE_KEY);
                if (result[this.STORAGE_KEY]) {
                    this.currentTheme = result[this.STORAGE_KEY];
                    console.log('🎨 Thème chargé depuis storage:', this.currentTheme);
                }
            } else {
                // Fallback localStorage pour tests
                const saved = localStorage.getItem(this.STORAGE_KEY);
                if (saved) {
                    this.currentTheme = saved;
                    console.log('🎨 Thème chargé depuis localStorage:', this.currentTheme);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement du thème:', error);
        }
    }

    /**
     * Sauvegarde le thème dans le storage
     */
    async saveTheme(theme) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ [this.STORAGE_KEY]: theme });
                console.log('💾 Thème sauvegardé dans chrome.storage:', theme);
            } else {
                // Fallback localStorage pour tests
                localStorage.setItem(this.STORAGE_KEY, theme);
                console.log('💾 Thème sauvegardé dans localStorage:', theme);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde du thème:', error);
        }
    }

    /**
     * Applique le thème à la page
     */
    applyTheme(theme) {
        console.log('🎨 Application du thème:', theme);
        const body = document.body;
        const html = document.documentElement;

        if (theme === 'light') {
            body.classList.add('light-mode');
            html.classList.add('light-mode');
            body.classList.remove('dark-mode');
            html.classList.remove('dark-mode');
            console.log('☀ Light mode appliqué');
        } else {
            body.classList.add('dark-mode');
            html.classList.add('dark-mode');
            body.classList.remove('light-mode');
            html.classList.remove('light-mode');
            console.log('🌙 Dark mode appliqué');
        }

        this.currentTheme = theme;

        // Émettre un événement personnalisé pour informer les autres composants
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
        console.log('📢 Événement themeChanged émis');
    }

    /**
     * Bascule entre light et dark mode
     */
    async toggleTheme() {
        const oldTheme = this.currentTheme;
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        console.log(`🔄 [ThemeManager] Toggle: ${oldTheme} → ${newTheme}`);

        this.applyTheme(newTheme);
        await this.saveTheme(newTheme);

        // Notifier toutes les fenêtres ouvertes de l'extension
        this.broadcastThemeChange(newTheme);

        console.log('✅ [ThemeManager] Toggle terminé');
    }

    /**
     * Définit un thème spécifique
     */
    async setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.error('Thème invalide:', theme);
            return;
        }

        this.applyTheme(theme);
        await this.saveTheme(theme);
        this.broadcastThemeChange(theme);
    }

    /**
     * Obtient le thème actuel
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Vérifie si le thème actuel est light
     */
    isLightMode() {
        return this.currentTheme === 'light';
    }

    /**
     * Vérifie si le thème actuel est dark
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    /**
     * Diffuse le changement de thème à toutes les fenêtres
     */
    broadcastThemeChange(theme) {
        try {
            chrome.runtime.sendMessage({
                type: 'THEME_CHANGED',
                theme: theme
            });
        } catch (error) {
            // Ignoré si pas dans un contexte d'extension
            console.log('Message de changement de thème non envoyé (contexte non-extension)');
        }
    }

    /**
     * Écoute les changements de thème depuis d'autres fenêtres
     */
    listenToThemeChanges() {
        // Écoute via chrome.storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
            try {
                chrome.storage.onChanged.addListener((changes, namespace) => {
                    if (namespace === 'local' && changes[this.STORAGE_KEY]) {
                        const newTheme = changes[this.STORAGE_KEY].newValue;
                        if (newTheme && newTheme !== this.currentTheme) {
                            console.log('🔄 Changement de thème détecté via storage:', newTheme);
                            this.applyTheme(newTheme);
                        }
                    }
                });
            } catch (error) {
                console.log('⚠️ chrome.storage.onChanged non disponible');
            }

            // Écoute via runtime.onMessage
            try {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    if (message.type === 'THEME_CHANGED' && message.theme) {
                        if (message.theme !== this.currentTheme) {
                            console.log('🔄 Changement de thème détecté via message:', message.theme);
                            this.applyTheme(message.theme);
                        }
                    }
                });
            } catch (error) {
                console.log('⚠️ chrome.runtime.onMessage non disponible');
            }
        }
    }

    /**
     * Crée et retourne un bouton de switch de thème
     */
    createThemeToggleButton() {
        const button = document.createElement('button');
        button.className = 'btn-icon btn-secondary theme-toggle';
        button.setAttribute('aria-label', 'Changer de thème');
        button.setAttribute('title', 'Changer de thème');

        const updateButtonIcon = () => {
            button.innerHTML = this.isLightMode() ? '☀' : '🌙';
        };

        updateButtonIcon();

        button.addEventListener('click', async () => {
            await this.toggleTheme();
            updateButtonIcon();
        });

        // Écouter les changements de thème pour mettre à jour l'icône
        window.addEventListener('themeChanged', () => {
            updateButtonIcon();
        });

        return button;
    }
}

// Instance globale
console.log('🎨 Création de l\'instance globale ThemeManager...');
window.themeManager = new ThemeManager();
console.log('✅ window.themeManager créé:', window.themeManager);

// Auto-initialisation du bouton de toggle dans la popup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeToggleButton);
} else {
    // DOM déjà chargé, initialiser immédiatement
    setTimeout(initializeThemeToggleButton, 0);
}

/**
 * Initialise le bouton de toggle de thème dans la popup
 */
function initializeThemeToggleButton() {
    const themeToggle = document.getElementById('themeToggle');

    if (!themeToggle) {
        // Le bouton n'existe pas dans cette page (normal pour flashcards, vocabulary, etc.)
        return;
    }

    console.log('🎨 [ThemeManager] Initialisation bouton toggle...');

    // Fonction pour mettre à jour l'icône
    function updateIcon() {
        const theme = window.themeManager.getTheme();
        // Si light mode → montrer soleil ☀
        // Si dark mode → montrer lune 🌙
        themeToggle.textContent = theme === 'light' ? '☀' : '🌙';
        console.log(`🎨 [ThemeManager] Icône mise à jour: ${theme === 'light' ? '☀ (light)' : '🌙 (dark)'}`);
    }

    // Mettre à jour l'icône initialement
    updateIcon();

    // Gérer le clic - VERSION DIRECTE
    themeToggle.addEventListener('click', async function(e) {
        console.log('');
        console.log('🖱️ ========================================');
        console.log('🖱️ CLIC SUR LE BOUTON DE THÈME !');
        console.log('🖱️ ========================================');
        console.log('');

        e.preventDefault();
        e.stopPropagation();

        try {
            console.log('🔄 Appel de toggleTheme...');
            await window.themeManager.toggleTheme();
            console.log('🔄 toggleTheme terminé');
            updateIcon();
            console.log('✅ Thème changé avec succès !');
        } catch (error) {
            console.error('❌ ERREUR lors du toggle:', error);
        }
    }, { capture: false, passive: false });

    // Écouter les changements de thème depuis d'autres fenêtres
    window.addEventListener('themeChanged', (e) => {
        console.log('📢 [ThemeManager] Événement themeChanged reçu:', e.detail);
        updateIcon();
    });

    console.log('✅ [ThemeManager] Bouton toggle initialisé et événement click attaché');
    console.log('✅ [ThemeManager] addEventListener attaché:', themeToggle);
}
