package com.example.app.servlets;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.servlet.http.*;
import javax.servlet.annotation.*;

import org.apache.jena.query.*;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.Query;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.query.*;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sparql.SPARQLRepository;
import org.eclipse.rdf4j.repository.util.Repositories;

@WebServlet(name = "recipesFromIngredientsServlet", value = "/recipes-from-ingredients-servlet")
public class RecipesFromIngredientsServlet extends HttpServlet {
    public void init() { }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.getWriter().println("Creating sparql repository");
        Repository repo = new SPARQLRepository("http://localhost:3330/linkedRecipes/sparql");
        repo.init();
        RepositoryConnection connection = repo.getConnection();


        response.getWriter().println("Created sparql repository");

        /*
        String queryString = "PREFIX schema: <http://schema.org/>\n" +
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
                "    BIND(IF(CONTAINS(LCASE(STR(?ingredientLabel)), \"chicken\"), true, false) as ?containsChicken) .\n" +
                "    BIND(IF(CONTAINS(LCASE(STR(?ingredientLabel)), \"mozzarella\"), true, false) as ?containsMozzarella) .\n" +
                "  \tBIND(IF(CONTAINS(LCASE(STR(?ingredientLabel)), \"broccoli\"), true, false) as ?containsBroccoli) .\n" +
                "    \n" +
                "    # Filter recipes that include queried ingredients (broccoli recipes will be excluded afterwards).\n" +
                "    FILTER(?containsChicken = true || ?containsMozzarella = true || ?containsBroccoli = true)\n" +
                "}\n" +
                "GROUP BY ?recipe\n" +
                "HAVING (CONTAINS(LCASE(STR(?ingredientLabels)), \"chicken\")\n" +
                "  && CONTAINS(LCASE(STR(?ingredientLabels)), \"mozzarella\")\n" +
                "  && !CONTAINS(LCASE(STR(?ingredientLabels)), \"broccoli\"))";
         */

        String queryString = "SELECT DISTINCT ?s WHERE { ?s ?p ?o }";

        response.getWriter().println(queryString);

        TupleQueryResult result =
                connection.prepareTupleQuery(QueryLanguage.SPARQL, queryString).evaluate();

        response.getWriter().println("Evaluated prepared tuple query");

        while(result.hasNext()) {
            BindingSet bs = result.next();
            Value route = bs.getValue("s");
            response.getWriter().println("s = " + route.stringValue());
        }

        response.getWriter().println("Finished result iteration");

        // List<BindingSet> bindings = Repositories.tupleQuery(repo, queryString, r -> QueryResults.asList(r));

        /*
        response.getWriter().println("Bindings");
        response.getWriter().println(bindings.size());

        for (BindingSet binding : bindings) {
            Value valueOfG = binding.getValue("s");

            response.getWriter().println(valueOfG.stringValue());
        }

         */
    }

    public void destroy() {
    }
}