class JPNetatmoCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Vous devez dÃ©finir l'entitÃ© climate");

    const imagesPath = (config.images_path || "/local/images/netatmo/").replace(/\/?$/, '/');

    this.config = {
      images_path: imagesPath,
      room_name: "Salon",
      hvac_action_sensor: "sensor.netatmo_hvac_action",
      preset_mode_sensor: "sensor.netatmo_preset_mode",
      target_temp_sensor: "sensor.netatmo_temperature_consigne",
      battery_sensor: "sensor.thermostat_salon_battery_percent",
      schedule_select: "select.home",
      max_width: "100%",
      show_modes: true,
      show_toggle: true,
      show_schedule: true,
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
    const schedule = hass.states[this.config.schedule_select];

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
            background-image: url("${this.config.images_path}netatmo_base362x262.png");
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
            <!-- Nom de la piÃ¨ce -->
            <div class="element text-element" style="top: 25%; left: 66%; font-size: 1.2em; color: rgb(68, 68, 68); font-weight: 400;">
              ${this.config.room_name}
            </div>

            <!-- TempÃ©rature Actuelle -->
            <div class="element text-element" id="current-temp" style="top: 50%; left: 25.5%; font-size: 1.2em; color: black; font-weight: 600;">
              ${stateObj.attributes.current_temperature}Â°
            </div>

            <!-- TempÃ©rature de Consigne -->
            <div class="element text-element" id="target-temp" style="top: 28%; left: 25%; font-size: 0.75em; color: white; font-weight: 600;">
              ${targetTemp ? targetTemp.state : (stateObj.attributes.temperature !== undefined ? stateObj.attributes.temperature : '--')}Â°
            </div>

            <!-- TÃ©moin Chauffe -->
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
            <div class="element text-element" id="battery-level" style="top: 74%; left: 8.3%; font-size: 0.7em; color: rgb(68,68,68); font-weight: 600;">
              ${battery ? battery.state : '--'}%
            </div>
            <div class="element" id="btn-battery" style="top: 86%; left: 8%;">
              <ha-icon id="battery-icon" icon="${battery ? battery.attributes.icon || 'mdi:battery' : 'mdi:battery'}" style="--mdc-icon-size: 20px; color: grey;"></ha-icon>
            </div>

            <!-- Planning -->
            <div class="element text-element ${this.config.show_schedule ? '' : 'hidden'}" id="btn-schedule-select" style="top: 85%; left: 27%; font-size: 0.8em; color: rgb(68,68,68); cursor: pointer;">
              ${schedule ? schedule.state : '--'}
            </div>

            <!-- On / Off -->
            <div class="element ${this.config.show_toggle ? '' : 'hidden'}" id="btn-toggle" style="top: 10%; left: 8%; width: 7%;">
              <img id="toggle-img">
            </div>

            <!-- Barre de fond modes -->
            <div class="element disabled ${this.config.show_modes ? '' : 'hidden'}" style="top: 83.2%; left: 71%; width: 58%;">
              <img src="${this.config.images_path}netatmo_fond.png">
            </div>

            <!-- Boutons de modes -->
            <div class="element ${this.config.show_modes ? '' : 'hidden'}" id="btn-away" style="top: 83%; left: 53%; width: 12%;">
              <img src="${this.config.images_path}netatmo_absent.png">
            </div>
            <div class="element ${this.config.show_modes ? '' : 'hidden'}" id="btn-schedule" style="top: 83.2%; left: 67%; width: 10%;">
              <img src="${this.config.images_path}netatmo_auto.png">
            </div>
            <div class="element ${this.config.show_modes ? '' : 'hidden'}" id="btn-frost" style="top: 83.2%; left: 79.5%; width: 14.5%;">
              <img src="${this.config.images_path}netatmo_hors_gel.png">
            </div>
          </div>
        </ha-card>
      `;
      this.content = this.shadowRoot.getElementById("container");
      
      // Actions
      this.shadowRoot.getElementById("btn-up").onclick = () => this._callScriptAdjust(0.5);
      this.shadowRoot.getElementById("btn-down").onclick = () => this._callScriptAdjust(-0.5);
      this.shadowRoot.getElementById("btn-toggle").onclick = () => this._callScriptMode("toggle");
      this.shadowRoot.getElementById("btn-away").onclick = () => this._callScriptMode("away");
      this.shadowRoot.getElementById("btn-schedule").onclick = () => this._callScriptMode("schedule");
      this.shadowRoot.getElementById("btn-frost").onclick = () => this._callScriptMode("frost_guard");
      this.shadowRoot.getElementById("btn-battery").onclick = () => this._fireEvent("hass-more-info", { entityId: this.config.battery_sensor });
      this.shadowRoot.getElementById("btn-schedule-select").onclick = () => this._fireEvent("hass-more-info", { entityId: this.config.schedule_select });
      this.shadowRoot.getElementById("preset-icon").onclick = () => this._callScriptMode("schedule");
    }

    // Mises Ã  jour dynamiques
    const currentTempEl = this.shadowRoot.getElementById("current-temp");
    if (currentTempEl && stateObj.attributes.current_temperature !== undefined) {
      currentTempEl.textContent = `${stateObj.attributes.current_temperature}Â°`;
    }

    const targetTempEl = this.shadowRoot.getElementById("target-temp");
    if (targetTempEl) {
      const val = targetTemp ? targetTemp.state : (stateObj.attributes.temperature !== undefined ? stateObj.attributes.temperature : '--');
      targetTempEl.textContent = `${val}Â°`;
    }

    const batteryLevelEl = this.shadowRoot.getElementById("battery-level");
    if (batteryLevelEl && battery) {
      batteryLevelEl.textContent = `${battery.state}%`;
    }

    const batteryIconEl = this.shadowRoot.getElementById("battery-icon");
    if (batteryIconEl && battery) {
      batteryIconEl.setAttribute("icon", battery.attributes.icon || "mdi:battery");
    }

    const scheduleSelectEl = this.shadowRoot.getElementById("btn-schedule-select");
    if (scheduleSelectEl && schedule) {
      scheduleSelectEl.textContent = schedule.state;
    }

    const witness = this.shadowRoot.getElementById("heating-witness");
    witness.style.opacity = (hvacAction && hvacAction.state === "heating") ? "1" : "0";

    const presetImg = this.shadowRoot.getElementById("preset-img");
    const pMode = presetMode ? presetMode.state.toLowerCase() : "manual";
    const modeMap = { 
      "manual": "netatmo_manual.png", 
      "schedule": "netatmo_auto.png", 
      "away": "netatmo_absent.png", 
      "frost guard": "netatmo_hors_gel.png",
      "frost_guard": "netatmo_hors_gel.png"
    };
    presetImg.src = `${this.config.images_path}${modeMap[pMode] || "netatmo_manual.png"}`;

    const toggleImg = this.shadowRoot.getElementById("toggle-img");
    toggleImg.src = `${this.config.images_path}${stateObj.state === "off" ? "off.png" : "on.png"}`;
  }

  _callScriptAdjust(offset) {
    const targetTemp = this.config.target_temp_sensor ? this._hass.states[this.config.target_temp_sensor] : null;
    const current = targetTemp ? parseFloat(targetTemp.state) : parseFloat(this._hass.states[this.config.entity]?.attributes?.temperature);
    if (!isNaN(current)) {
      const nextTemp = Math.round((current + offset) * 10) / 10;
      const targetTempEl = this.shadowRoot.getElementById("target-temp");
      if (targetTempEl) targetTempEl.textContent = `${nextTemp}Â°`;
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

customElements.define("jp-netatmo-card", JPNetatmoCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "jp-netatmo-card",
  name: "JP Netatmo Card",
  description: "Carte Thermostat Netatmo Premium."
});

class JPNetatmoVanne extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Vous devez dÃ©finir l'entitÃ© climate");

    const imagesPath = (config.images_path || "/local/images/netatmo/").replace(/\/?$/, '/');

    this.config = {
      images_path: imagesPath,
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
            <!-- Nom de la piÃ¨ce -->
            <div class="element text-element" style="top: 25%; left: 66%; font-size: 1.2em; color: rgb(68, 68, 68); font-weight: 400;">
              ${this.config.room_name}
            </div>

            <!-- TempÃ©rature Actuelle -->
            <div class="element text-element" id="current-temp" style="top: 50%; left: 25.5%; font-size: 1.2em; color: black; font-weight: 600;">
              ${stateObj.attributes.current_temperature}Â°
            </div>

            <!-- TempÃ©rature de Consigne -->
            <div class="element text-element" id="target-temp" style="top: 28%; left: 25%; font-size: 0.75em; color: white; font-weight: 600;">
              ${targetTemp ? targetTemp.state : (stateObj.attributes.temperature !== undefined ? stateObj.attributes.temperature : '--')}Â°
            </div>

            <!-- TÃ©moin Chauffe -->
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

    // Mises Ã  jour dynamiques
    const currentTempEl = this.shadowRoot.getElementById("current-temp");
    if (currentTempEl && stateObj.attributes.current_temperature !== undefined) {
      currentTempEl.textContent = `${stateObj.attributes.current_temperature}Â°`;
    }

    const targetTempEl = this.shadowRoot.getElementById("target-temp");
    if (targetTempEl) {
      const val = targetTemp ? targetTemp.state : (stateObj.attributes.temperature !== undefined ? stateObj.attributes.temperature : '--');
      targetTempEl.textContent = `${val}Â°`;
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
      if (targetTempEl) targetTempEl.textContent = `${nextTemp}Â°`;
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

class JPNetatmoVerticalCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Vous devez dÃ©finir l'entitÃ© climate");

    const imagesPath = (config.images_path || "/local/images/netatmo/").replace(/\/?$/, '/');

    this.config = {
      images_path: imagesPath,
      room_name: "Salon",
      hvac_action_sensor: "sensor.netatmo_hvac_action",
      preset_mode_sensor: "sensor.netatmo_preset_mode",
      target_temp_sensor: "sensor.netatmo_temperature_consigne",
      battery_sensor: "sensor.thermostat_salon_battery_percent",
      schedule_select: "select.home",
      max_width: "100%",
      show_modes: true,
      show_toggle: true,
      show_schedule: true,
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
    const schedule = hass.states[this.config.schedule_select];

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
            padding-bottom: 72.37%; /* Ratio 529x382 ou 362x262 */
            background-image: url("${this.config.images_path}netatmo_base529x382.png");
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
            <!-- Nom de la piÃ¨ce (Au dessus des valeurs) -->
            <div class="element text-element" style="top: 15%; left: 25.5%; font-size: 1.1em; color: white; font-weight: 400; text-shadow: 0px 1px 2px rgba(0,0,0,0.5);">
              ${this.config.room_name}
            </div>

            <!-- TempÃ©rature de Consigne -->
            <div class="element text-element" id="target-temp" style="top: 32%; left: 25.5%; font-size: 0.75em; color: white; font-weight: 600;">
              ${targetTemp ? targetTemp.state : (stateObj.attributes.temperature !== undefined ? stateObj.attributes.temperature : '--')}Â°
            </div>

            <!-- TempÃ©rature Actuelle -->
            <div class="element text-element" id="current-temp" style="top: 52%; left: 25.5%; font-size: 1.2em; color: black; font-weight: 600;">
              ${stateObj.attributes.current_temperature}Â°
            </div>

            <!-- TÃ©moin Chauffe -->
            <div class="element disabled" id="heating-witness" style="top: 60%; left: 25.5%; width: 7%;">
              <img src="${this.config.images_path}netatmo_chauffe.png">
            </div>

            <!-- Mode de fonctionnement (Interactif) -->
            <div class="element" id="preset-icon" style="top: 38%; left: 45%; width: 11%;">
              <img id="preset-img">
            </div>

            <!-- Boutons Consigne (Vertical) -->
            <div class="element" id="btn-up" style="top: 38%; left: 71.5%; width: 7%;">
              <img src="${this.config.images_path}netatmo_up.png">
            </div>
            <div class="element" id="btn-down" style="top: 62%; left: 71.5%; width: 7%;">
              <img src="${this.config.images_path}netatmo_down.png">
            </div>

            <!-- Batterie -->
            <div class="element text-element" id="battery-level" style="top: 74%; left: 8.3%; font-size: 0.7em; color: rgb(68,68,68); font-weight: 600;">
              ${battery ? battery.state : '--'}%
            </div>
            <div class="element" id="btn-battery" style="top: 86%; left: 8%;">
              <ha-icon id="battery-icon" icon="${battery ? battery.attributes.icon || 'mdi:battery' : 'mdi:battery'}" style="--mdc-icon-size: 20px; color: grey;"></ha-icon>
            </div>

            <!-- Planning -->
            <div class="element text-element ${this.config.show_schedule ? '' : 'hidden'}" id="btn-schedule-select" style="top: 85%; left: 27%; font-size: 0.8em; color: rgb(68,68,68); cursor: pointer;">
              ${schedule ? schedule.state : '--'}
            </div>

            <!-- On / Off -->
            <div class="element ${this.config.show_toggle ? '' : 'hidden'}" id="btn-toggle" style="top: 10%; left: 8%; width: 7%;">
              <img id="toggle-img">
            </div>

            <!-- Barre de fond modes -->
            <div class="element disabled ${this.config.show_modes ? '' : 'hidden'}" style="top: 83.2%; left: 71%; width: 58%;">
              <img src="${this.config.images_path}netatmo_fond.png">
            </div>

            <!-- Boutons de modes -->
            <div class="element ${this.config.show_modes ? '' : 'hidden'}" id="btn-away" style="top: 83%; left: 53%; width: 12%;">
              <img src="${this.config.images_path}netatmo_absent.png">
            </div>
            <div class="element ${this.config.show_modes ? '' : 'hidden'}" id="btn-schedule" style="top: 83.2%; left: 67%; width: 10%;">
              <img src="${this.config.images_path}netatmo_auto.png">
            </div>
            <div class="element ${this.config.show_modes ? '' : 'hidden'}" id="btn-frost" style="top: 83.2%; left: 79.5%; width: 14.5%;">
              <img src="${this.config.images_path}netatmo_hors_gel.png">
            </div>
          </div>
        </ha-card>
      `;
      this.content = this.shadowRoot.getElementById("container");
      
      // Actions
      this.shadowRoot.getElementById("btn-up").onclick = () => this._callScriptAdjust(0.5);
      this.shadowRoot.getElementById("btn-down").onclick = () => this._callScriptAdjust(-0.5);
      this.shadowRoot.getElementById("btn-toggle").onclick = () => this._callScriptMode("toggle");
      this.shadowRoot.getElementById("btn-away").onclick = () => this._callScriptMode("away");
      this.shadowRoot.getElementById("btn-schedule").onclick = () => this._callScriptMode("schedule");
      this.shadowRoot.getElementById("btn-frost").onclick = () => this._callScriptMode("frost_guard");
      this.shadowRoot.getElementById("btn-battery").onclick = () => this._fireEvent("hass-more-info", { entityId: this.config.battery_sensor });
      this.shadowRoot.getElementById("btn-schedule-select").onclick = () => this._fireEvent("hass-more-info", { entityId: this.config.schedule_select });
      this.shadowRoot.getElementById("preset-icon").onclick = () => this._callScriptMode("schedule");
    }

    // Mises Ã  jour dynamiques
    const currentTempEl = this.shadowRoot.getElementById("current-temp");
    if (currentTempEl && stateObj.attributes.current_temperature !== undefined) {
      currentTempEl.textContent = `${stateObj.attributes.current_temperature}Â°`;
    }

    const targetTempEl = this.shadowRoot.getElementById("target-temp");
    if (targetTempEl) {
      const val = targetTemp ? targetTemp.state : (stateObj.attributes.temperature !== undefined ? stateObj.attributes.temperature : '--');
      targetTempEl.textContent = `${val}Â°`;
    }

    const batteryLevelEl = this.shadowRoot.getElementById("battery-level");
    if (batteryLevelEl && battery) {
      batteryLevelEl.textContent = `${battery.state}%`;
    }

    const batteryIconEl = this.shadowRoot.getElementById("battery-icon");
    if (batteryIconEl && battery) {
      batteryIconEl.setAttribute("icon", battery.attributes.icon || "mdi:battery");
    }

    const scheduleSelectEl = this.shadowRoot.getElementById("btn-schedule-select");
    if (scheduleSelectEl && schedule) {
      scheduleSelectEl.textContent = schedule.state;
    }

    const witness = this.shadowRoot.getElementById("heating-witness");
    witness.style.opacity = (hvacAction && hvacAction.state === "heating") ? "1" : "0";

    const presetImg = this.shadowRoot.getElementById("preset-img");
    const pMode = presetMode ? presetMode.state.toLowerCase() : "manual";
    const modeMap = { 
      "manual": "netatmo_manual.png", 
      "schedule": "netatmo_auto.png", 
      "away": "netatmo_absent.png", 
      "frost guard": "netatmo_hors_gel.png",
      "frost_guard": "netatmo_hors_gel.png"
    };
    presetImg.src = `${this.config.images_path}${modeMap[pMode] || "netatmo_manual.png"}`;

    const toggleImg = this.shadowRoot.getElementById("toggle-img");
    toggleImg.src = `${this.config.images_path}${stateObj.state === "off" ? "off.png" : "on.png"}`;
  }

  _callScriptAdjust(offset) {
    const targetTemp = this.config.target_temp_sensor ? this._hass.states[this.config.target_temp_sensor] : null;
    const current = targetTemp ? parseFloat(targetTemp.state) : parseFloat(this._hass.states[this.config.entity]?.attributes?.temperature);
    if (!isNaN(current)) {
      const nextTemp = Math.round((current + offset) * 10) / 10;
      const targetTempEl = this.shadowRoot.getElementById("target-temp");
      if (targetTempEl) targetTempEl.textContent = `${nextTemp}Â°`;
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

customElements.define("jp-netatmo-vertical-card", JPNetatmoVerticalCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "jp-netatmo-vertical-card",
  name: "JP Netatmo Vertical Card",
  description: "Version alternative avec boutons verticaux et nom centrÃ©."
});

