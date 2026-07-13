# 🌡️ Guide d'utilisation : Script Netatmo Unifié

Ce script centralise la gestion des modes et de l'alimentation de votre thermostat Netatmo (`climate.salon`).

## 🛠️ Paramètres du script
L'identifiant du script est : `script.netatmo_modes_unifie`

| Valeur du paramètre `mode` | Action réalisée |
| :--- | :--- |
| `away` | Active le mode **Absent** (Away) |
| `frost_guard` | Active le mode **Hors-Gel** (Frost Guard) |
| `schedule` | Revient au **Planning** automatique (Schedule) |
| `toggle` | **Allume** (si éteint) ou **Éteint** (si allumé) |

---

## 🚀 Exemples d'implémentation

### 1. Appel de service direct (YAML)
```yaml
action: script.netatmo_modes_unifie
data:
  mode: away
```

### 2. Bouton dans l'interface (Lovelace)
```yaml
type: button
name: "Passer en mode Absent"
icon: mdi:home-minus
tap_action:
  action: call-service
  service: script.netatmo_modes_unifie
  data:
    mode: away
```

### 3. Bouton On/Off Intelligent (Toggle)
```yaml
type: button
name: "Thermostat On/Off"
icon: mdi:power
tap_action:
  action: call-service
  service: script.netatmo_modes_unifie
  data:
    mode: toggle
```

## 📝 Note technique
Le script synchronise automatiquement l'état réel du thermostat avec l'entité `sensor.netatmo_preset_mode` pour garantir un affichage cohérent sur votre tableau de bord.
