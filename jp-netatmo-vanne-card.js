class JPNetatmoVanne extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Vous devez définir l'entité climate");

    let defaultImagesPath = "/local/images/netatmo/";
    try {
      const scriptUrl = new URL(import.meta.url);
      const basePath = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
      defaultImagesPath = `${basePath}/images/`;
    } catch (e) {}

    this.config = {
      images_path: config.images_path || defaultImagesPath,
      room_name: "Chambre",
      hvac_action_sensor: "", // Optionnel : ex sensor.netatmo_hvac_action_chambre
      preset_mode_sensor: "", // Optionnel : ex sensor.netatmo_preset_mode_chambre
      target_temp_sensor: "", // Optionnel : ex sensor.netatmo_temperature_consigne_chambre
      battery_sensor: "",     // Optionnel : ex sensor.thermostat_chambre_battery_percent
      max_width: "100%",
      ...config
    };
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this.config.entity];
    if (!stateObj) return;

    const hvacAction = hass.states[this.config.hvac_action_sensor];
    const presetMode = hass.states[this.config.preset_mode_sensor];
    const targetTemp = hass.states[this.config.target_temp_sensor];
    const battery = hass.states[this.config.battery_sensor];

    if (!this.content) {
      this.shadowRoot.innerHTML = `
        <style>
          ha-card {
            background: none;
            border: none;
            box-shadow: none;
            padding: 0;
            overflow: hidden;
            max-width: ${this.config.max_width};
            margin: 0 auto;
          }
          .base-container {
            position: relative;
            width: 100%;
            padding-bottom: 72.37%; /* Ratio 362x262 */
            background-image: url("${this.config.images_path}netatmo_vanne362x262.png");
            background-size: cover;
            background-repeat: no-repeat;
            user-select: none;
          }
          .element {
            position: absolute;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .text-element {
            cursor: default;
            white-space: nowrap;
          }
          img {
            width: 100%;
            height: auto;
          }
          .disabled {
            pointer-events: none;
          }
          .hidden {
            display: none !important;
          }
        </style>
        <ha-card>
          <div class="base-container" id="container">
            <!-- Nom de la pièce -->
            <div class="element text-element" style="top: 25%; left: 66%; font-size: 1.2em; color: rgb(68, 68, 68); font-weight: 400;">
              ${this.config.room_name}
            </div>

            <!-- Température Actuelle -->
            <div class="element text-element" id="current-temp" style="top: 50%; left: 25.5%; font-size: 1.2em; color: black; font-weight: 600;">
              ${stateObj.attributes.current_temperature}°
            </div>

            <!-- Température de Consigne -->
            <div class="element text-element" id="target-temp" style="top: 28%; left: 25%; font-size: 0.75em; color: white; font-weight: 600;">
              ${targetTemp ? targetTemp.state : (stateObj.attributes.temperature !== undefined ? stateObj.attributes.temperature : '--')}°
            </div>

            <!-- Témoin Chauffe -->
            <div class="element disabled" id="heating-witness" style="top: 58%; left: 25.5%; width: 7%;">
              <img src="${this.config.images_path}netatmo_chauffe.png">
            </div>

            <!-- Mode de fonctionnement (Interactif) -->
            <div class="element" id="preset-icon" style="top: 38%; left: 40%; width: 11%;">
              <img id="preset-img">
            </div>

            <!-- Boutons Consigne -->
            <div class="element" id="btn-up" style="top: 52.6%; left: 76.5%; width: 6%;">
              <img src="${this.config.images_path}netatmo_up.png">
            </div>
            <div class="element" id="btn-down" style="top: 52.6%; left: 56.5%; width: 6%;">
              <img src="${this.config.images_path}netatmo_down.png">
            </div>

            <!-- Batterie -->
            <div class="element text-element" id="battery-level" style="top: 74%; left: 8.3%; font-size: 0.7em; color: rgb(68,68,68); font-weight: 400;">
              ${battery ? battery.state : '--'}%
            </div>
            <div class="element" id="btn-battery" style="top: 86%; left: 8%;">
              <ha-icon id="battery-icon" icon="${battery ? battery.attributes.icon || 'mdi:battery' : 'mdi:battery'}" style="--mdc-icon-size: 20px; color: rgb(68,68,68);"></ha-icon>
            </div>
          </div>
        </ha-card>
      `;
      this.content = this.shadowRoot.getElementById("container");
      
      // Actions
      this.shadowRoot.getElementById("btn-up").onclick = () => this._callScriptAdjust(0.5);
      this.shadowRoot.getElementById("btn-down").onclick = () => this._callScriptAdjust(-0.5);
      this.shadowRoot.getElementById("btn-battery").onclick = () => this._fireEvent("hass-more-info", { entityId: this.config.battery_sensor });
      this.shadowRoot.getElementById("preset-icon").onclick = () => this._callScriptMode("schedule");
    }

    // Mises à jour dynamiques
    const currentTempEl = this.shadowRoot.getElementById("current-temp");
    if (currentTempEl && stateObj.attributes.current_temperature !== undefined) {
      currentTempEl.textContent = `${stateObj.attributes.current_temperature}°`;
    }

    const targetTempEl = this.shadowRoot.getElementById("target-temp");
    if (targetTempEl) {
      const val = targetTemp ? targetTemp.state : (stateObj.attributes.temperature !== undefined ? stateObj.attributes.temperature : '--');
      targetTempEl.textContent = `${val}°`;
    }

    const batteryLevelEl = this.shadowRoot.getElementById("battery-level");
    if (batteryLevelEl && battery) {
      batteryLevelEl.textContent = `${battery.state}%`;
    }

    const batteryIconEl = this.shadowRoot.getElementById("battery-icon");
    if (batteryIconEl && battery) {
      batteryIconEl.setAttribute("icon", battery.attributes.icon || "mdi:battery");
    }

    const witness = this.shadowRoot.getElementById("heating-witness");
    witness.style.opacity = (hvacAction && (hvacAction.state === "heating" || hvacAction.state === "on")) ? "1" : "0";

    const presetImg = this.shadowRoot.getElementById("preset-img");
    if (presetMode) {
      const pMode = presetMode.state.toLowerCase();
      const modeMap = { 
        "manual": "netatmo_manual.png", 
        "schedule": "netatmo_auto.png", 
        "away": "netatmo_absent.png", 
        "frost guard": "netatmo_hors_gel.png",
        "frost_guard": "netatmo_hors_gel.png"
      };
      presetImg.src = `${this.config.images_path}${modeMap[pMode] || "netatmo_manual.png"}`;
      this.shadowRoot.getElementById("preset-icon").classList.remove("hidden");
    } else {
      this.shadowRoot.getElementById("preset-icon").classList.add("hidden");
    }
  }

  _callScriptAdjust(offset) {
    const targetTemp = this.config.target_temp_sensor ? this._hass.states[this.config.target_temp_sensor] : null;
    const current = targetTemp ? parseFloat(targetTemp.state) : parseFloat(this._hass.states[this.config.entity]?.attributes?.temperature);
    if (!isNaN(current)) {
      const nextTemp = Math.round((current + offset) * 10) / 10;
      const targetTempEl = this.shadowRoot.getElementById("target-temp");
      if (targetTempEl) targetTempEl.textContent = `${nextTemp}°`;
    }

    this._hass.callService("script", "netatmo_adjust_temp", {
      room: this.config.room_name.toLowerCase(),
      climate_entity: this.config.entity,
      sensor_entity: this.config.target_temp_sensor,
      offset: offset
    });
  }

  _callScriptMode(mode) {
    this._hass.callService("script", "netatmo_modes_unifie", { mode: mode });
  }

  _fireEvent(type, detail) {
    const event = new Event(type, { bubbles: true, composed: true });
    event.detail = detail;
    this.dispatchEvent(event);
  }
}

customElements.define("jp-netatmo-vanne-card", JPNetatmoVanne);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "jp-netatmo-vanne-card",
  name: "JP Netatmo Vanne Card",
  description: "Carte Vanne Netatmo Premium."
});
