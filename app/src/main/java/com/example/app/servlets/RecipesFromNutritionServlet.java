package com.example.app.servlets;

import com.example.app.repository.RepositoryHandler;
import j2html.tags.ContainerTag;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static j2html.TagCreator.*;

@WebServlet(name = "recipesFromNutritionServlet", value = "/recipes-from-nutrition-servlet")
public class RecipesFromNutritionServlet extends QueryServlet {

    @Override
    protected ContainerTag buildContainer(BindingSet bindingSet) {
        var recipeName = bindingSet.getValue("recipeName").stringValue();
        var recipeUrl = bindingSet.getValue("recipe").stringValue();
        var proteinAmount = bindingSet.getValue("proteinAmount").stringValue();
        var carbohydrateAmount = bindingSet.getValue("carbohydrateAmount").stringValue();
        var rating = bindingSet.getValue("rating").stringValue();

        var divRecipeName = a(attrs(".recipeName"),
                h2(recipeName))
                .withData("property", "schema:name")
                .withHref(recipeUrl);

        var divProteinAmount = div(attrs(".proteinAmount"), strong("Protein: "), p(proteinAmount))
                .withData("property", "schema:proteinContent")
                .withData("unit", "g")
                .withValue(proteinAmount);

        var divCarbohydrateAmount = div(attrs(".carbohydrateAmount"), strong("Carbohydrate: "), p(carbohydrateAmount))
                .withData("property", "schema:carbohydrateContent")
                .withData("unit", "g")
                .withValue(carbohydrateAmount);

        var divNutrition = div(attrs(".nutrition"),
                h3("Nutrition"),
                divProteinAmount,
                divCarbohydrateAmount);

        var divRating = div(attrs(".rating"),
                h3("Rating"),
                p(rating + "%").withValue(rating));

        var divContainer = div(attrs(".recipe"),
                divRecipeName,
                divNutrition,
                divRating)
                .withData("typeof", "schema:Recipe");

        return divContainer;
    }

    @Override
    protected String getPageTitle() {
        return "Recipes with high protein content and low carbohydrate content";
    }

    @Override
    protected String createSelectQuery() {
        return  "PREFIX schema: <http://schema.org/>\n" +
                "PREFIX gr: <http://purl.org/goodrelations/v1#>\n" +
                "\n" +
                "SELECT ?recipe ?recipeName ?proteinAmount ?carbohydrateAmount ?rating\n" +
                "WHERE {\n" +
                "    ?recipe schema:nutrition ?nutrition ;\n" +
                "            schema:aggregateRating ?aggregateRating ;\n" +
                "            schema:name ?recipeName .\n" +
                "\n" +
                "    ?nutrition schema:proteinContent ?protein .\n" +
                "    ?nutrition schema:carbohydrateContent ?carbohydrate .\n" +
                "  \n" +
                "    ?protein gr:hasValueFloat ?proteinAmount .\n" +
                "    ?carbohydrate gr:hasValueFloat ?carbohydrateAmount .\n" +
                "    \n" +
                "    ?aggregateRating schema:ratingValue ?rating .\n" +
                "    \n" +
                "    FILTER ( ?proteinAmount > 50 && ?carbohydrateAmount < 12 ) \n" +
                "}\n" +
                "ORDER BY DESC(?rating)";
    }
}