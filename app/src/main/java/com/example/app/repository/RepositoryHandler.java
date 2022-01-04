package com.example.app.repository;

import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.memory.MemoryStore;

import java.io.IOException;
import java.io.InputStream;

public class RepositoryHandler {
    private Repository repository;
    private RepositoryConnection connection;

    public void initializeRepository() {
        repository = new SailRepository(new MemoryStore());
        repository.init();
    }

    public void initializeConnection() {
        connection = repository.getConnection();
        addAllDatasetsIntoConnection();
    }

    public void closeConnection() {
        connection.close();
    }

    public TupleQuery prepareConnectionTupleQuery(String query) {
        return connection.prepareTupleQuery(query);
    }

    private void addAllDatasetsIntoConnection() {
        addFileToConnection(connection, "all-recipes.jsonld", "allRecipes", RDFFormat.JSONLD);
        addFileToConnection(connection, "bbc-recipes.jsonld", "bbcRecipes", RDFFormat.JSONLD);
        addFileToConnection(connection, "food-recipes.jsonld", "foodRecipes", RDFFormat.JSONLD);
    }

    private void addFileToConnection(RepositoryConnection connection, String filePath, String fileName, RDFFormat fileFormat) {
        ClassLoader classloader = Thread.currentThread().getContextClassLoader();
        InputStream inputStream = classloader.getResourceAsStream(filePath);

        String baseURI = "http://example.org/resource/dataset/" + fileName;

        try {
            connection.add(inputStream, baseURI, fileFormat);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
