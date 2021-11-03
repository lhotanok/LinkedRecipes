tarql -H ./queries/all_recipes.sparql ./datasets/all_recipes.csv > ./results/all_recipes.ttl

tarql ./queries/food_recipes.sparql ./datasets/food_recipes.csv > ./results/food_recipes.ttl

tarql ./queries/bbc_recipes.sparql ./datasets/bbc_recipes.csv > ./results/bbc_recipes.ttl