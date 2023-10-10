const fs = require('fs');
const path = require('path');

const contribution = {};

contribution.configuration = {
    "title": "SnippeTeam",
    "properties": {

        // CONFIG BASE DE DONNÉE
        "snippeteam.databaseAdapter": {
            "type": "string",
            "default": "local",
            "enum": [
                "local"
            ],
            "enumDescriptions": [
                "Syncs the database file locally."
            ],
            "description": "Choose how the database will be saved."
        },
        "snippeteam.localPath": {
            "type": "string",
            "default": "~\\AppData\\Roaming\\snippeteam",
            "description": "The path of the folder where the database file will be saved."
        }
    }
}



contribution.commands = [
    // USER
    {
        "command": "snippeteam.hub",
        "title": "SnippeTeam: Ouvrir le hub SnippeTeam"
    },
    {
        "command": "snippeteam.set.localFilePath",
        "title": "SnippeTeam: Change le chemin de la base de donnée"
    },

    // DOC
    {
        "command": "snippeteam.doc.create",
        "title": "Créer un nouveau document",
        "icon": "$(new-file)"
    },
    {
        "command": "snippeteam.doc.edit",
        "title": "Éditer le document",
        "icon": "$(edit)"
    },
    {
        "command": "snippeteam.doc.trash",
        "title": "Supprimer le document",
        "icon": "$(trash)"
    },
    {
        "command": "snippeteam.doc.delete",
        "title": "Supprimer le document",
        "icon": "$(trash)"
    },
    {
        "command": "snippeteam.doc.restore",
        "title": "Restaurer le document",
        "icon": "$(debug-step-back)"
    },

    // CATEGORY
    {
        "command": "snippeteam.cat.create",
        "title": "Créer une nouvelle catégorie",
        "icon": "$(add)"
    },
    {
        "command": "snippeteam.cat.delete",
        "title": "Supprimer la catégorie",
        "icon": "$(trash)"
    },
    {
        "command": "snippeteam.cat.rename",
        "title": "Renommer la catégorie",
        "icon": "$(edit)"
    }
];


contribution.viewsContainers = {
    // AJOUTE LA SECTION POUR SNIPPETEAM
    "activitybar": [
        {
            "id": "snippeteam",
            "title": "SnippeTeam",
            "icon": "resources/dep.svg"
        }
    ]
}


contribution.views = {
    "snippeteam": [
        {
            "id": "snippeTeamSearch",
            "name": "search",
            "icon": "resources/dep.svg",
            "contextualTitle": "Snippeteam Search",
            "type": "webview",
            "initialSize": 1
        },
        {
            "id": "snippeTeamMenu",
            "name": "Menu",
            "icon": "resources/dep.svg",
            "contextualTitle": "Snippeteam",
            "type": "tree",
            "initialSize": 99
        }
    ]
}


contribution.menus = {
    "view/title": [
        // actions Doc
        {
            "command": "snippeteam.doc.create",
            "when": "view == snippeTeamMenu",
            "group": "navigation"
        }
    ],
    "view/item/context": [

        // actions catégories
        {
            "command": "snippeteam.cat.create",
            "when": "view == snippeTeamMenu && viewItem == 'categories' ",
            "group": "inline"
        },
        {
            "command": "snippeteam.cat.delete",
            "when": "view == snippeTeamMenu && viewItem == 'categoryItem' ",
            "group": "inline"
        },
        {
            "command": "snippeteam.cat.rename",
            "when": "view == snippeTeamMenu && viewItem == 'categoryItem' ",
            "group": "inline"
        },

        // actions Docs
        {
            "command": "snippeteam.doc.trash",
            "when": "view == snippeTeamMenu && viewItem == 'docItem' ",
            "group": "inline"
        },
        {
            "command": "snippeteam.doc.edit",
            "when": "view == snippeTeamMenu && viewItem == 'docItem' ",
            "group": "inline"
        },
        {
            "command": "snippeteam.doc.restore",
            "when": "view == snippeTeamMenu && viewItem == 'docItemTrashed' ",
            "group": "inline"
        },
        {
            "command": "snippeteam.doc.delete",
            "when": "view == snippeTeamMenu && viewItem == 'docItemTrashed' ",
            "group": "inline"
        }
    ]
}

const package_json = JSON.parse(fs.readFileSync(path.resolve('package.json')).toString());
package_json.contributes = contribution;
fs.writeFileSync(path.resolve('package.json'), JSON.stringify(package_json, null, 4));