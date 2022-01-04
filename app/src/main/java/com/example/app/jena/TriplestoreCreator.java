package com.example.app.jena;

import org.apache.jena.fuseki.main.FusekiServer;
import org.apache.jena.graph.Graph;
import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.sparql.core.DatasetGraphCollection;
import org.apache.jena.sparql.core.DatasetGraphFactory;
import org.apache.jena.sparql.graph.GraphFactory;
import org.eclipse.rdf4j.repository.dataset.config.DatasetRepositoryFactory;

import java.util.ArrayList;
import java.util.List;

public class TriplestoreCreator {
    public static void initializeDatasets() {
        List<String> recipeGraphs = new ArrayList<>();
        recipeGraphs.add("all-recipes.jsonld");
        recipeGraphs.add("bbc-recipes.jsonld");
        recipeGraphs.add("food-recipes.jsonld");


        Dataset mergedRecipeDatasets = DatasetFactory.createNamed(recipeGraphs);

        FusekiServer server = FusekiServer.create()
                .add("/linkedRecipes", mergedRecipeDatasets)
                .build();

        server.start();
    }
}
