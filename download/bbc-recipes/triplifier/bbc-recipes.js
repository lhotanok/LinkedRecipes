const fs = require('fs');

const INPUT_PATH = `${__dirname}/../input/bbc-recipes.json`;
const OUTPUT_PATH = `${__dirname}/../output/bbc-recipes.jsonld`;
const IRI_BASE = 'http://example.org/resource/dataset/bbcRecipes';

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

    const graphEntities = {
        authors: {},
        ingredients: {},
        tags: {},
        courses: {},
        cusines: {},
        recipes: {},
    }
    
    items.forEach((item) => {
        const { page: { article, recipe, title } } = item;
        const { author, description, id  } = article;
        const { cooking_time, prep_time, serves, keywords, ratings, nutrition_info, ingredients, collections, courses, cusine, diet_types } = recipe;
    
        const RECIPE_IRI = `${IRI_BASE}/recipe/${id}`;

        const entities = {
            authors: [buildAuthor(author)],
            ingredients: buildIngredients(ingredients),
            tags: buildTags(keywords),
            courses: buildCourses(courses),
            cusines: buildCusines([cusine]),
        };
    
        entities.recipes = [{
            '@id': RECIPE_IRI,
            type: 'Recipe',
            name: normalizeText(title),
            description,
            id,
            cooking_time: convertToMinutes(cooking_time),
            prep_time: convertToMinutes(prep_time),
            serves,
            ratings: buildRecipeAggregateRating(ratings, RECIPE_IRI),
            nutrition_info: buildRecipeNutritionInformation(nutrition_info, RECIPE_IRI),
            diet_types: buildRecipeDietTypes(diet_types, collections, jsonld['@context']),
            author: extractIds(entities.authors),
            ingredients: extractIds(entities.ingredients),
            keywords: extractIds(entities.tags),
            courses: extractIds(entities.courses),
            cusine: extractIds(entities.cusines),
        }];

        saveNewEntities(entities, graphEntities);
    });

    jsonld['@graph'].push(...buildClassDefinitions(jsonld['@context']));

    Object.values(graphEntities).forEach((entity) => {
        jsonld['@graph'].push(...Object.values(entity));
    })

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
        "Class": "http://www.w3.org/2002/07/owl#Class",
        "NamedIndividual": "http://www.w3.org/2002/07/owl#NamedIndividual",
        "QuantitativeValue": "http://purl.org/goodrelations/v1#QuantitativeValue",
        "Recipe": "http://schema.org/Recipe",
        "Person": "http://schema.org/Person",
        "ItemList": "http://schema.org/ItemList",
        "HowToDirection": "http://schema.org/HowToDirection",
        "AggregateRating": "http://schema.org/AggregateRating",
        "DiabeticDiet": "http://schema.org/DiabeticDiet",
        "GlutenFreeDiet": "http://schema.org/GlutenFreeDiet",
        "LowCalorieDiet": "http://schema.org/LowCalorieDiet",
        "LowFatDiet": "http://schema.org/LowFatDiet",
        "LowLactoseDiet": "http://schema.org/LowLactoseDiet",
        "LowSaltDiet": "http://schema.org/LowSaltDiet",
        "VeganDiet": "http://schema.org/VeganDiet",
        "VegetarianDiet": "http://schema.org/VegetarianDiet",
        "NutritionInformation": "http://schema.org/NutritionInformation",
        "Ingredient": "http://example.org/ns#Ingredient",
        "Tag": "http://example.org/ns#Tag",
        "Course": "http://example.org/ns#Course",
        "Cusine": "http://example.org/ns#Cusine",
        "Calories": "http://example.org/ns#Calories",
        "ProteinContent": "http://example.org/ns#ProteinContent",
        "CarbohydrateContent": "http://example.org/ns#CarbohydrateContent",
        "SugarContent": "http://example.org/ns#SugarContent",
        "FatContent": "http://example.org/ns#FatContent",
        "SaturatedFatContent": "http://example.org/ns#SaturatedFatContent",
        "name": "http://schema.org/name",
        "description": "http://schema.org/description",
        "id": "http://schema.org/identifier",
        "label": "http://www.w3.org/2000/01/rdf-schema#label",
        "subClassOf": "http://www.w3.org/2000/01/rdf-schema#subClassOf",
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
        "unit": "http://purl.org/goodrelations/v1#hasUnitOfMeasurement",
        "quantity": {
            "@id": "http://purl.org/goodrelations/v1#hasValueFloat",
            "@type": XSD_FLOAT
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
        "kcal": "http://schema.org/calories",
        "carbohydrate": "http://schema.org/carbohydrateContent",
        "protein": "http://schema.org/proteinContent",
        "sugar": "http://schema.org/sugarContent",
        "fat": "http://schema.org/fatContent",
        "saturated_fat": "http://schema.org/saturatedFatContent",
    };
}

