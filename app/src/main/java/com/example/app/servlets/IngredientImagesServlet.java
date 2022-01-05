package com.example.app.servlets;

import j2html.tags.ContainerTag;
import org.eclipse.rdf4j.model.Statement;

import javax.servlet.annotation.WebServlet;

import static j2html.TagCreator.*;

@WebServlet(name = "ingredientImagesServlet", value = "/ingredient-images-servlet")
public class IngredientImagesServlet extends ConstructQueryServlet {
    @Override
    protected String createConstructQuery() {
        return "PREFIX ex: <http://example.org/ns#>\n" +
                "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n" +
                "PREFIX schema: <http://schema.org/>\n" +
                "PREFIX wdt: <http://www.wikidata.org/prop/direct/>\n" +
                "\n" +
                "CONSTRUCT {\n" +
                "    ?ingredient schema:image ?image .\n" +
                "}\n" +
                "WHERE {\n" +
                "    ?ingredient a ex:Ingredient .\n" +
                "    ?ingredient owl:sameAs ?sameIngredient .\n" +
                "    {\n" +
                "        SERVICE  <https://query.wikidata.org/bigdata/namespace/wdq/sparql> \n" +
                "        {\n" +
                "            ?sameIngredient wdt:P18 ?image .\n" +
                "        }\n" +
                "    }\n" +
                "}";
    }

    @Override
    protected ContainerTag buildContainer(Statement statement) {
        var ingredient = statement.getSubject().stringValue();
        var property =  statement.getPredicate().stringValue();
        var image = statement.getObject().stringValue();

        var ingredientUrlParts = ingredient.split("/");
        var ingredientName = ingredientUrlParts[ingredientUrlParts.length - 1];

        var imgElement = img()
                .withSrc(image)
                .withAlt(ingredientName)
                .withData("property", property)
                .withStyle("max-width: 300px");

        var divContainer = div(attrs(".ingredient"), h2(ingredientName), imgElement)
                .withHref(ingredient);

        return divContainer;
    }

    @Override
    protected String getPageTitle() {
        return "Ingredients with images";
    }
}
