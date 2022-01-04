package com.example.app.servlets;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import javax.servlet.http.*;
import javax.servlet.annotation.*;

import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.query.*;
import org.eclipse.rdf4j.query.resultio.text.csv.SPARQLResultsCSVWriter;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.repository.sparql.SPARQLRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.ntriples.NTriplesWriter;
import org.eclipse.rdf4j.sail.memory.MemoryStore;

@WebServlet(name = "recipesFromIngredientsServlet", value = "/recipes-from-ingredients-servlet")
public class RecipesFromIngredientsServlet extends HttpServlet {
    public void init() { }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Repository repo = new SailRepository(new MemoryStore());
        repo.init();

        File file = new File(this.getClass().getResource("/all-recipes.jsonld").getFile());
        String baseURI = "http://example.org/local";

        try {
            RepositoryConnection con = repo.getConnection();
            try {
                con.add(file, baseURI, RDFFormat.JSONLD);
                URL url = new URL("http://example.org/example/remote.jsonld");
                con.add(url, url.toString(), RDFFormat.JSONLD);

                String queryString = "SELECT ?x ?y WHERE { ?x ?p ?y } ";

                TupleQuery tupleQuery =
                        con.prepareTupleQuery(queryString);

                try (TupleQueryResult result = tupleQuery.evaluate()) {
                    while (result.hasNext()) { // iterate over the result
                        BindingSet bindingSet = result.next();
                        Value valueOfX = bindingSet.getValue("x");
                        Value valueOfY = bindingSet.getValue("y");
                        response.getWriter().println(valueOfX.toString());
                        response.getWriter().println(valueOfY.toString());
                    }
                }

            }
            finally {
                con.close();
            }
        } catch (Exception ex) {
            response.getWriter().println(ex);
        }



    /*



        SPARQLRepository repo = new SPARQLRepository("http://localhost:3330/linkedRecipes/sparql");
        repo.init();

        response.getWriter().println("Created sparql repository");

        Map<String, String> headers = new HashMap<String, String>();
        headers.put("Accept", "text/plain");
        repo.setAdditionalHttpHeaders(headers);
        response.getWriter().println("Set text/plain header");


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


        try (RepositoryConnection con = repo.getConnection()) {

            String queryString = "CONSTRUCT { ?s ?p ?o . } WHERE { ?s ?p ?o . } LIMIT 10";

            var graphQuery = con.prepareGraphQuery(QueryLanguage.SPARQL, queryString);
            RDFWriter writer = new NTriplesWriter(response.getWriter());
            graphQuery.evaluate(writer);

            response.getWriter().println("Evaluated graphQuery into response writer");

            var graphResult = graphQuery.evaluate();

            response.getWriter().println("Evaluated prepareGraphQuery");

            var statementList = QueryResults.stream(graphResult).toList();
            response.getWriter().println("Statement list size: " + statementList.size());
            for (var statement : statementList) {
                var subject = statement.getSubject();

                response.getWriter().println("Subject: " + subject.stringValue());
            }



            String queryString = "SELECT ?s WHERE { ?s ?p ?o . } LIMIT 10";
            response.getWriter().println(queryString);

            TupleQuery tupleQuery = con.prepareTupleQuery(QueryLanguage.SPARQL, queryString);
            TupleQueryResult result = tupleQuery.evaluate();

            response.getWriter().println("Evaluated prepareTupleQuery");

            List<BindingSet> bindings = QueryResults.stream(result).toList();

            response.getWriter().println("Bindings size: " + bindings.size());
            for (BindingSet binding : bindings) {
                Value valueOfS = binding.getValue("s");
                response.getWriter().println(valueOfS.toString());
            }

            response.getWriter().println("Finished bindings iteration");

        } catch (Exception ex) {
            response.getWriter().println(ex.getMessage());
            response.getWriter().println(ex.getCause());
            response.getWriter().println(ex.getStackTrace());
        }

        */
    }

    public void destroy() {
    }
}