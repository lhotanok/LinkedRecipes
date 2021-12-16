const fs = require('fs');

const INPUT_PATH = `${__dirname}/../input/bbc-recipes.json`;
const OUTPUT_PATH = `${__dirname}/../output/bbc-recipes.jsonld`;
const IRI_BASE = 'http://example.org/graphs/bbcRecipes';

const XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
const XSD_FLOAT = 'http://www.w3.org/2001/XMLSchema#float';

const OWL_MINUTES = 'http://www.w3.org/TR/owl-time/#time:minutes';

main();

function main() {
    const items = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

    const jsonld = {
        '@context': buildJsonldContext(),
        '@id': IRI_BASE,
        '@graph': []
    };
    
    items.forEach((item) => {
        const { page: { article, recipe, title } } = item;
        const { author, description, id  } = article;
        const { cooking_time, prep_time, serves, keywords, ratings, nutrition_info, ingredients, collections, courses, cusine, diet_types } = recipe;
    
        const RECIPE_IRI = `${IRI_BASE}/recipe/${id}`;
    
        const jsonldRecipe = {
            '@id': RECIPE_IRI,
            type: 'Recipe',
            name: normalizeText(title),
            description,
            id,
            author: buildAuthor(author),
            cooking_time: convertToMinutes(cooking_time),
            prep_time: convertToMinutes(prep_time),
            serves,
            ingredients: buildRecipeIngredients(ingredients),
            keywords: buildRecipeTags(keywords),
            courses,
            cusine,
            ratings: buildAggregateRating(ratings, RECIPE_IRI),
            nutrition: buildNutritionInformation(nutrition_info, RECIPE_IRI),
            diet_types: buildDietTypes(diet_types, collections),
        };
    
        jsonld["@graph"].push(jsonldRecipe);
    });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(jsonld, null, 2));
}

function normalizeText(text) {
    return text.replaceAll('&amp;', '&');
}

function convertToIriFormat(text) {
    const lowercaseText = text.toLowerCase();

    return lowercaseText.replaceAll(' ', '-').replaceAll(/[^a-zA-Z0-9-_]/g, '');
}

function buildJsonldContext() {
    return {
        "@language": "en",
        "type": "@type",
        "Recipe": "http://schema.org/Recipe",
        "Person": "http://schema.org/Person",
        "Ingredient": "http://example.org/ns#Ingredient",
        "Tag": "http://example.org/ns#Tag",
        "ItemList": "http://schema.org/ItemList",
        "HowToDirection": "http://schema.org/HowToDirection",
        "AggregateRating": "http://schema.org/AggregateRating",
        "NutritionInformation": "http://schema.org/NutritionInformation",
        "DiabeticDiet": "http://schema.org/DiabeticDiet",
        "GlutenFreeDiet": "http://schema.org/GlutenFreeDiet",
        "LowCalorieDiet": "http://schema.org/LowCalorieDiet",
        "LowFatDiet": "http://schema.org/LowFatDiet",
        "LowLactoseDiet": "http://schema.org/LowLactoseDiet",
        "LowSaltDiet": "http://schema.org/LowSaltDiet",
        "VeganDiet": "http://schema.org/VeganDiet",
        "VegetarianDiet": "http://schema.org/VegetarianDiet",
        "name": "http://schema.org/name",
        "description": "http://schema.org/description",
        "id": "http://schema.org/identifier",
        "label": "http://www.w3.org/2000/01/rdf-schema#label",
        "author": "http://schema.org/contributor",
        "prep_time": { 
            "@id": "http://schema.org/prepTime",
            "@type": OWL_MINUTES
        },
        "cooking_time": { 
            "@id": "http://schema.org/cookTime",
            "@type": OWL_MINUTES
        },
        "serves": { 
            "@id":"http://schema.org/recipeYield",
            "@type": XSD_INTEGER
        },
        "ratings": "http://schema.org/aggregateRating",
        "rating_value": { 
            "@id":"http://schema.org/ratingValue",
            "@type": XSD_INTEGER
        },
        "ingredients": "http://schema.org/recipeIngredient",
        "keywords": "http://schema.org/keywords",
        "courses": "http://schema.org/recipeCategory",
        "cusine": "http://schema.org/recipeCuisine",
        "diet_types": { 
            "@id":"http://schema.org/suitableForDiet",
            "@type": "http://schema.org/RestrictedDiet"
        },
        "nutrition_info": "http://schema.org/nutrition",
        "kcal": { 
            "@id":"http://schema.org/calories",
            "@type": XSD_INTEGER
        },
        "carbohydrate": { 
            "@id":"http://schema.org/carbohydrateContent",
            "@type": XSD_FLOAT
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
        "saturated_fat": { 
            "@id":"http://schema.org/saturatedFatContent",
            "@type": XSD_FLOAT
        },
    };
}

function convertToMinutes(duration) {
    return parseInt(duration / 60);
}

function parseNumber(text) {
    return parseFloat(text.replace(/[^0-9.]/g, ''));
}

function convertToIri(text) {
    const lowercaseText = text.toLowerCase();

    return lowercaseText.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/( )+/g, '-');
}

