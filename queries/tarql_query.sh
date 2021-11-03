tarql -H ./queries/all_recipes.sparql ./source/all_recipes.csv > ./results/all_recipes.ttl

tarql ./queries/food_recipes.sparql ./source/food_recipes.csv > ./results/food_recipes.ttl

tarql ./queries/bbc_recipes.sparql ./source/bbc_recipes.csv > ./results/bbc_recipes.ttl