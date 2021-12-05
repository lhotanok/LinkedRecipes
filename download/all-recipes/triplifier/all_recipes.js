const fs = require('fs');

const INPUT_PATH = './../input/all_recipes.json';
const OUTPUT_PATH = './../output/all_recipes.jsonld';
const IRI_BASE = 'http://example.org/graphs/allRecipes';

const XSD_INTEGER = "http://www.w3.org/2001/XMLSchema#integer";
const XSD_FLOAT = "http://www.w3.org/2001/XMLSchema#float";

const OWL_MINUTES = "http://www.w3.org/TR/owl-time/#time:minutes";

main();

function main() {
    const recipes = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

    const jsonld = {
        "@context": buildJsonldContext(),
        "@id": IRI_BASE,
        "@graph": []
    };
    
    recipes.forEach((recipe) => {
        let jsonldRecipe = {};
    
        const { name, prepTime, cookTime, totalTime, url, directions, ingredients, nutrition } = recipe;
    
        const RECIPE_IRI = `${IRI_BASE}/recipe/${convertToIri(name)}`;
    
        jsonldRecipe["@id"] = RECIPE_IRI;
        jsonldRecipe["type"] = "Recipe";
    
        jsonldRecipe = { ...jsonldRecipe, name, url, prepTime, cookTime, totalTime };
    
        jsonldRecipe["directions"] = buildRecipeInstructions(directions, RECIPE_IRI);
        jsonldRecipe["ingredients"] = buildRecipeIngredients(ingredients);

        jsonldRecipe["nutrition"] = buildNutritionInformation(nutrition, RECIPE_IRI);
    
        jsonld["@graph"].push(jsonldRecipe);
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
        "name": "http://schema.org/name",
        "altName": "http://schema.org/alternateName",
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

function buildNutritionInformation(nutrition, recipeIri) {
    return {
        "@id": `${recipeIri}/nutrition`,
        "type": "NutritionInformation",
        ...nutrition
    }
}

function buildRecipeInstructions(directions, recipeIri) {
    const DIRECTION_TYPE = 'HowToDirection';
    const DIRECTION_LIST_IRI = `${recipeIri}/directions`;

    const recipeInstructions = {
        "@id": DIRECTION_LIST_IRI,
        "type": "ItemList",
        "directionList": []
    }

    for (let i = 1; i < directions.length + 1; i++) {
        recipeInstructions.directionList.push({
            "@id": `${DIRECTION_LIST_IRI}#step${i}`,
            "type": DIRECTION_TYPE,
            "position": i,
            "text": directions[i - 1]
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
            parsedQuantity = decimalPart.length > 2 ? quantity.toFixed(2) : quantity;
        }

        //remove parentheses and their content
        const REMOVE_PARENTHESES_REGEX = / *\([^)]*\) */g;
        const parsedName = name.replace(REMOVE_PARENTHESES_REGEX, ''); 
        const parsedAltName = altName.replace(REMOVE_PARENTHESES_REGEX, ''); 

        const shorterName = parsedName.length <= parsedAltName.length ? parsedName : parsedAltName;

        recipeIngredients.push({
            "@id": `${INGREDIENT_BASE_IRI}/${convertToIri(shorterName)}`,
            "type": "QuantitativeValue",
            name,
            altName,
            unit,
            quantity: parsedQuantity
        });
    })

    return recipeIngredients;
}