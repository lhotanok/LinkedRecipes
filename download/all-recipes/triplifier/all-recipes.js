const fs = require('fs');

const INPUT_PATH = `${__dirname}/../input/all-recipes.json`;
const OUTPUT_PATH = `${__dirname}/../output/all-recipes.jsonld`;
const IRI_BASE = 'http://example.org/graphs/allRecipes';

const XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
const XSD_FLOAT = 'http://www.w3.org/2001/XMLSchema#float';

const OWL_MINUTES = 'http://www.w3.org/TR/owl-time/#time:minutes';

main();

function main() {
    const recipes = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

    const jsonld = {
        '@context': buildJsonldContext(),
        '@id': IRI_BASE,
        '@graph': [],
    };
    
    recipes.forEach((recipe) => {
        const { name, prepTime, cookTime, totalTime, url, directions, ingredients, nutrition, rating, servings, reviews } = recipe;
    
        const RECIPE_IRI = `${IRI_BASE}/recipe/${convertToIri(name)}`;
    
        const jsonldRecipe = {
            '@id': RECIPE_IRI,
            type: 'Recipe',
            name,
            url,
            prepTime,
            cookTime,
            totalTime,
            servings,
            rating: buildAggregateRating(rating, reviews, RECIPE_IRI),
            directions: buildRecipeInstructions(directions, RECIPE_IRI),
            ingredients: buildRecipeIngredients(ingredients),
            nutrition: buildNutritionInformation(nutrition, RECIPE_IRI),
        };
    
        jsonld['@graph'].push(jsonldRecipe);
    });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(jsonld, null, 2));
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
        "NutritionInformation": "http://schema.org/NutritionInformation",
        "ItemList": "http://schema.org/ItemList",
        "HowToDirection": "http://schema.org/HowToDirection",
        "QuantitativeValue": "http://schema.org/QuantitativeValue",
        "AggregateRating": "http://schema.org/AggregateRating",
        "name": "http://schema.org/name",
        "altName": "http://schema.org/alternateName",
        "description": "http://schema.org/description",
        "url": { 
            "@id": "http://schema.org/url",
            "@type": "http://schema.org/URL"
        },
        "prepTime": { 
            "@id": "http://schema.org/prepTime",
            "@type": OWL_MINUTES
        },
        "cookTime": { 
            "@id": "http://schema.org/cookTime",
            "@type": OWL_MINUTES
        },
        "totalTime": { 
            "@id": "http://schema.org/totalTime",
            "@type": OWL_MINUTES
        },
        "ingredients": "http://schema.org/recipeIngredient",
        "unit": "http://schema.org/unitText",
        "quantity": { 
            "@id":"http://schema.org/value",
            "@type": XSD_FLOAT
        },
        "rating": "http://schema.org/aggregateRating",
        "ratingValue": { 
            "@id":"http://schema.org/ratingValue",
            "@type": XSD_INTEGER
        },
        "reviewCount": { 
            "@id":"http://schema.org/reviewCount",
            "@type": XSD_INTEGER
        },
        "nutrition": "http://schema.org/nutrition",
        "calories": { 
            "@id":"http://schema.org/calories",
            "@type": XSD_INTEGER
        },
        "protein": { 
            "@id":"http://schema.org/proteinContent",
            "@type": XSD_FLOAT
        },
        "carbohydrates": { 
            "@id":"http://schema.org/carbohydrateContent",
            "@type": XSD_FLOAT
        },
        "fat": { 
            "@id":"http://schema.org/fatContent",
            "@type": XSD_FLOAT
        },
        "cholesterol": { 
            "@id":"http://schema.org/cholesterolContent",
            "@type": XSD_FLOAT
        },
        "sodium": { 
            "@id":"http://schema.org/sodiumContent",
            "@type": XSD_FLOAT
        },
        "servings": { 
            "@id":"http://schema.org/recipeYield",
            "@type": XSD_INTEGER
        },
        "directions": "http://schema.org/recipeInstructions",
        "directionList": "http://schema.org/itemListElement",
        "position": { 
            "@id":"http://schema.org/position",
            "@type": XSD_INTEGER
        },
        "text": "http://schema.org/text"
    };
}

function buildAggregateRating(ratings, reviewCount, recipeIri) {
    const RATING_TYPE = 'AggregateRating';

    return {
        '@id': `${recipeIri}/rating`,
        type: RATING_TYPE,
        ratingValue: ratings,
        reviewCount,
    }
}

function buildNutritionInformation(nutrition, recipeIri) {
    return {
        '@id': `${recipeIri}/nutrition`,
        type: 'NutritionInformation',
        ...nutrition
    }
}

function buildRecipeInstructions(directions, recipeIri) {
    const DIRECTION_TYPE = 'HowToDirection';
    const DIRECTION_LIST_IRI = `${recipeIri}/directions`;

    const recipeInstructions = {
        '@id': DIRECTION_LIST_IRI,
        type: "ItemList",
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

function buildRecipeIngredients(ingredients) {
    const INGREDIENT_BASE_IRI = `${IRI_BASE}/ingredient`;

    const recipeIngredients = [];

    ingredients.forEach((ingredient) => {
        const { name, altName, unit, quantity } = ingredient;

        let parsedQuantity = quantity;

        const stringQuantity = quantity ? quantity.toString() : '';
        const splits = stringQuantity.split('.');

        if (splits.length === 2) {
            const decimalPart = splits[1];
            const floatQuantity = parseFloat(quantity); 
            parsedQuantity = decimalPart.length > 2 ? floatQuantity.toFixed(2) : floatQuantity;
        }

        // remove parentheses and their content
        const REMOVE_PARENTHESES_REGEX = / *\([^)]*\) */g;
        const parsedName = name.replace(REMOVE_PARENTHESES_REGEX, ''); 
        const parsedAltName = altName.replace(REMOVE_PARENTHESES_REGEX, ''); 

        const idName = parsedName.length <= parsedAltName.length ? parsedName : parsedAltName;

        recipeIngredients.push({
            "@id": `${INGREDIENT_BASE_IRI}/${convertToIri(idName)}`,
            type: 'QuantitativeValue',
            name: idName,
            altName,
            description: name,
            unit,
            quantity: parseFloat(parsedQuantity),
        });
    })

    return recipeIngredients;
}