// ===== Authentication System =====
// Verwaltet Benutzer-Authentifizierung mit Supabase

class AuthManager {
  constructor() {
    this.user = null;
    this.profile = null;
    this.isAdmin = false;
  }

  // Initialisierung
  async init() {
    console.log('🔐 AuthManager initialisiert');
    await this.checkSession();
    this.setupEventListeners();
  }

  // Session prüfen
  async checkSession() {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (session) {
        this.user = session.user;
        await this.loadProfile();
        this.updateUI();
        console.log('✅ Benutzer eingeloggt:', this.user.email);
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('❌ Fehler beim Session-Check:', error);
    }
  }

  // Profil laden
  async loadProfile() {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single();

      if (error) throw error;

      this.profile = data;
      this.isAdmin = data.is_admin || false;
      console.log('👤 Profil geladen:', data.username);
    } catch (error) {
      console.error('❌ Fehler beim Profil-Laden:', error);
    }
  }

  // Registrierung
  async signup(email, password, username) {
    try {
      // 1. Benutzer erstellen
      const { data: { user }, error: signupError } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (signupError) throw signupError;

      // 2. Profil erstellen
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          email,
          username,
          full_name: username,
        });

      if (profileError) throw profileError;

      console.log('✅ Registrierung erfolgreich:', email);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Registrierungsfehler:', error.message);
      throw error;
    }
  }

  // Login
  async login(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      this.user = data.user;
      await this.loadProfile();
      this.updateUI();

      console.log('✅ Login erfolgreich:', email);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Login-Fehler:', error.message);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      await supabaseClient.auth.signOut();
      this.user = null;
      this.profile = null;
      this.isAdmin = false;
      this.updateUI();
      console.log('✅ Logout erfolgreich');
      window.location.href = '/index.html';
    } catch (error) {
      console.error('❌ Logout-Fehler:', error);
    }
  }

  // UI aktualisieren
  updateUI() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    if (this.user) {
      authContainer.innerHTML = `
        <div class="user-menu">
          <span class="username">👤 ${this.profile?.username || this.user.email}</span>
          <a href="/pages/dashboard.html" class="btn btn-secondary btn-small">Dashboard</a>
          ${this.isAdmin ? '<a href="/pages/admin.html" class="btn btn-danger btn-small">Admin</a>' : ''}
          <button onclick="authManager.logout()" class="btn btn-outline btn-small">Logout</button>
        </div>
      `;
    } else {
      authContainer.innerHTML = `
        <div class="user-menu">
          <a href="/pages/login.html" class="btn btn-secondary btn-small">Login</a>
          <a href="/pages/register.html" class="btn btn-primary btn-small">Registrieren</a>
        </div>
      `;
    }
  }

  // Event Listener
  setupEventListeners() {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth-Status geändert:', event);
      if (event === 'SIGNED_IN') {
        this.user = session.user;
        this.loadProfile();
        this.updateUI();
      } else if (event === 'SIGNED_OUT') {
        this.user = null;
        this.profile = null;
        this.updateUI();
      }
    });
  }

  // Passwort zurücksetzen
  async resetPassword(email) {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/pages/reset-password.html`,
      });

      if (error) throw error;

      console.log('✅ Passwort-Reset E-Mail versendet');
      return { success: true };
    } catch (error) {
      console.error('❌ Passwort-Reset-Fehler:', error.message);
      throw error;
    }
  }

  // Geschützte Route prüfen
  requireAuth() {
    if (!this.user) {
      window.location.href = '/pages/login.html';
      return false;
    }
    return true;
  }

  // Admin-Rechte prüfen
  requireAdmin() {
    if (!this.isAdmin) {
      alert('⛔ Admin-Rechte erforderlich!');
      window.location.href = '/index.html';
      return false;
    }
    return true;
  }
}

// Globale Instanz
const authManager = new AuthManager();

// Beim Laden der Seite initialisieren
window.addEventListener('DOMContentLoaded', () => {
  authManager.init();
});