function buildAggregateRating(ratings, recipeIri) {
    const RATING_TYPE = 'AggregateRating';

    return {
        '@id': `${recipeIri}/rating`,
        type: RATING_TYPE,
        rating_value: ratings,
    }
}

function buildNutritionInformation(nutrition, recipeIri) {
    const PROPERTY_MAPPING = {
        carbohydrate: 'carbohydrate',
        protein: 'protein',
        fat: 'fat',
        'kcalcalories': 'kcal',
        'addedsugar': 'sugar',
        'saturatedfat': 'saturatedFat',
    };

    const nutritionInfo = {
        '@id': `${recipeIri}/nutrition`,
        "type": "NutritionInformation",
        "sugar": null,
        "carbohydrate": null,
        "kcal": null,
        "protein": null,
        "saturatedFat": null,
        "fat": null,
    }
    // "Added sugar 10g", "Carbohydrate 42g", "Kcal 457 calories", "Protein 33g", "Salt 1.8g", "Saturated fat 5g", "Fat 17g"

    nutrition.forEach((item) => {
        const lowercase_item = item.toLowerCase(item);
        const unit = lowercase_item.replace(/[0-9.g ]/g, '');

        if (PROPERTY_MAPPING[unit]) {
            const propertyName = PROPERTY_MAPPING[unit];
            nutritionInfo[propertyName] = parseNumber(item);
        }
    });

    return nutritionInfo;
}

function buildDietTypes(diets, collections) {
    const DIET_MAPPING = {
        vegetarian: 'VegetarianDiet',
        vegan: 'VeganDiet',
        'low-salt': 'LowSaltDiet',
        'gluten-free': 'GlutenFreeDiet',
        'low-fat': 'LowFatDiet',
        'low-calorie': 'LowCalorieDiet',
        'dairy-free': 'LowLactoseDiet',
    }

    const diet_enums = diets.map((diet) => DIET_MAPPING[diet.toLowerCase()])
        .filter((diet) => diet); // removes unknown diet types

    collections.forEach((collection) => {
        if (collection.toLowerCase() === 'diabetes-friendly') {
            diet_enums.push('DiabeticDiet');
        }
    })

    return diet_enums.map((diet) => {
        const dietName = diet.replaceAll('Diet', '');
        return {
            '@id': `${IRI_BASE}/diets/${dietName}`,
            type: diet,
        }
    });
}

function buildAuthor(name) {
    const AUTHOR_BASE_IRI = `${IRI_BASE}/author`;
    const AUTHOR_TYPE = 'Person';
    const GENERAL_AUTHOR = 'Good Food';

    const id = convertToIriFormat(name);
    const personName = name === GENERAL_AUTHOR ? '' : name;

    const nameParts = personName.split(' ');

    return {
        '@id': `${AUTHOR_BASE_IRI}/${id}`,
        type: AUTHOR_TYPE,
        givenName: nameParts.length ? nameParts[0] : '',
        familyName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
    }
}

function buildLabeledItems(items, category, type) {
    const ITEM_BASE_IRI = `${IRI_BASE}/${category}`;

    const labeledItems = [];

    items.forEach((item) => {

        labeledItems.push({
            "@id": `${ITEM_BASE_IRI}/${convertToIri(item)}`,
            type,
            label: item,
        });
    })

    return labeledItems;
}

function buildRecipeIngredients(ingredients) {
    return buildLabeledItems(ingredients, 'ingredient', 'Ingredient');
}

function buildRecipeTags(keywords) {
    return buildLabeledItems(keywords, 'tag', 'Tag');
}