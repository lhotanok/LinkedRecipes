const fs = require('fs');

const INPUT_PATH = `${__dirname}/../input/food-recipes.json`;
const OUTPUT_PATH = `${__dirname}/../output/food-recipes.jsonld`;
const IRI_BASE = 'http://example.org/graphs/foodRecipes';

const XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
const XSD_FLOAT = 'http://www.w3.org/2001/XMLSchema#float';
const XSD_DATETIME = 'http://www.w3.org/2001/XMLSchema#dateTime';

const OWL_MINUTES = 'http://www.w3.org/TR/owl-time/#time:minutes';

main();

function main() {
    const recipes = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

    const normalizedRecipes = normalizeRecipesInput(recipes);

    const jsonld = {
        '@context': buildJsonldContext(),
        '@id': IRI_BASE,
        '@graph': []
    };
    
    normalizedRecipes.forEach((recipe) => {    
        const { name, id, minutes, contributor_id, submitted, tags, nutrition, steps, description, ingredients } = recipe;

        const normalizedName = normalizeText(name);
    
        const RECIPE_IRI = `${IRI_BASE}/recipe/${convertToIri(normalizedName)}`;
    
        const jsonldRecipe = {
            '@id': RECIPE_IRI,
            type: 'Recipe',
            name: normalizedName,
            id,
            minutes,
            submitted,
            author: buildAuthor(contributor_id),
            description: normalizeText(description),
            ingredients: normalizeArray(ingredients),
            tags: normalizeArray(tags),
            steps: buildRecipeInstructions(normalizeArray(steps), RECIPE_IRI),
            nutrition: buildNutritionInformation(nutrition, RECIPE_IRI)
        };
    
        jsonld['@graph'].push(jsonldRecipe);
    });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(jsonld, null, 2));
}

function parseArrayFromString(string) {
    let parsedArray = [];

    if (string) {
        const arrayContent = string.substring(1, string.length - 1);
            const items = arrayContent.split('\', \'');
    
            parsedArray = items.map((item) => {
                let result = item;
    
                if (item.length) {
                    if (item[0] === '\'') {
                        result = item.substring(1);
                    } else if (item[item.length - 1] === '\'') {
                        result = item.substring(0, item.length - 1);
                    }
                } 
    
                return result;
            });
    }

    return parsedArray;
}

function normalizeRecipesInput(input) {
    return input.map((recipe) => {
        const normalizedRecipe = { ...recipe };

        normalizedRecipe.ingredients = parseArrayFromString(recipe.ingredients);
        normalizedRecipe.steps = parseArrayFromString(recipe.steps);
        normalizedRecipe.tags = parseArrayFromString(recipe.tags);

        return normalizedRecipe;
    });
}

function normalizeText(text) {
    return text.replace(/[ ]+/g, ' ').replaceAll(/[\n\t]/g, '').replaceAll(' ,', ',').trim();
}

function normalizeArray(array) {
    return array ? array.map((item) => normalizeText(item)) : [];
}

function convertToIri(name) {
    const lowercaseName = name.toLowerCase();

    return lowercaseName.replaceAll(' ', '-').replaceAll(/[^a-zA-Z0-9-_]/g, '');
}

function buildJsonldContext() {
    return {
        "@language": "en",
        "type": "@type",
        "Recipe": "http://schema.org/Recipe",
        "Person": "http://schema.org/Person",
        "NutritionInformation": "http://schema.org/NutritionInformation",
        "ItemList": "http://schema.org/ItemList",
        "HowToDirection": "http://schema.org/HowToDirection",
        "name": "http://schema.org/name",
        "description": "http://schema.org/description",
        "id": { 
            "@id":"http://schema.org/identifier",
            "@type": XSD_INTEGER
        },
        "minutes": { 
            "@id": "http://schema.org/totalTime",
            "@type": OWL_MINUTES
        },
        "submitted": { 
            "@id": "http://schema.org/datePublished",
            "@type": XSD_DATETIME
        },
        "author": "http://schema.org/contributor",
        "ingredients": "http://schema.org/recipeIngredient",
        "tags": "http://schema.org/keywords",
        "nutrition": "http://schema.org/nutrition",
        "calories": { 
            "@id":"http://schema.org/calories",
            "@type": XSD_INTEGER
        },
        "protein": { 
            "@id":"http://schema.org/proteinContent",
            "@type": XSD_FLOAT
        },
        "sugar": { 
            "@id":"http://schema.org/sugarContent",
            "@type": XSD_FLOAT
        },
        "fat": { 
            "@id":"http://schema.org/fatContent",
            "@type": XSD_FLOAT
        },
        "saturatedFat": { 
            "@id":"http://schema.org/saturatedFatContent",
            "@type": XSD_FLOAT
        },
        "sodium": { 
            "@id":"http://schema.org/sodiumContent",
            "@type": XSD_FLOAT
        },
        "steps": "http://schema.org/recipeInstructions",
        "directionList": "http://schema.org/itemListElement",
        "position": { 
            "@id":"http://schema.org/position",
            "@type": XSD_INTEGER
        },
        "text": "http://schema.org/text"
    };
}

function buildNutritionInformation(nutrition, recipeIri) {
    const nutritionInfo = {
        '@id': `${recipeIri}/nutrition`,
        type: 'NutritionInformation',
        calories: parseInt(nutrition[0].toString()),
        protein: nutrition[4],
        sugar: nutrition[2],
        fat: nutrition[1],
        saturatedFat: nutrition[5],
        sodium: nutrition[3]
    }

    return nutritionInfo;
}

function buildRecipeInstructions(directions, recipeIri) {
    const DIRECTION_TYPE = 'HowToDirection';
    const DIRECTION_LIST_IRI = `${recipeIri}/directions`;

    const recipeInstructions = {
        '@id': DIRECTION_LIST_IRI,
        type: 'ItemList',
        directionList: []
    }

    for (let i = 1; i < directions.length + 1; i++) {
        recipeInstructions.directionList.push({
            '@id': `${DIRECTION_LIST_IRI}#step${i}`,
            type: DIRECTION_TYPE,
            position: i,
            text: directions[i - 1]
        });
    }

    return recipeInstructions;
}

function buildAuthor(id) {
    const AUTHOR_BASE_IRI = `${IRI_BASE}/author`;
    const AUTHOR_TYPE = 'Person';

    return {
        '@id': `${AUTHOR_BASE_IRI}/${id}`,
        type: AUTHOR_TYPE,
        id,
    }
}