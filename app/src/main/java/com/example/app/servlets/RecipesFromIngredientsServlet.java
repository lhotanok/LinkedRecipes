package com.example.app.servlets;

import java.io.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;

import com.example.app.repository.RepositoryHandler;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.query.*;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;

@WebServlet(name = "recipesFromIngredientsServlet", value = "/recipes-from-ingredients-servlet")
public class RecipesFromIngredientsServlet extends HttpServlet {
    public void init() { }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        RepositoryHandler repositoryHandler = new RepositoryHandler();
        repositoryHandler.initializeRepository();

        try {
            repositoryHandler.initializeConnection();

            TupleQuery tupleQuery = repositoryHandler.prepareConnectionTupleQuery(createSelectQuery());
            TupleQueryResult result = tupleQuery.evaluate();

            while (result.hasNext()) {
                BindingSet bindingSet = result.next();
                Value valueOfX = bindingSet.getValue("recipe");
                response.getWriter().println(valueOfX.toString());
            }

        } catch (Exception ex) {
            response.getWriter().println(ex);
        } finally {
            repositoryHandler.closeConnection();
        }
    }

    public void destroy() {
    }

    private String createSelectQuery() {
        return "PREFIX schema: <http://schema.org/>\n" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
                "PREFIX ex: <http://example.org/ns#>\n" +
                "\n" +
                "SELECT ?recipe (GROUP_CONCAT(?ingredientLabel;separator=\" | \") AS ?ingredientLabels)\n" +
                "WHERE {\n" +
                "    ?recipe schema:recipeIngredient ?ingredient .\n" +
                "    {\n" +
                "        ?ingredient rdfs:label ?ingredientLabel .\n" +
                "    } UNION {\n" +
                "        ?ingredient ex:ingredient ?ingredientEntity .\n" +
                "        ?ingredientEntity skos:prefLabel ?ingredientLabel .\n" +
                "    }\n" +
                "\n" +
                "    VALUES ?requestedIngredients { \"chicken\" \"mozzarella\" \"broccoli\" }\n" +
                "    BIND(IF(CONTAINS(LCASE(STR(?ingredientLabel)), ?requestedIngredients), true, false) as ?containsIngredient)\n" +
                "    \n" +
                "    # Filter recipes that include queried ingredients (broccoli recipes will be excluded afterwards).\n" +
                "    FILTER(?containsIngredient = true)\n" +
                "}\n" +
                "GROUP BY ?recipe\n" +
                "HAVING (CONTAINS(LCASE(STR(?ingredientLabels)), \"chicken\")\n" +
                "  && CONTAINS(LCASE(STR(?ingredientLabels)), \"mozzarella\")\n" +
                "  && !CONTAINS(LCASE(STR(?ingredientLabels)), \"broccoli\"))";
    }
}