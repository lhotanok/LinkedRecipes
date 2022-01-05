package com.example.app.servlets;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.*;
import javax.servlet.annotation.*;

import com.example.app.repository.RepositoryHandler;
import j2html.tags.ContainerTag;
import org.eclipse.rdf4j.query.*;
import static j2html.TagCreator.*;

@WebServlet(name = "recipesFromIngredientsServlet", value = "/recipes-from-ingredients-servlet")
public class RecipesFromIngredientsServlet extends QueryServlet {

    @Override
    protected ContainerTag buildContainer(BindingSet bindingSet) {
        var recipeName = bindingSet.getValue("recipeName").stringValue();
        var recipeUrl = bindingSet.getValue("recipe").stringValue();

        var divRecipeName = a(attrs(".recipeName"),
                h2(recipeName))
                .withData("property", "schema:name")
                .withHref(recipeUrl);

        var ingredientLabels = bindingSet.getValue("ingredientLabels").toString();
        var matchedIngredients = buildMatchedIngredients(ingredientLabels);

        var divMatchedIngredients = div(attrs(".ingredients"),
            h3("Matched ingredients"),
                matchedIngredients);

        var divContainer = div(attrs(".recipe"),
                divRecipeName,
                divMatchedIngredients)
                .withData("typeof", "schema:Recipe")
                .withData("prefix", "schema: http://schema.org/");

        return divContainer;
    }

    private ContainerTag buildMatchedIngredients(String ingredientLabels) {
        var trimmedLabels = ingredientLabels.substring(1, ingredientLabels.length() - 1);
        var parsedLabels = trimmedLabels.split(" \\| ");

        List<ContainerTag> tags = new ArrayList<>();
        for (var label : parsedLabels) {
            tags.add(li(div(attrs(".ingredient"), p(label))
                    .withData("property", "schema:recipeIngredient")));

        }

        return ul(each(tags, tag -> tag));
    }

    @Override
    protected String getPageTitle() {
        return "Recipes containing chicken and mozzarella";
    }

    @Override
    protected String createSelectQuery() {
        return  "PREFIX schema: <http://schema.org/>\n" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
                "PREFIX ex: <http://example.org/ns#>\n" +
                "\n" +
                "SELECT ?recipe ?recipeName (GROUP_CONCAT(?ingredientLabel;separator=\" | \") AS ?ingredientLabels)\n" +
                "WHERE {\n" +
                "    ?recipe schema:recipeIngredient ?ingredient .\n" +
                "    {\n" +
                "        ?ingredient rdfs:label ?ingredientLabel .\n" +
                "    } UNION {\n" +
                "        ?ingredient ex:ingredient ?ingredientEntity .\n" +
                "        ?ingredientEntity skos:prefLabel ?ingredientLabel .\n" +
                "    }\n" +
                "\n" +
                "    ?recipe schema:name ?recipeName .\n" +
                "\n" +
                "    VALUES ?requestedIngredients { \"chicken\" \"mozzarella\" \"broccoli\" }\n" +
                "    BIND(IF(CONTAINS(LCASE(STR(?ingredientLabel)), ?requestedIngredients), true, false) as ?containsIngredient)\n" +
                "    \n" +
                "    # Filter recipes that include queried ingredients (broccoli recipes will be excluded afterwards).\n" +
                "    FILTER(?containsIngredient = true)\n" +
                "}\n" +
                "GROUP BY ?recipe ?recipeName\n" +
                "HAVING (CONTAINS(LCASE(STR(?ingredientLabels)), \"chicken\")\n" +
                "  && CONTAINS(LCASE(STR(?ingredientLabels)), \"mozzarella\")\n" +
                "  && !CONTAINS(LCASE(STR(?ingredientLabels)), \"broccoli\"))\n";
    }
}