function buildClassDefinitions(context) {
    const QUANTITATIVE_VALUE = 'QuantitativeValue';
    const NAMED_INDIVIDUAL = 'NamedIndividual';

    const classes = [
        { name: 'Ingredient', subClassOf: NAMED_INDIVIDUAL },
        { name: 'Tag', subClassOf: NAMED_INDIVIDUAL },
        { name: 'Course', subClassOf: NAMED_INDIVIDUAL },
        { name: 'Cusine', subClassOf: NAMED_INDIVIDUAL },
        { name: 'Calories', subClassOf: QUANTITATIVE_VALUE },
        { name: 'ProteinContent', subClassOf: QUANTITATIVE_VALUE },
        { name: 'CarbohydrateContent', subClassOf: QUANTITATIVE_VALUE },
        { name: 'FatContent', subClassOf: QUANTITATIVE_VALUE },
        { name: 'SaturatedFatContent', subClassOf: QUANTITATIVE_VALUE },
        { name: 'SugarContent', subClassOf: QUANTITATIVE_VALUE },
    ];

    return classes.map((classInfo) => buildClassDefinition(classInfo, context));
}

function buildClassDefinition({ name, subClassOf }, context) {
    return {
        '@id': `http://example.org/ns#${name}`,
        type: 'Class',
        label: name,
        subClassOf: { '@id': context[subClassOf] },
    }
}

function extractIds(items) {
    return items.map((item) => ({ '@id': item['@id'] }));
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

function buildRecipeAggregateRating(ratings, recipeIri) {
    const RATING_TYPE = 'AggregateRating';

    return {
        '@id': `${recipeIri}/rating`,
        type: RATING_TYPE,
        rating_value: ratings,
    }
}

function buildRecipeNutritionInformation(nutrition, recipeIri) {
    const NUTRITION_IRI = `${recipeIri}/nutrition`;

    const PROPERTY_MAPPING = {
        carbohydrate: 'carbohydrate',
        protein: 'protein',
        fat: 'fat',
        kcalcalories: 'kcal',
        addedsuar: 'sugar',
        saturatedfat: 'saturatedFat',
    };

    const NUTRITION_MAPPING = {
        kcal: { type: 'Calories', unit: 'kcal'},
        sugar: { type: 'SugarContent', unit: 'g'},
        protein: { type: 'ProteinContent', unit: 'g'},
        carbohydrate: { type: 'CarbohydrateContent', unit: 'g'},
        fat: { type: 'FatContent', unit: 'g'},
        saturatedFat: { type: 'SaturatedFatContent', unit: 'g'},
    }

    const nutritionInfo = {
        '@id': NUTRITION_IRI,
        type: 'NutritionInformation',
    }

    nutrition.forEach((item) => {
        const nutritionKey = item.toLowerCase(item).replace(/[0-9.g ]/g, '');

        if (PROPERTY_MAPPING[nutritionKey]) {
            const propertyName = PROPERTY_MAPPING[nutritionKey];


            const { type, unit } = NUTRITION_MAPPING[propertyName];
            const quantity = parseNumber(item);

            nutritionInfo[propertyName] = {
                "@id": `${NUTRITION_IRI}/${propertyName}`,
                type,
                quantity,
                unit,
            };
        }
    });

    return nutritionInfo;
}

function buildRecipeDietTypes(diets, collections, context) {
    const DIET_MAPPING = {
        vegetarian: 'VegetarianDiet',
        vegan: 'VeganDiet',
        'low-salt': 'LowSaltDiet',
        'gluten-free': 'GlutenFreeDiet',
        'low-fat': 'LowFatDiet',
        'low-calorie': 'LowCalorieDiet',
        'dairy-free': 'LowLactoseDiet',
    }

    const recipeDiets = diets.map((diet) => DIET_MAPPING[diet.toLowerCase()])
        .filter((diet) => diet); // removes unknown diet types

    collections.forEach((collection) => {
        if (collection.toLowerCase() === 'diabetes-friendly') {
            recipeDiets.push('DiabeticDiet');
        }
    })

    return recipeDiets.map((diet) => ({ '@id': context[diet] }));
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

        if (item) {
            labeledItems.push({
                "@id": `${ITEM_BASE_IRI}/${convertToIri(item)}`,
                type,
                label: item,
            });
        }
    })

    return labeledItems;
}

function buildIngredients(ingredients) {
    return buildLabeledItems(ingredients, 'ingredient', 'Ingredient');
}

function buildTags(keywords) {
    return buildLabeledItems(keywords, 'tag', 'Tag');
}

function buildCusines(cusines) {
    return buildLabeledItems(cusines, 'cusine', 'Cusine');
}

function buildCourses(courses) {
    return buildLabeledItems(courses, 'course', 'Course');
}