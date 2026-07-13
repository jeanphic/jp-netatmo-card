# 🌡️ JP Netatmo Vertical Card

Une version alternative de la carte Netatmo Premium, optimisée pour un affichage plus symétrique avec des contrôles verticaux.

## ✨ Caractéristiques Spécifiques

- **🔼 Disposition Verticale** : Le bouton "+" est placé au-dessus du bouton "-" pour une ergonomie différente.
- **🏷️ Titrage Aligné** : Le nom de la pièce est affiché directement au-dessus des valeurs de température (zone écran).
- **🎨 Look "Screen"** : La disposition est pensée pour maximiser l'utilisation de la zone d'affichage du fond Netatmo.
- **🛠️ Toutes les fonctions Pro** : Garde l'interactivité du planning, le masquage des modes, et la gestion dynamique de la chauffe.

## 🛠️ Guide des Paramètres

Identique à la version standard, mais avec un nouveau type :
`type: custom:jp-netatmo-vertical-card`

| Paramètre | Défaut | Description |
| :--- | :--- | :--- |
| `entity` | **Requis** | Entité `climate`. |
| `room_name` | `Salon` | Nom de la pièce. |
| `show_modes` | `true` | Masque les boutons du bas. |
| `show_toggle` | `true` | Masque le On/Off. |
| `max_width` | `300px` | Largeur maximale conseillée pour cette version. |

## 🚀 Exemple de configuration

```yaml
type: custom:jp-netatmo-vertical-card
entity: climate.salon
room_name: "SALON"
max_width: "280px"
```

---
*Créé par JP - Version Verticale HACS.*
