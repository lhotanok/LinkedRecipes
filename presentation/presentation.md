# Linked Recipes

## Dataset sources

### Apify scraper

<img src="..\presentation\images\allrecipes-actor.png" />

<img src="..\presentation\images\allrecipes-actor-input.png" />

<img src="..\presentation\images\allrecipes-actor-input-extend.png" />

### Kaggle dataset

<img src="..\presentation\images\kaggle-foodrecipes-dataset.png" />

### Dataset UML class model

<img src="..\source\diagram.png" />

## Triplification

- Separate items from arrays represented as string
- Structured quantitative values (amount + unit)

```javascript
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
            prepTime: buildRecipeTimeMinutes(prepTime, 'prepTime', RECIPE_IRI),
            cookTime: buildRecipeTimeMinutes(cookTime, 'cookTime', RECIPE_IRI),
            totalTime: buildRecipeTimeMinutes(totalTime, 'totalTime', RECIPE_IRI),
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
```

### JSON-LD ➡ N-QUADS

Silk doesn't list json-ld format among supported rdf formats.

```bash
jsonld normalize -q "./food-recipes/output/food-recipes.jsonld" > "./food-recipes/output/food-recipes.nq"
```

## Linking

### Entities

- Ingredients (singular vs plural, doubled characters)
- Tags
- Cusines
- Calories (exact match)
- Recipes (based on names)

### External graphs

- Dbpedia
- Wikidata

## Queries

- Ingredients with description from dbpedia and images from wikidata
- Recipe search based on required set of ingredients
- Recipe search based on nutrition information (high protein content, low carbohydrate content... )

## App

<img src="..\presentation\images\select-query-app-result.png" />

<img src="..\presentation\images\select-query-app-result-2.png" />

