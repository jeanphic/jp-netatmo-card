# 🔘 JP Netatmo Vanne Card

Une carte Lovelace spécialisée pour les vannes thermostatiques Netatmo. Plus compacte et épurée que la version thermostat, elle se concentre sur l'essentiel pour un contrôle précis pièce par pièce.

## ✨ Caractéristiques

- **📐 Design Compact** : Utilise le fond `netatmo_vanne362x262.png` pour une intégration visuelle parfaite des vannes.
- **🔥 Témoin de Chauffe** : La flamme apparaît dynamiquement selon l'état de la vanne.
- **🔄 Mode Actuel Interactif** : Affiche l'icône du mode en cours. Un clic sur l'icône permet de repasser instantanément en mode **Planning** (Schedule).
- **🕹️ Pilotage** : Ajustement de la température (+/- 0.5°C) via les flèches.
- **🔋 Suivi Batterie** : Affiche le pourcentage et permet d'ouvrir les détails.

## 🚀 Installation

### Via HACS
1. Ajoutez ce dépôt comme **Dépôt personnalisé** dans HACS.
2. Recherchez "JP Netatmo Vanne Card" et installez-le.

## 🛠️ Guide des Paramètres

| Paramètre | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | **Requis** | `custom:jp-netatmo-vanne-card` |
| `entity` | string | **Requis** | Entité `climate.chambre` par exemple. |
| `room_name` | string | `Chambre` | Nom de la pièce. |
| `hvac_action_sensor`| string | - | Capteur d'état de chauffe de la vanne. |
| `preset_mode_sensor`| string | - | Capteur du mode de la vanne. |
| `target_temp_sensor`| string | - | Capteur de la température de consigne. |
| `battery_sensor` | string | - | Capteur de batterie de la vanne. |
| `max_width` | string | `100%` | Largeur maximale de la carte. |

## 🚀 Exemple de configuration

```yaml
type: custom:jp-netatmo-vanne-card
entity: climate.chambre
room_name: "Chambre"
hvac_action_sensor: sensor.netatmo_hvac_action_chambre
preset_mode_sensor: sensor.netatmo_preset_mode_chambre
target_temp_sensor: sensor.netatmo_temperature_consigne_chambre
battery_sensor: sensor.thermostat_chambre_battery_percent
max_width: "250px"
```

---
*Créé par JP - Spécial Vannes Netatmo.*
