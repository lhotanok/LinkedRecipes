const { countReset } = require('console');
const fs = require('fs');

const INPUT_PATH = `${__dirname}/../input/all-recipes.json`;
const OUTPUT_PATH = `${__dirname}/../output/all-recipes.jsonld`;
const IRI_BASE = 'http://example.org/resource/dataset/allRecipes';

const XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
const XSD_FLOAT = 'http://www.w3.org/2001/XMLSchema#float';

const OWL_MINUTES = 'http://www.w3.org/TR/owl-time/#time:minutes';

main();

function main() {
    const recipes = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

    const jsonld = {
        '@context': buildJsonldContext(),
        '@id': IRI_BASE,
        '@graph': []
    };

    const graphEntities = {
        ingredients: {},
        recipes: {},
    }
    
    recipes.forEach((recipe) => {
        const { name, prepTime, cookTime, totalTime, url, directions, ingredients, nutrition, rating, servings, reviews } = recipe;
    
        const RECIPE_IRI = `${IRI_BASE}/recipe/${convertToIri(name)}`;

        const parsedIngredients = parseIngredients(ingredients);
        const generalIngredients = buildIngredients(parsedIngredients);

        const entities = {
            ingredients: generalIngredients,
        };

        entities.recipes = [{
            '@id': RECIPE_IRI,
            type: 'Recipe',
            name,
            url,
            servings,
            prepTime: parseMinutes(prepTime),
            cookTime: parseMinutes(cookTime),
            totalTime: parseMinutes(totalTime),
            ingredients: buildRecipeIngredients(parsedIngredients, RECIPE_IRI),
            rating: buildAggregateRating(rating, reviews, RECIPE_IRI),
            directions: buildRecipeInstructions(directions, RECIPE_IRI),
            nutrition: buildRecipeNutritionInformation(nutrition, RECIPE_IRI),
        }];
    
        saveNewEntities(entities, graphEntities);
    });

    jsonld['@graph'].push(
        ...buildClassDefinitions(jsonld['@context']),
        ...buildPropertyDefinitions(jsonld['@context']),
        );

    Object.values(graphEntities).forEach((entity) => {
        jsonld['@graph'].push(...Object.values(entity));
    })

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(jsonld, null, 2));
}

function convertToIri(text) {
    const lowercaseText = text.toLowerCase();

    return lowercaseText.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/( )+/g, '-');
}

