package com.example.app.jena;

import org.apache.jena.fuseki.main.FusekiServer;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.javatuples.Pair;

import java.util.ArrayList;
import java.util.List;

public class TriplestoreInitializer {
    public static void initializeDatasets() {
        var dataset = DatasetFactory.createGeneral();

        List<Pair<String, String>> recipeGraphs = new ArrayList<>();
        recipeGraphs.add(new Pair("all-recipes.jsonld", "http://example.org/resource/dataset/allRecipes"));
        recipeGraphs.add(new Pair("bbc-recipes.jsonld", "http://example.org/resource/dataset/bbcRecipes"));
        recipeGraphs.add(new Pair("food-recipes.jsonld", "http://example.org/resource/dataset/foodRecipes"));

        for (var pair: recipeGraphs) {
            Model model = ModelFactory.createDefaultModel();
            model.read (pair.getValue0(),"JSON-LD");
            dataset.addNamedModel(pair.getValue1(), model);
        }

        FusekiServer server = FusekiServer.create()
                .add("/linkedRecipes", dataset)
                .build();

        server.start();
    }
}
