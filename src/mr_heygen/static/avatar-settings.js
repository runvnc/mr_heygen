import { LitElement, html, css } from './lit-core.min.js';
import { BaseEl } from './base.js';
//import './toggle-switch.js';

class AvatarSettings extends BaseEl {
  static properties = {
    settings: { type: Object },
    loading: { type: Boolean },
    persona: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      margin-top: 20px;
    }

    .settings-form {
      padding: 15px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.02);
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #f0f0f0;
    }

    .sub-group {
      margin-left: 20px;
      padding: 10px;
      border-left: 2px solid rgba(255, 255, 255, 0.1);
    }

    input[type="text"],
    input[type="number"],
    select {
      width: 100%;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #f0f0f0;
      font-size: 0.95rem;
    }

    input[type="range"] {
      width: 100%;
    }

    .range-value {
      display: inline-block;
      margin-left: 10px;
      color: #f0f0f0;
    }

    .btn {
      padding: 8px 16px;
      background: #2196F3;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .btn:hover {
      background: #1976D2;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.loading = false;
    this.observer = null;
    this.initializePersonaObserver();
  }

  connectedCallback() {
    super.connectedCallback();
    this.initializePersonaObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  initializePersonaObserver() {
    const personaEditor = document.querySelector('persona-editor');
    if (!personaEditor) {
      console.warn('Persona editor not found');
      return;
    }

    this.persona = personaEditor.name;
    if (!this.persona) {
      console.warn('Persona name not found');
      return;
    }

    this.loadSettings();

    // Set up the observer
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'name') {
          console.log('name changed');
          console.log({mutation})
          const personaEditor = document.querySelector('persona-editor');

          const newName = personaEditor.name;
          if (newName !== this.persona) {
            console.log(`Persona changed from ${this.persona} to ${newName}`);
            this.persona = newName;
            this.loadSettings();
          }
        }
      }
    });

    // Start observing
    this.observer.observe(personaEditor, {
      attributes: true,
      attributeFilter: ['name']
    });
  }

  async loadSettings() {
    if (!this.persona) return;
    
    try {
      const response = await fetch(`/mr_heygen/avatarsettings/${this.persona}`);
      const data = await response.json();
      console.log("Loaded settings for persona:", this.persona, data);
      this.settings = data;
    } catch (error) {
      console.error("Failed to load avatar settings:", error);
    }
  }

  handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    
    // Handle nested voice settings
    if (name.startsWith('voice.')) {
      const [_, property] = name.split('.');
      this.settings = {
        ...this.settings,
        voice: {
          ...this.settings.voice,
          [property]: type === 'number' ? Number(value) : value
        }
      };
      return;
    }

    // Handle elevenlabs settings
    if (name.startsWith('elevenlabs.')) {
      const [_, property] = name.split('.');
      this.settings = {
        ...this.settings,
        voice: {
          ...this.settings.voice,
          elevenlabs_settings: {
            ...this.settings.voice.elevenlabs_settings,
            [property]: type === 'number' ? Number(value) : 
                       type === 'checkbox' ? checked : value
          }
        }
      };
      return;
    }

    // Handle top-level settings
    const inputValue = type === 'checkbox' ? checked :
                      type === 'number' ? Number(value) : value;
    this.settings = { ...this.settings, [name]: inputValue };
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    try {
      this.loading = true;
      
      const response = await fetch(`/mr_heygen/avatarsettings/${this.settings.persona}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save avatar settings');
      }

      const savedSettings = await response.json();
      this.settings = savedSettings;

      this.dispatchEvent(new CustomEvent('settings-saved', {
        detail: savedSettings
      }));
    } catch (error) {
      this.dispatchEvent(new CustomEvent('error', {
        detail: `Error saving settings: ${error.message}`
      }));
    } finally {
      this.loading = false;
    }
  }

  _render() {
    return html`
      <form class="settings-form" @submit=${this.handleSubmit}>
          <h2>HeyGen Video Avatar</h2>

        <div class="form-group">
          <label>Avatar ID</label>
          <input type="text"
                  name="avatarName"
                  .value=${this.settings.avatarName}
                  @input=${this.handleInputChange}>
        </div>


        <div class="form-group">

          <label>Quality:</label>
          <select name="quality" 
                  .value=${this.settings.quality} 
                  @change=${this.handleInputChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="form-group">
          <label>
            Transparent Background:
            <toggle-switch 
              .checked=${this.settings.transparent}
              @toggle-change=${(e) => this.handleInputChange({ 
                target: { 
                  name: 'transparent', 
                  type: 'checkbox',
                  checked: e.detail.checked 
                } 
              })}>
            </toggle-switch>
          </label>
        </div>

        <div class="form-group">
          <label>Scale:</label>
          <input type="range" 
                 name="scale"
                 min="0.5"
                 max="2.0"
                 step="0.1"
                 .value=${this.settings.scale}
                 @input=${this.handleInputChange}>
          <span class="range-value">${this.settings.scale}</span>
        </div>

        <div class="form-group">
          <label>Voice Settings:</label>
          <div class="sub-group">

            <div class="form-group">
              <label>Voice ID</label>
              <input type="text"
                      name="voice.voiceId"
                      .value=${this.settings.voice.voiceId}
                      @input=${this.handleInputChange}>
            </div>

            <div class="form-group">
              <label>Rate:</label>
              <input type="range"
                     name="voice.rate"
                     min="0.5"
                     max="2.0"
                     step="0.05"
                     .value=${this.settings.voice.rate}
                     @input=${this.handleInputChange}>
              <span class="range-value">${this.settings.voice.rate}</span>
            </div>

            <div class="form-group">
              <label>Emotion:</label>
              <select name="voice.emotion"
                      .value=${this.settings.voice.emotion}
                      @change=${this.handleInputChange}>
                <option value="excited">Excited</option>
                <option value="serious">Serious</option>
                <option value="friendly">Friendly</option>
                <option value="soothing">Soothing</option>
                <option value="broadcaster">Broadcaster</option>
              </select>
            </div>

            <div class="form-group">
              <label>ElevenLabs Settings:</label>
              <div class="sub-group">
                <div class="form-group">
                  <label>Stability:</label>
                  <input type="range"
                         name="elevenlabs.stability"
                         min="0"
                         max="1"
                         step="0.01"
                         .value=${this.settings.voice.elevenlabs_settings.stability}
                         @input=${this.handleInputChange}>
                  <span class="range-value">
                    ${this.settings.voice.elevenlabs_settings.stability}
                  </span>
                </div>

                <div class="form-group">
                  <label>Similarity Boost:</label>
                  <input type="range"
                         name="elevenlabs.similarity_boost"
                         min="0"
                         max="1"
                         step="0.01"
                         .value=${this.settings.voice.elevenlabs_settings.similarity_boost}
                         @input=${this.handleInputChange}>
                  <span class="range-value">
                    ${this.settings.voice.elevenlabs_settings.similarity_boost}
                  </span>
                </div>

                <div class="form-group">
                  <label>Style:</label>
                  <input type="number"
                         name="elevenlabs.style"
                         min="0"
                         .value=${this.settings.voice.elevenlabs_settings.style}
                         @input=${this.handleInputChange}>
                </div>

                <div class="form-group">
                  <label>
                    Use Speaker Boost:
                    <toggle-switch 
                      .checked=${this.settings.voice.elevenlabs_settings.use_speaker_boost}
                      @toggle-change=${(e) => this.handleInputChange({ 
                        target: { 
                          name: 'elevenlabs.use_speaker_boost', 
                          type: 'checkbox',
                          checked: e.detail.checked 
                        } 
                      })}>
                    </toggle-switch>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button class="btn" type="submit" ?disabled=${this.loading}>
          ${this.loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    `;
  }
}

customElements.define('avatar-settings', AvatarSettings);