function buildJsonldContext() {
    return {
        "@language": "en",
        "type": "@type",
        "Class": "http://www.w3.org/2002/07/owl#Class",
        "Property": "http://www.w3.org/2002/07/owl#ObjectProperty",
        "Recipe": "http://schema.org/Recipe",
        "NutritionInformation": "http://schema.org/NutritionInformation",
        "ItemList": "http://schema.org/ItemList",
        "HowToDirection": "http://schema.org/HowToDirection",
        "NamedIndividual": "http://www.w3.org/2002/07/owl#NamedIndividual",
        "QuantitativeValue": "http://purl.org/goodrelations/v1#QuantitativeValue",
        "AggregateRating": "http://schema.org/AggregateRating",
        "Ingredient": "http://example.org/ns#Ingredient",
        "RecipeIngredient": "http://example.org/ns#RecipeIngredient",
        "Calories": "http://example.org/ns#Calories",
        "ProteinContent": "http://example.org/ns#ProteinContent",
        "CarbohydrateContent": "http://example.org/ns#CarbohydrateContent",
        "FatContent": "http://example.org/ns#FatContent",
        "CholesterolContent": "http://example.org/ns#CholesterolContent",
        "SodiumContent": "http://example.org/ns#SodiumContent",
        "subClassOf": "http://www.w3.org/2000/01/rdf-schema#subClassOf",
        "prefLabel": "http://www.w3.org/2004/02/skos/core#prefLabel",
        "altLabel": "http://www.w3.org/2004/02/skos/core#altLabel",
        "description": "http://www.w3.org/2004/02/skos/core#note",
        "name": "http://schema.org/name",
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
        "amount": "http://purl.org/goodrelations/v1#hasEligibleQuantity",
        "unit": "http://purl.org/goodrelations/v1#hasUnitOfMeasurement",
        "quantity": {
            "@id": "http://purl.org/goodrelations/v1#hasValueFloat",
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
        "calories": "http://schema.org/calories",
        "protein": "http://schema.org/proteinContent",
        "carbohydrates": "http://schema.org/carbohydrateContent",
        "fat": "http://schema.org/fatContent",
        "cholesterol": "http://schema.org/cholesterolContent",
        "sodium": "http://schema.org/sodiumContent",
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

function buildClassDefinitions(context) {
    const QUANTITATIVE_VALUE = 'QuantitativeValue';
    const NAMED_INDIVIDUAL = 'NamedIndividual';

    const classes = [
        { name: 'Ingredient', subClassOf: NAMED_INDIVIDUAL },
        { name: 'RecipeIngredient', subClassOf: NAMED_INDIVIDUAL },
        { name: 'Calories', subClassOf: QUANTITATIVE_VALUE },
        { name: 'ProteinContent', subClassOf: QUANTITATIVE_VALUE },
        { name: 'CarbohydrateContent', subClassOf: QUANTITATIVE_VALUE },
        { name: 'FatContent', subClassOf: QUANTITATIVE_VALUE },
        { name: 'CholesterolContent', subClassOf: QUANTITATIVE_VALUE },
        { name: 'SodiumContent', subClassOf: QUANTITATIVE_VALUE },
    ];

    return classes.map((classInfo) => buildClassDefinition(classInfo, context));
}

function buildClassDefinition(classInfo, context) {
    const { name, subClassOf } = classInfo;
    return {
        '@id': `http://example.org/ns#${name}`,
        type: 'Class',
        label: name,
        subClassOf: { '@id': context[subClassOf] },
    }
}

function buildPropertyDefinitions(context) {
    const RECIPE_INGREDIENT = 'RecipeIngredient';
    const INGREDIENT = "Ingredient"

    const properties = [
        { name: 'ingredient', domain: RECIPE_INGREDIENT, range: INGREDIENT },
    ];

    return properties.map((propertyInfo) => buildPropertyDefinition(propertyInfo, context));
}

function buildPropertyDefinition(propertyInfo, context) {
    const { name, domain, range } = propertyInfo;
    return {
        '@id': `http://example.org/ns#${name}`,
        type: 'Property',
        label: name,
        domain: { '@id': context[domain] },
        range: { '@id': context[range] },
    }
}

function saveNewEntities(entities, saved) {
    Object.keys(entities).forEach((key) => {
        const items = entities[key];

        items.forEach((item) => {
            const id = item['@id'];

            if (!saved[key][id]) {
                saved[key][id] = item;
            }
        });
    });
}

function parseMinutes(text) {
    if (!text) return null;

    const splits = text.replace(/[^0-9 ]/g, '').replace(/( )+/g, ' ').trim().split(' ');

    if (splits.length === 0) return null;

    let minutes = parseInt(splits[0], 10);

    if (text.includes('hr')) {
        minutes *= 60;
    }

    if (splits.length > 1) {
        minutes += parseInt(splits[1], 10);
    }

    return minutes;
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

function buildRecipeNutritionInformation(nutrition, recipeIri) {
    const NUTRITION_IRI = `${recipeIri}/nutrition`;

    const NUTRITION_MAPPING = {
        calories: { type: 'Calories', unit: 'kcal'},
        protein: { type: 'ProteinContent', unit: 'g'},
        carbohydrates: { type: 'CarbohydrateContent', unit: 'g'},
        fat: { type: 'FatContent', unit: 'g'},
        cholesterol: { type: 'CholesterolContent', unit: 'mg'},
        sodium: { type: 'SodiumContent', unit: 'mg'},
    }

    const nutritionInfo = {
        '@id': NUTRITION_IRI,
        type: 'NutritionInformation',
    }

    Object.keys(nutrition).forEach((key) => {
        if (key) {
            const { type, unit } = NUTRITION_MAPPING[key];
            const quantity = nutrition[key];
    
            nutritionInfo[key] = {
                "@id": `${NUTRITION_IRI}/${key}`,
                type,
                quantity,
                unit,
            }
        }
    })
    
    return nutritionInfo;
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

function parseIngredients(ingredients) {
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
            idName,
            altName,
            name,
            quantity: parseFloat(parsedQuantity),
            unit,
        });
    })

    return recipeIngredients;
}

function buildIngredients(parsedIngredients) {
    const INGREDIENT_BASE_IRI = `${IRI_BASE}/ingredient`;

    const ingredients = [];

    parsedIngredients.forEach((ingredient) => {
        const { name, idName, altName, unit, quantity } = ingredient;

        ingredients.push({
            "@id": `${INGREDIENT_BASE_IRI}/${convertToIri(idName)}`,
            type: 'Ingredient',
            prefLabel: idName,
            altLabel: altName,
            description: name,
        });
    })

    return ingredients;
}

function buildRecipeIngredients(parsedIngredients, recipeIri) {
    const INGREDIENT_BASE_IRI = `${IRI_BASE}/ingredient`;
    const RECIPE_INGREDIENT_BASE_IRI = `${recipeIri}/ingredient`;

    const recipeIngredients = [];

    parsedIngredients.forEach((ingredient) => {
        const { idName, unit, quantity } = ingredient;

        const ingredient_iri_suffix = convertToIri(idName);

        recipeIngredients.push({
            "@id": `${RECIPE_INGREDIENT_BASE_IRI}/${ingredient_iri_suffix}`,
            type: 'RecipeIngredient',
            ingredient: `${INGREDIENT_BASE_IRI}/${ingredient_iri_suffix}`,
            amount: {
                "@id": `${RECIPE_INGREDIENT_BASE_IRI}/${ingredient_iri_suffix}/amount`,
                quantity,
                unit,
            }
        });
    })

    return recipeIngredients;
}